/**
 * Image processing helpers shared between tools.ts and tools.native.ts.
 * Handles image validation, scoring, and output formatting.
 */

import type { ScrapeResult } from "./types";

interface ImageInput {
  src: string;
  alt?: string;
}

interface ImageOutput {
  src: string;
  alt: string;
}

/** Validate and process images for a scrape result. */
export async function processImages(
  result: ScrapeResult,
  options: {
    validate: boolean;
    preferHD: boolean;
    maxImages?: number;
    timeout?: number;
  },
): Promise<ScrapeResult> {
  if (!result.images || result.images.length === 0) return result;

  const { validateAndScoreImages, selectBestImage } = await import(
    "./utils/image-validator.js"
  );

  const extendedImages: ImageInput[] = result.images.map((img) => ({
    src: img.src,
    alt: img.alt,
  }));

  if (options.validate) {
    const validated = await validateAndScoreImages(extendedImages, {
      maxImages: options.maxImages ?? 10,
      timeout: options.timeout ?? 3000,
      requireHD: options.preferHD,
    });
    const outputImages: ImageOutput[] = validated.map(
      (img: ImageInput) => ({ src: img.src, alt: img.alt ?? "" }),
    );
    return { ...result, images: outputImages };
  }

  const best = selectBestImage(extendedImages);
  if (!best) return result;

  const bestOutput: ImageOutput = { src: best.src, alt: best.alt ?? "" };
  return {
    ...result,
    images: [bestOutput, ...result.images.filter((i) => i.src !== best.src)],
  };
}

/** Validate images for a batch scrape result (fewer per URL). */
export async function processBatchImages(
  result: ScrapeResult,
): Promise<ScrapeResult> {
  return processImages(result, {
    validate: true,
    preferHD: true,
    maxImages: 5,
    timeout: 2000,
  });
}
