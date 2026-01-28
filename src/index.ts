// =============================================================================
// @onegenui/web-search - Main Barrel Export
// =============================================================================

// Types
export * from "./types";

// Services
export * from "./browser-service";

// Utilities
export * from "./logger";
export * from "./tools";

// Hexagonal Architecture Exports
export * from "./ports";
export * from "./adapters";
export * from "./use-cases";

// Crawler utilities
export {
  buildSearchUrl,
  normalizeSearchType,
  type SearchType,
  type SearchEngine,
} from "./crawler/url-builder";
export {
  parseSearchResults,
  parseImageResults,
  parseVideoResults,
  parseJsonResults,
} from "./crawler/result-parsers";
