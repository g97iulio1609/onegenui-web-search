/**
 * Crawler Module
 *
 * Modular components for OneCrawl web scraping service.
 */

// URL building
export {
  type SearchType,
  type SearchEngine,
  buildSearchUrl,
  normalizeSearchType,
} from "./url-builder";

// JavaScript injection scripts
export { getWaitForSelector, getMediaExtractionScript } from "./js-scripts";

// Result parsing
export {
  parseImageResults,
  parseVideoResults,
  parseSearchResults,
  parseJsonResults,
} from "./result-parsers";
