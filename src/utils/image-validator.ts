/**
 * Image validation utilities - parallel validation without blocking.
 */

import type { ExtractedImage } from "../types";
import {
  isReliableDomain,
  isUnreliableDomain,
} from "./image-domains";

// Re-export for backward compatibility
export { isReliableDomain, isUnreliableDomain } from "./image-domains";

const MIN_HD_WIDTH = 800;
const MIN_HD_HEIGHT = 600;

export function isHDImage(img: ExtractedImage): boolean {
  if (!img.width || !img.height) return false;
  return img.width >= MIN_HD_WIDTH && img.height >= MIN_HD_HEIGHT;
}

/** Score image quality (higher = better). */
export function scoreImage(img: ExtractedImage): number {
  let score = 0;

  if (img.width && img.height) {
    const pixels = img.width * img.height;
    if (pixels >= 1920 * 1080) score += 50;
    else if (pixels >= 1280 * 720) score += 40;
    else if (pixels >= 800 * 600) score += 30;
    else if (pixels >= 400 * 300) score += 15;
  } else {
    score += 20;
  }

  if (isReliableDomain(img.src)) score += 30;
  else if (isUnreliableDomain(img.src)) score -= 50;
  else score += 10;

  if (img.alt && img.alt.length > 3) score += 10;
  if (img.score) score += img.score;

  return score;
}

/** Validate a single image URL via HEAD request. */
export async function validateImageUrl(
  url: string,
  timeout = 3000,
): Promise<boolean> {
  if (isUnreliableDomain(url)) return false;
  if (isReliableDomain(url)) return true;

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
    const contentType = response.headers.get("content-type") || "";
    return response.ok && contentType.startsWith("image/");
  } catch {
    return false;
  }
}

/** Validate images in parallel, return scored and validated top N. */
export async function validateAndScoreImages(
  images: ExtractedImage[],
  options: { maxImages?: number; timeout?: number; requireHD?: boolean } = {},
): Promise<ExtractedImage[]> {
  const { maxImages = 10, timeout = 3000, requireHD = false } = options;

  const candidates = images.filter((img) => {
    if (!img.src) return false;
    if (isUnreliableDomain(img.src)) return false;
    if (requireHD && !isHDImage(img)) return false;
    return true;
  });

  const scored = candidates
    .map((img) => ({ img, score: scoreImage(img) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxImages * 2);

  const validated = await Promise.all(
    scored.map(async ({ img, score }) => ({
      img,
      score,
      valid: await validateImageUrl(img.src, timeout),
    })),
  );

  return validated
    .filter((r) => r.valid)
    .slice(0, maxImages)
    .map((r) => r.img);
}

/** Select best image without network validation (quick). */
export function selectBestImage(images: ExtractedImage[]): ExtractedImage | null {
  if (!images.length) return null;

  const reliable = images.filter((img) => !isUnreliableDomain(img.src));
  if (!reliable.length) return images[0] ?? null;

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
