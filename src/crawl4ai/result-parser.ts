/**
 * Search result parsing utilities
 * Single Responsibility: Parse search results from different formats
 */

import type {
  SearchResult,
  ScrapeResult,
  ExtractedImage,
  ExtractedVideo,
} from "../types";

/**
 * Parse DuckDuckGo HTML search results from markdown
 */
export function parseSearchResults(
  markdown: string,
  maxResults: number,
): SearchResult[] {
  const results: SearchResult[] = [];
  const seenUrls = new Set<string>();

  // DuckDuckGo format: ## [Title](https://duckduckgo.com/l/?uddg=ENCODED_URL...)
  const headingLinkRegex = /##\s*\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  while (
    (match = headingLinkRegex.exec(markdown)) !== null &&
    results.length < maxResults
  ) {
    const title = match[1]?.trim() ?? "";
    let rawUrl = match[2]?.trim() ?? "";

    if (!title || !rawUrl) continue;

    // Extract actual URL from DuckDuckGo redirect
    let actualUrl = rawUrl;
    if (
      rawUrl.includes("duckduckgo.com/l/?uddg=") ||
      rawUrl.includes("duckduckgo.com/l?")
    ) {
      try {
        const urlObj = new URL(rawUrl);
        const encodedUrl = urlObj.searchParams.get("uddg");
        if (encodedUrl) {
          actualUrl = decodeURIComponent(encodedUrl);
        }
      } catch {
        continue;
      }
    }

    // Skip duplicates and internal links
    if (seenUrls.has(actualUrl)) continue;
    if (
      actualUrl.includes("duckduckgo.com") ||
      actualUrl.includes("google.com/search") ||
      actualUrl.includes("bing.com/search")
    ) {
      continue;
    }

    seenUrls.add(actualUrl);

    // Extract snippet from text after the heading
    const matchEnd = (match.index ?? 0) + match[0].length;
    const snippetArea = markdown.slice(matchEnd, matchEnd + 500);
    const nextHeading = snippetArea.indexOf("##");
    const snippetText =
      nextHeading > 0
        ? snippetArea.slice(0, nextHeading)
        : snippetArea.slice(0, 200);

    const snippet = snippetText
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[#*_\[\]]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 150);

    results.push({
      title,
      url: actualUrl,
      snippet: snippet || title,
    });
  }

  return results;
}

/**
 * Parse image search results from scraped media
 */
export function parseImageResults(
  pageContent: ScrapeResult,
  maxResults: number,
): SearchResult[] {
  const results: SearchResult[] = [];

  // Prefer enhanced media.images, fallback to legacy images
  const enhancedImages = pageContent.media?.images || [];
  const legacyImages = pageContent.images || [];

  // Process enhanced images first
  for (const img of enhancedImages.slice(0, maxResults)) {
    results.push({
      title: img.alt || img.title || "Image",
      url: img.src,
      snippet: img.description || img.alt || "",
      media: {
        url: img.src,
        thumbnail: img.src,
        dimensions:
          img.width && img.height
            ? { width: img.width, height: img.height }
            : undefined,
      },
    });
  }

  // If no enhanced images, use legacy format
  if (results.length === 0) {
    for (const img of legacyImages.slice(0, maxResults)) {
      results.push({
        title: img.alt || "Image",
        url: img.src,
        snippet: img.alt || "",
        media: {
          url: img.src,
          thumbnail: img.src,
        },
      });
    }
  }

  return results;
}

/**
 * Parse video search results from scraped media
 */
export function parseVideoResults(
  pageContent: ScrapeResult,
  maxResults: number,
): SearchResult[] {
  const results: SearchResult[] = [];
  const videos = pageContent.media?.videos || [];

  for (const vid of videos.slice(0, maxResults)) {
    results.push({
      title: vid.title || "Video",
      url: vid.src || vid.embedUrl || "",
      snippet: vid.description || "",
      media: {
        url: vid.embedUrl || vid.src,
        thumbnail: vid.thumbnail,
        duration: vid.duration ? String(vid.duration) : undefined,
        provider: vid.provider,
      },
    });
  }

  return results;
}
