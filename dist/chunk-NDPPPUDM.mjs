// src/utils/image-validator.ts
var MIN_HD_WIDTH = 800;
var MIN_HD_HEIGHT = 600;
var RELIABLE_DOMAINS = /* @__PURE__ */ new Set([
  "unsplash.com",
  "images.unsplash.com",
  "images.pexels.com",
  "cdn.pixabay.com",
  "cache.marriott.com",
  "photos.hotelbeds.com",
  "cf.bstatic.com",
  // booking.com
  "q-xx.bstatic.com",
  // booking.com
  "images.trvl-media.com",
  // Expedia
  "media-cdn.tripadvisor.com",
  "lh3.googleusercontent.com",
  "i.ytimg.com"
]);
var UNRELIABLE_DOMAINS = /* @__PURE__ */ new Set([
  "placeholder.com",
  "via.placeholder.com",
  "example.com",
  "placehold.it",
  "dummyimage.com",
  "picsum.photos"
  // Can be slow/unreliable
]);
function isReliableDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    return RELIABLE_DOMAINS.has(hostname) || Array.from(RELIABLE_DOMAINS).some((d) => hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
}
function isUnreliableDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    return UNRELIABLE_DOMAINS.has(hostname) || Array.from(UNRELIABLE_DOMAINS).some((d) => hostname.endsWith(`.${d}`));
  } catch {
    return true;
  }
}
function isHDImage(img) {
  if (!img.width || !img.height) return false;
  return img.width >= MIN_HD_WIDTH && img.height >= MIN_HD_HEIGHT;
}
function scoreImage(img) {
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
  if (isReliableDomain(img.src)) {
    score += 30;
  } else if (isUnreliableDomain(img.src)) {
    score -= 50;
  } else {
    score += 10;
  }
  if (img.alt && img.alt.length > 3) {
    score += 10;
  }
  if (img.score) {
    score += img.score;
  }
  return score;
}
async function validateImageUrl(url, timeout = 3e3) {
  if (isUnreliableDomain(url)) {
    return false;
  }
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
        "User-Agent": "Mozilla/5.0 (compatible; OneGenUI/1.0; Image Validator)"
      }
    });
    clearTimeout(timeoutId);
    const contentType = response.headers.get("content-type") || "";
    const isImage = contentType.startsWith("image/");
    return response.ok && isImage;
  } catch {
    return false;
  }
}
async function validateAndScoreImages(images, options = {}) {
  const { maxImages = 10, timeout = 3e3, requireHD = false } = options;
  const candidates = images.filter((img) => {
    if (!img.src) return false;
    if (isUnreliableDomain(img.src)) return false;
    if (requireHD && !isHDImage(img)) return false;
    return true;
  });
  const scored = candidates.map((img) => ({
    img,
    score: scoreImage(img)
  }));
  scored.sort((a, b) => b.score - a.score);
  const topCandidates = scored.slice(0, maxImages * 2);
  const validationResults = await Promise.all(
    topCandidates.map(async ({ img, score }) => ({
      img,
      score,
      valid: await validateImageUrl(img.src, timeout)
    }))
  );
  return validationResults.filter((r) => r.valid).slice(0, maxImages).map((r) => r.img);
}
function selectBestImage(images) {
  if (!images.length) return null;
  const reliable = images.filter((img) => !isUnreliableDomain(img.src));
  if (!reliable.length) return images[0] ?? null;
  let best = reliable[0];
  let bestScore = scoreImage(best);
  for (let i = 1; i < reliable.length; i++) {
    const img = reliable[i];
    const score = scoreImage(img);
    if (score > bestScore) {
      best = img;
      bestScore = score;
    }
  }
  return best;
}

export {
  isReliableDomain,
  isUnreliableDomain,
  isHDImage,
  scoreImage,
  validateImageUrl,
  validateAndScoreImages,
  selectBestImage
};
//# sourceMappingURL=chunk-NDPPPUDM.mjs.map