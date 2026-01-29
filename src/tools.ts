// =============================================================================
// @onegenui/web-search - MCP Tool Definitions
// =============================================================================

import { z } from "zod";
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

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

/** Default timeout for search operations in ms */
const DEFAULT_SEARCH_TIMEOUT = 60000;

/** Default timeout for scrape operations in ms */
const DEFAULT_SCRAPE_TIMEOUT = 30000;

/**
 * Check if Agentic Browser fallback is enabled.
 * Default: false (disabled)
 */
const isAgenticBrowserFallbackEnabled = (): boolean => {
  const enabled = process.env.ENABLE_AGENTIC_BROWSER_FALLBACK === "true";
  logDebug("CONFIG", `Agentic Browser Fallback Enabled: ${enabled}`);
  return enabled;
};

// -----------------------------------------------------------------------------
// Service Factory
// -----------------------------------------------------------------------------

/** Lazy-initialized use case singleton */
let webSearchUseCaseInstance: WebSearchUseCase | null = null;

/**
 * Get or create the WebSearchUseCase with configured adapters
 * OneCrawl is the primary adapter (pure TypeScript, no Python)
 */
function getWebSearchUseCase(): WebSearchUseCase {
  if (webSearchUseCaseInstance) return webSearchUseCaseInstance;

  // OneCrawl as primary (native TypeScript, fast startup)
  const searchAdapters: WebSearchPort[] = [new OneCrawlSearchAdapter()];
  const scraperAdapters: WebScraperPort[] = [new OneCrawlScraperAdapter()];

  // Add browser service adapters as fallback if enabled
  if (isAgenticBrowserFallbackEnabled()) {
    searchAdapters.push(new BrowserServiceSearchAdapter());
    scraperAdapters.push(new BrowserServiceScraperAdapter());
  }

  webSearchUseCaseInstance = new WebSearchUseCase(
    searchAdapters,
    scraperAdapters,
    {
      maxRetries: 2,
      initialDelay: 1000,
      backoffMultiplier: 2,
      maxDelay: 5000,
    },
  );

  return webSearchUseCaseInstance;
}

// -----------------------------------------------------------------------------
// Progress Streaming Helper
// -----------------------------------------------------------------------------

/**
 * Create a progress callback that logs to console and optionally emits events
 */
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
// Web Search Tool
// -----------------------------------------------------------------------------

