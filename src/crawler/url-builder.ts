/**
 * Search URL builders for various search engines
 */

export type SearchType = "web" | "image" | "video" | "news";
export type SearchEngine = "google" | "duckduckgo" | "bing";

/**
 * Build a search URL for the specified engine and search type
 */
export function buildSearchUrl(
  query: string,
  engine: SearchEngine,
  type: SearchType = "web",
  useHtml: boolean = false,
): string {
  const encodedQuery = encodeURIComponent(query);

  if (engine === "duckduckgo") {
    return buildDuckDuckGoUrl(encodedQuery, type, useHtml);
  }

  if (engine === "bing") {
    return buildBingUrl(encodedQuery, type);
  }

  // Google fallback
  return buildGoogleUrl(encodedQuery, type);
}

function buildDuckDuckGoUrl(
  encodedQuery: string,
  type: SearchType,
  useHtml: boolean,
): string {
  // Use HTML version for reliability (no JS required)
  if (useHtml && (type === "web" || type === "news")) {
    return `https://html.duckduckgo.com/html/?q=${encodedQuery}`;
  }

  switch (type) {
    case "image":
      return `https://duckduckgo.com/?q=${encodedQuery}&iax=images&ia=images`;
    case "video":
      return `https://duckduckgo.com/?q=${encodedQuery}&iax=videos&ia=videos`;
    case "news":
      return `https://duckduckgo.com/?q=${encodedQuery}&iar=news&ia=news`;
    case "web":
    default:
      return `https://duckduckgo.com/?q=${encodedQuery}&ia=web`;
  }
}

function buildBingUrl(encodedQuery: string, type: SearchType): string {
  switch (type) {
    case "image":
      return `https://www.bing.com/images/search?q=${encodedQuery}`;
    case "video":
      return `https://www.bing.com/videos/search?q=${encodedQuery}`;
    case "news":
      return `https://www.bing.com/news/search?q=${encodedQuery}`;
    case "web":
    default:
      return `https://www.bing.com/search?q=${encodedQuery}`;
  }
}

function buildGoogleUrl(encodedQuery: string, type: SearchType): string {
  const tbm =
    type === "image"
      ? "isch"
      : type === "video"
        ? "vid"
        : type === "news"
          ? "nws"
          : "";
  return `https://www.google.com/search?q=${encodedQuery}${tbm ? `&tbm=${tbm}` : ""}`;
}

/**
 * Normalize search type from user input to valid enum value
 */
export function normalizeSearchType(rawType: string | undefined): SearchType {
  const normalized = rawType?.toLowerCase();
  if (
    normalized === "image" ||
    normalized === "imagecontent" ||
    normalized === "images"
  ) {
    return "image";
  }
  if (normalized === "video" || normalized === "videos") {
    return "video";
  }
  if (normalized === "news") {
    return "news";
  }
  return "web";
}
