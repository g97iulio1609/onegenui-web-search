// =============================================================================
// @onegenui/web-search - MCP Tool Definitions
// =============================================================================

import { defineMcpTool } from "@onegenui/mcp";
import { getBrowserService, closeBrowserService } from "./browser-service";
import { logDebug } from "./logger";
import type { SearchResults, ScrapeResult, PageSnapshot } from "./types";
import { WebSearchUseCase } from "./use-cases";
import {
  OneCrawlSearchAdapter,
  OneCrawlScraperAdapter,
  BrowserServiceSearchAdapter,
  BrowserServiceScraperAdapter,
} from "./adapters";
import type {
  SearchProgress,
  ScrapeProgress,
  WebSearchPort,
  WebScraperPort,
} from "./ports";
import {
  searchParamsSchema,
  scrapeParamsSchema,
  batchScrapeParamsSchema,
  healthCheckParamsSchema,
  snapshotParamsSchema,
  DEFAULT_SEARCH_TIMEOUT,
  DEFAULT_SCRAPE_TIMEOUT,
} from "./tool-schemas";
import { processImages, processBatchImages } from "./image-processing";

// -----------------------------------------------------------------------------
// Service Factory
// -----------------------------------------------------------------------------

let webSearchUseCaseInstance: WebSearchUseCase | null = null;

function getWebSearchUseCase(): WebSearchUseCase {
  if (webSearchUseCaseInstance) return webSearchUseCaseInstance;

  const searchAdapters: WebSearchPort[] = [new OneCrawlSearchAdapter()];
  const scraperAdapters: WebScraperPort[] = [new OneCrawlScraperAdapter()];

  if (process.env.ENABLE_AGENTIC_BROWSER_FALLBACK === "true") {
    searchAdapters.push(new BrowserServiceSearchAdapter());
    scraperAdapters.push(new BrowserServiceScraperAdapter());
  }

  webSearchUseCaseInstance = new WebSearchUseCase(
    searchAdapters,
    scraperAdapters,
    { maxRetries: 2, initialDelay: 1000, backoffMultiplier: 2, maxDelay: 5000 },
  );
  return webSearchUseCaseInstance;
}

function createProgressLogger(
  toolName: string,
): (progress: SearchProgress | ScrapeProgress) => void {
  return (progress) => {
    logDebug(toolName, progress.message, {
      phase: progress.phase,
      ...("results" in progress && progress.results !== undefined
        ? { results: progress.results }
        : {}),
    });
  };
}

// -----------------------------------------------------------------------------
// Tools
// -----------------------------------------------------------------------------

export const webSearchTool = defineMcpTool({
  name: "web-search",
  description:
    "Search the web using a search engine. Returns a list of search results with titles, URLs, and snippets. " +
    "Use this when the user asks to search for information, find websites, or look up topics on the internet.",
  parameters: searchParamsSchema,
  domain: "web",
  tags: ["search", "web", "browse", "find", "lookup"],

  async execute({ query, maxResults, engine, type, timeout }): Promise<SearchResults> {
    logDebug("WEB-SEARCH", `Starting search`, { query, maxResults, engine, type });
    const useCase = getWebSearchUseCase();
    const response = await useCase.search(query, {
      maxResults: maxResults ?? 10,
      engine,
      searchType: type,
      timeout: timeout ?? DEFAULT_SEARCH_TIMEOUT,
      cache: true,
      onProgress: createProgressLogger("WEB-SEARCH"),
    });
    logDebug("WEB-SEARCH", `Search complete`, {
      resultCount: response.results.results.length,
      cached: response.cached,
      duration: response.duration,
      source: response.source,
    });
    return response.results;
  },
});

