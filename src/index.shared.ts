// =============================================================================
// @onegenui/web-search - Shared Exports (platform-agnostic)
// =============================================================================

// Types
export * from "./types.js";

// Utilities
export * from "./utils/index.js";

// Hexagonal Architecture Exports
export * from "./ports/index.js";
export * from "./use-cases/index.js";

// Crawler utilities
export {
  buildSearchUrl,
  normalizeSearchType,
  type SearchType,
  type SearchEngine,
} from "./crawler/url-builder.js";
export {
  parseSearchResults,
  parseImageResults,
  parseVideoResults,
  parseJsonResults,
} from "./crawler/result-parsers.js";
