/**
 * Image validation utilities - parallel validation without blocking
 *
 * Validates image URLs are accessible and prefers high-resolution images.
 */

import type { ExtractedImage } from "../types";

// Minimum resolution for "high quality" images
const MIN_HD_WIDTH = 800;
const MIN_HD_HEIGHT = 600;

// Reliable image domains that typically don't have broken images
const RELIABLE_DOMAINS = new Set([
  "unsplash.com",
  "images.unsplash.com",
  "images.pexels.com",
  "cdn.pixabay.com",
  "cache.marriott.com",
  "photos.hotelbeds.com",
  "cf.bstatic.com", // booking.com
  "q-xx.bstatic.com", // booking.com
  "images.trvl-media.com", // Expedia
  "media-cdn.tripadvisor.com",
  "lh3.googleusercontent.com",
  "i.ytimg.com",
]);

// Domains that are known to be problematic
const UNRELIABLE_DOMAINS = new Set([
  "placeholder.com",
  "via.placeholder.com",
  "example.com",
  "placehold.it",
  "dummyimage.com",
  "picsum.photos", // Can be slow/unreliable
]);

/**
 * Check if URL is from a reliable domain
 */
export function isReliableDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return (
      RELIABLE_DOMAINS.has(hostname) ||
      Array.from(RELIABLE_DOMAINS).some((d) => hostname.endsWith(`.${d}`))
    );
  } catch {
    return false;
  }
}

/**
 * Check if URL is from a known unreliable domain
 */
export function isUnreliableDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return (
      UNRELIABLE_DOMAINS.has(hostname) ||
      Array.from(UNRELIABLE_DOMAINS).some((d) => hostname.endsWith(`.${d}`))
    );
  } catch {
    return true; // Invalid URL = unreliable
  }
}

/**
 * Check if image dimensions indicate HD quality
 */
export function isHDImage(img: ExtractedImage): boolean {
  if (!img.width || !img.height) return false;
  return img.width >= MIN_HD_WIDTH && img.height >= MIN_HD_HEIGHT;
}

/**
 * Calculate image score based on various factors
 * Higher score = better quality
 */
export function scoreImage(img: ExtractedImage): number {
  let score = 0;

  // Resolution score (0-50 points)
  if (img.width && img.height) {
    const pixels = img.width * img.height;
    if (pixels >= 1920 * 1080) score += 50; // Full HD+
    else if (pixels >= 1280 * 720) score += 40; // HD
    else if (pixels >= 800 * 600) score += 30; // Medium
    else if (pixels >= 400 * 300) score += 15; // Small
    // Tiny images get 0 points
  } else {
    // Unknown dimensions - moderate score
    score += 20;
  }

  // Domain reliability (0-30 points)
  if (isReliableDomain(img.src)) {
    score += 30;
  } else if (isUnreliableDomain(img.src)) {
    score -= 50; // Penalize known bad domains
  } else {
    score += 10; // Unknown domain
  }

  // Alt text presence (0-10 points)
  if (img.alt && img.alt.length > 3) {
    score += 10;
  }

  // Existing score from extraction
  if (img.score) {
    score += img.score;
  }

  return score;
}

/**
 * Validate a single image URL via HEAD request
 * Returns true if accessible, false otherwise
 */
export async function validateImageUrl(
  url: string,
  timeout = 3000,
): Promise<boolean> {
  // Skip unreliable domains
  if (isUnreliableDomain(url)) {
    return false;
  }

  // Trust reliable domains without checking
  if (isReliableDomain(url)) {
    return true;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; OneGenUI/1.0; Image Validator)",
      },
    });

    clearTimeout(timeoutId);

    // Check if it's actually an image
    const contentType = response.headers.get("content-type") || "";
    const isImage = contentType.startsWith("image/");

    return response.ok && isImage;
  } catch {
    return false;
  }
}

/**
 * Validate multiple images in parallel (non-blocking)
 * Returns images that passed validation, sorted by score
 */
export async function validateAndScoreImages(
  images: ExtractedImage[],
  options: {
    maxImages?: number;
    timeout?: number;
    requireHD?: boolean;
  } = {},
): Promise<ExtractedImage[]> {
  const { maxImages = 10, timeout = 3000, requireHD = false } = options;

  // Pre-filter unreliable domains and optionally non-HD
  const candidates = images.filter((img) => {
    if (!img.src) return false;
    if (isUnreliableDomain(img.src)) return false;
    if (requireHD && !isHDImage(img)) return false;
    return true;
  });

  // Score and sort
  const scored = candidates.map((img) => ({
    img,
    score: scoreImage(img),
  }));
  scored.sort((a, b) => b.score - a.score);

  // Take top candidates for validation
  const topCandidates = scored.slice(0, maxImages * 2); // Validate 2x to account for failures

  // Validate in parallel
  const validationResults = await Promise.all(
    topCandidates.map(async ({ img, score }) => ({
      img,
      score,
      valid: await validateImageUrl(img.src, timeout),
    })),
  );

  // Filter valid and return top N
  return validationResults
    .filter((r) => r.valid)
    .slice(0, maxImages)
    .map((r) => r.img);
}

/**
 * Select the best image from a list (quick, no validation)
 * Useful when you need just one image quickly
 */
export function selectBestImage(images: ExtractedImage[]): ExtractedImage | null {
  if (!images.length) return null;

  // Filter out unreliable
  const reliable = images.filter((img) => !isUnreliableDomain(img.src));
  if (!reliable.length) return images[0] ?? null; // Fallback to first if all unreliable

  // Score and pick best
  let best: ExtractedImage = reliable[0]!;
  let bestScore = scoreImage(best);

  for (let i = 1; i < reliable.length; i++) {
    const img = reliable[i]!;
    const score = scoreImage(img);
    if (score > bestScore) {
      best = img;
      bestScore = score;
    }
  }

  return best;
}
