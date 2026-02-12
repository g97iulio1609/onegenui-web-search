// =============================================================================
// @onegenui/web-search - React Native Compatible Entry Point
// =============================================================================
// Excludes agent-browser (Node CLI), BrowserService, and file-based logger.
// OneCrawl adapters are the sole search/scrape providers.

// Types
export * from "./types.js";

// Logger (console-only, no fs/path)
export * from "./logger.native.js";

// Tools (no web-snapshot, no BrowserService fallback)
export * from "./tools.native.js";

// Utilities
export * from "./utils/index.js";

// Hexagonal Architecture Exports
export * from "./ports/index.js";
export * from "./adapters/index.native.js";
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
