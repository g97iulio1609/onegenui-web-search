// =============================================================================
// @onegenui/web-search - Adapters Barrel Export
// =============================================================================

// OneCrawl (Primary - Native TypeScript)
export {
  OneCrawlScraperAdapter,
  createOneCrawlScraperAdapter,
} from "./onecrawl.adapter";
export {
  OneCrawlSearchAdapter,
  createOneCrawlSearchAdapter,
} from "./onecrawl-search.adapter";

// Browser Service (Fallback)
export {
  BrowserServiceSearchAdapter,
  BrowserServiceScraperAdapter,
} from "./browser-service.adapter";
