/**
 * URL building utilities for search engines
 * Single Responsibility: Build search URLs for different engines and search types
 */

export type SearchEngine = "google" | "duckduckgo" | "bing";
export type SearchType = "web" | "image" | "video" | "news";

/**
 * Build a search URL based on engine and type
 */
export function buildSearchUrl(
  query: string,
  engine: string,
  type: SearchType = "web",
  useHtml: boolean = false,
): string {
  const encodedQuery = encodeURIComponent(query);

  if (engine === "duckduckgo") {
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

  if (engine === "bing") {
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

  // Google fallback
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
 * Get the CSS selector to wait for based on search type
 */
export function getWaitForSelector(type: SearchType): string {
  switch (type) {
    case "image":
      return ".tile--img, .tile-wrap, .zci-wrap";
    case "video":
      return ".tile--vid, .module--carousel";
    case "news":
      return ".result--news, .result";
    default:
      return ".result";
  }
}
