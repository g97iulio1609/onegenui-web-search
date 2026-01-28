// =============================================================================
// @onegenui/web-search - Ports Barrel Export
// =============================================================================

export {
  type WebSearchPort,
  type SearchProgress,
  type SearchProgressCallback,
  type ExtendedSearchOptions,
  type SearchResponse,
  noopWebSearch,
} from "./search.port";

export {
  type WebScraperPort,
  type ScrapeProgress,
  type ScrapeProgressCallback,
  type ExtendedScrapeOptions,
  type ScrapeResponse,
  type BatchScrapeResponse,
  noopWebScraper,
} from "./scraper.port";

export {
  type ContentExtractorPort,
  type ExtractedContent,
  type ExtractionOptions,
  basicContentExtractor,
} from "./extractor.port";