export const webSearchTool = defineMcpTool({
  name: "web-search",
  description:
    "Search the web using a search engine. Returns a list of search results with titles, URLs, and snippets. " +
    "Use this when the user asks to search for information, find websites, or look up topics on the internet.",
  parameters: z.object({
    query: z.string().describe("The search query"),
    maxResults: z
      .number()
      .min(1)
      .max(20)
      .optional()
      .describe("Maximum number of results to return (default: 10)"),
    engine: z
      .enum(["google", "duckduckgo", "bing"])
      .optional()
      .describe("Search engine to use (default: duckduckgo)"),
    type: z
      .enum(["web", "image", "video", "news"])
      .optional()
      .describe("Type of search to perform (default: web)"),
    timeout: z
      .number()
      .min(5000)
      .max(300000)
      .optional()
      .describe("Timeout in milliseconds (default: 60000)"),
  }),
  domain: "web",
  tags: ["search", "web", "browse", "find", "lookup"],

  async execute({
    query,
    maxResults,
    engine,
    type,
    timeout,
  }): Promise<SearchResults> {
    logDebug("WEB-SEARCH", `Starting search`, {
      query,
      maxResults,
      engine,
      type,
    });

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

// -----------------------------------------------------------------------------
// Web Scrape Tool
// -----------------------------------------------------------------------------

export const webScrapeTool = defineMcpTool({
  name: "web-scrape",
  description:
    "Scrape and extract content from a specific webpage URL. Returns the page title, main content, and optionally links and images. " +
    "Use this when the user wants to read or analyze content from a specific website. " +
    "Images are automatically validated and sorted by quality (HD images preferred).",
  parameters: z.object({
    url: z.string().url().describe("The URL to scrape"),
    includeLinks: z
      .boolean()
      .optional()
      .describe("Whether to extract links from the page"),
    includeImages: z
      .boolean()
      .optional()
      .describe("Whether to extract images from the page"),
    validateImages: z
      .boolean()
      .optional()
      .default(true)
      .describe("Whether to validate image URLs are accessible (default: true)"),
    preferHDImages: z
      .boolean()
      .optional()
      .default(true)
      .describe("Whether to prefer HD images (800x600+) over smaller ones (default: true)"),
    maxContentLength: z
      .number()
      .optional()
      .describe("Maximum characters of content to return"),
    timeout: z
      .number()
      .min(5000)
      .max(300000)
      .optional()
      .describe("Timeout in milliseconds (default: 30000)"),
  }),
  domain: "web",
  tags: ["scrape", "extract", "content", "webpage", "read"],

  async execute({
    url,
    includeLinks,
    includeImages,
    validateImages = true,
    preferHDImages = true,
    maxContentLength,
    timeout,
  }): Promise<ScrapeResult> {
    logDebug("WEB-SCRAPE", `Starting scrape`, { url });

    const useCase = getWebSearchUseCase();
    const response = await useCase.scrape(url, {
      includeLinks,
      includeImages,
      maxContentLength,
      timeout: timeout ?? DEFAULT_SCRAPE_TIMEOUT,
      cache: true,
      onProgress: createProgressLogger("WEB-SCRAPE"),
    });

    // Process images if requested and available
    let result = response.result;
    if (includeImages && result.images && result.images.length > 0) {
      const { validateAndScoreImages, selectBestImage } = await import("./utils/image-validator.js");
      
      // Convert legacy format to ExtractedImage for validation
      const extendedImages = result.images.map(img => ({
        src: img.src,
        alt: img.alt,
      }));
      
      if (validateImages) {
        // Validate and score images in parallel (non-blocking for main flow)
        const validatedImages = await validateAndScoreImages(extendedImages, {
          maxImages: 10,
          timeout: 3000,
          requireHD: preferHDImages,
        });
        
        logDebug("WEB-SCRAPE", `Image validation complete`, {
          original: result.images.length,
          validated: validatedImages.length,
        });
        
        // Convert back to legacy format
        const legacyImages = validatedImages.map(img => ({
          src: img.src,
          alt: img.alt ?? "",
        }));
        result = { ...result, images: legacyImages };
      } else {
        // Just score and sort without validation
        const best = selectBestImage(extendedImages);
        if (best) {
          const bestLegacy = { src: best.src, alt: best.alt ?? "" };
          result = { ...result, images: [bestLegacy, ...result.images.filter(i => i.src !== best.src)] };
        }
      }
    }

    logDebug("WEB-SCRAPE", `Scrape complete`, {
      url: response.result.url,
      contentLength: response.result.content?.length ?? 0,
      cached: response.cached,
      duration: response.duration,
      source: response.source,
      imageCount: result.images?.length ?? 0,
    });

    return result;
  },
});

// -----------------------------------------------------------------------------
// Web Batch Scrape Tool (NEW)
// -----------------------------------------------------------------------------

export const webBatchScrapeTool = defineMcpTool({
  name: "web-batch-scrape",
  description:
    "Scrape multiple URLs in parallel for efficiency. Returns results for all URLs that succeeded, with errors for those that failed. " +
    "Images are automatically validated and sorted by quality.",
  parameters: z.object({
    urls: z
      .array(z.string().url())
      .min(1)
      .max(10)
      .describe("Array of URLs to scrape (max 10)"),
    includeLinks: z
      .boolean()
      .optional()
      .describe("Whether to extract links from pages"),
    includeImages: z
      .boolean()
      .optional()
      .describe("Whether to extract images from pages"),
    validateImages: z
      .boolean()
      .optional()
      .default(true)
      .describe("Whether to validate image URLs are accessible (default: true)"),
    timeout: z
      .number()
      .min(10000)
      .max(600000)
      .optional()
      .describe("Timeout in milliseconds (default: 120000)"),
  }),
  domain: "web",
  tags: ["scrape", "batch", "extract", "content", "bulk"],

  async execute({ urls, includeLinks, includeImages, validateImages = true, timeout }): Promise<{
    results: ScrapeResult[];
    failed: Array<{ url: string; error: string }>;
  }> {
    logDebug("WEB-BATCH-SCRAPE", `Starting batch scrape`, {
      urlCount: urls.length,
    });

    const useCase = getWebSearchUseCase();
    const response = await useCase.scrapeMany(urls, {
      includeLinks,
      includeImages,
      timeout: timeout ?? 120000,
      cache: true,
      onProgress: createProgressLogger("WEB-BATCH-SCRAPE"),
    });

    const results: ScrapeResult[] = [];
    const failed: Array<{ url: string; error: string }> = [];

    // Process images in parallel if needed
    const { validateAndScoreImages } = await import("./utils/image-validator.js");

    for (const [_url, scrapeResponse] of response.results) {
      let result = scrapeResponse.result;
      
      // Validate images if requested
      if (includeImages && validateImages && result.images && result.images.length > 0) {
        // Convert legacy format to ExtractedImage
        const extendedImages = result.images.map(img => ({
          src: img.src,
          alt: img.alt,
        }));
        
        const validatedImages = await validateAndScoreImages(extendedImages, {
          maxImages: 5, // Less per URL in batch mode
          timeout: 2000,
          requireHD: true,
        });
        
        // Convert back to legacy format
        const legacyImages = validatedImages.map(img => ({
          src: img.src,
          alt: img.alt ?? "",
        }));
        result = { ...result, images: legacyImages };
      }
      
      results.push(result);
    }

    for (const [url, error] of response.failed) {
      failed.push({ url, error: error.message });
    }

    logDebug("WEB-BATCH-SCRAPE", `Batch scrape complete`, {
      successCount: results.length,
      failedCount: failed.length,
      totalDuration: response.totalDuration,
    });

    return { results, failed };
  },
});

// -----------------------------------------------------------------------------
// Web Snapshot Tool
// -----------------------------------------------------------------------------

export const webSnapshotTool = defineMcpTool({
  name: "web-snapshot",
  description:
    "Get an accessibility tree snapshot of a webpage. Returns a structured representation of the page with element references. " +
    "Use this for analyzing page structure or preparing for more specific interactions.",
  parameters: z.object({
    url: z.string().url().describe("The URL to snapshot"),
  }),
  domain: "web",
  tags: ["snapshot", "analyze", "inspect", "structure"],

  async execute({ url }): Promise<PageSnapshot> {
    logDebug("WEB-SNAPSHOT", `Starting snapshot`, { url });
    // Snapshot requires full browser interaction, always use Agentic Browser
    const service = getBrowserService();
    try {
      const snapshot = await service.navigate(url);
      logDebug("WEB-SNAPSHOT", `SUCCESS`);
      return snapshot;
    } catch (error) {
      logDebug("WEB-SNAPSHOT", `FAILED`, { error: String(error) });
      console.error("[web-snapshot] Error:", error);
      throw error;
    }
  },
});

// -----------------------------------------------------------------------------
// Health Check Tool (NEW)
// -----------------------------------------------------------------------------

export const webHealthCheckTool = defineMcpTool({
  name: "web-health-check",
  description:
    "Check the health status of all web search and scraping services. " +
    "Returns availability and latency information for each service.",
  parameters: z.object({}),
  domain: "web",
  tags: ["health", "status", "diagnostics"],

  async execute(): Promise<{
    search: Array<{
      name: string;
      available: boolean;
      latency?: number;
      error?: string;
    }>;
    scraper: Array<{
      name: string;
      available: boolean;
      latency?: number;
      error?: string;
    }>;
  }> {
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

// Cleanup handler
if (typeof process !== "undefined") {
  process.on("beforeExit", async () => {
    await closeBrowserService();
  });
}
