// =============================================================================
// @onegenui/web-search - React Native Compatible Entry Point
// =============================================================================
// Excludes agent-browser (Node CLI), BrowserService, and file-based logger.
// OneCrawl adapters are the sole search/scrape providers.

// Shared (platform-agnostic) exports
export * from "./index.shared.js";

// RN-specific: logger, tools, adapters
export * from "./logger.native.js";
export * from "./tools.native.js";
export * from "./adapters/index.native.js";