export const webScrapeTool = defineMcpTool({
  name: "web-scrape",
  description:
    "Scrape and extract content from a specific webpage URL. Returns the page title, main content, and optionally links and images. " +
    "Use this when the user wants to read or analyze content from a specific website. " +
    "Images are automatically validated and sorted by quality (HD images preferred).",
  parameters: scrapeParamsSchema,
  domain: "web",
  tags: ["scrape", "extract", "content", "webpage", "read"],

  async execute({
    url, includeLinks, includeImages, validateImages = true,
    preferHDImages = true, maxContentLength, timeout,
  }): Promise<ScrapeResult> {
    logDebug("WEB-SCRAPE", `Starting scrape`, { url });
    const useCase = getWebSearchUseCase();
    const response = await useCase.scrape(url, {
      includeLinks, includeImages, maxContentLength,
      timeout: timeout ?? DEFAULT_SCRAPE_TIMEOUT,
      cache: true,
      onProgress: createProgressLogger("WEB-SCRAPE"),
    });

    let result = includeImages
      ? await processImages(response.result, {
          validate: validateImages, preferHD: preferHDImages,
        })
      : response.result;

    logDebug("WEB-SCRAPE", `Scrape complete`, {
      url: response.result.url,
      contentLength: response.result.content?.length ?? 0,
      cached: response.cached, duration: response.duration,
      source: response.source, imageCount: result.images?.length ?? 0,
    });
    return result;
  },
});

export const webBatchScrapeTool = defineMcpTool({
  name: "web-batch-scrape",
  description:
    "Scrape multiple URLs in parallel for efficiency. Returns results for all URLs that succeeded, with errors for those that failed. " +
    "Images are automatically validated and sorted by quality.",
  parameters: batchScrapeParamsSchema,
  domain: "web",
  tags: ["scrape", "batch", "extract", "content", "bulk"],

  async execute({ urls, includeLinks, includeImages, validateImages = true, timeout }): Promise<{
    results: ScrapeResult[];
    failed: Array<{ url: string; error: string }>;
  }> {
    logDebug("WEB-BATCH-SCRAPE", `Starting batch scrape`, { urlCount: urls.length });
    const useCase = getWebSearchUseCase();
    const response = await useCase.scrapeMany(urls, {
      includeLinks, includeImages,
      timeout: timeout ?? 120000,
      cache: true,
      onProgress: createProgressLogger("WEB-BATCH-SCRAPE"),
    });

    const results: ScrapeResult[] = [];
    for (const [, scrapeResponse] of response.results) {
      const r = includeImages && validateImages
        ? await processBatchImages(scrapeResponse.result)
        : scrapeResponse.result;
      results.push(r);
    }

    const failed = Array.from(response.failed).map(([url, error]) => ({
      url, error: error.message,
    }));

    logDebug("WEB-BATCH-SCRAPE", `Batch scrape complete`, {
      successCount: results.length, failedCount: failed.length,
      totalDuration: response.totalDuration,
    });
    return { results, failed };
  },
});

export const webSnapshotTool = defineMcpTool({
  name: "web-snapshot",
  description:
    "Get an accessibility tree snapshot of a webpage. Returns a structured representation of the page with element references. " +
    "Use this for analyzing page structure or preparing for more specific interactions.",
  parameters: snapshotParamsSchema,
  domain: "web",
  tags: ["snapshot", "analyze", "inspect", "structure"],

  async execute({ url }): Promise<PageSnapshot> {
    logDebug("WEB-SNAPSHOT", `Starting snapshot`, { url });
    const service = getBrowserService();
    try {
      const snapshot = await service.navigate(url);
      logDebug("WEB-SNAPSHOT", `SUCCESS`);
      return snapshot;
    } catch (error) {
      logDebug("WEB-SNAPSHOT", `FAILED`, { error: String(error) });
      throw error;
    }
  },
});

export const webHealthCheckTool = defineMcpTool({
  name: "web-health-check",
  description:
    "Check the health status of all web search and scraping services. " +
    "Returns availability and latency information for each service.",
  parameters: healthCheckParamsSchema,
  domain: "web",
  tags: ["health", "status", "diagnostics"],

  async execute() {
    logDebug("WEB-HEALTH", `Starting health check`);
    const useCase = getWebSearchUseCase();
    const health = await useCase.healthCheck();
    logDebug("WEB-HEALTH", `Health check complete`, {
      searchServices: health.search.length,
      scraperServices: health.scraper.length,
    });
    return health;
  },
});

// -----------------------------------------------------------------------------
// All Tools Export
// -----------------------------------------------------------------------------

export const webSearchTools = {
  "web-search": webSearchTool,
  "web-scrape": webScrapeTool,
  "web-batch-scrape": webBatchScrapeTool,
  "web-snapshot": webSnapshotTool,
  "web-health-check": webHealthCheckTool,
};

if (typeof process !== "undefined") {
  process.on("beforeExit", async () => { await closeBrowserService(); });
}
