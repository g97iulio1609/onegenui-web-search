// =============================================================================
// @onegenui/web-search - Adapters Barrel Export (React Native Compatible)
// =============================================================================
// Excludes BrowserService adapters that depend on agent-browser (Node CLI).

// OneCrawl (Primary - Native TypeScript)
export {
  OneCrawlScraperAdapter,
  createOneCrawlScraperAdapter,
} from "./onecrawl.adapter.js";
export {
  OneCrawlSearchAdapter,
  createOneCrawlSearchAdapter,
} from "./onecrawl-search.adapter.js";
