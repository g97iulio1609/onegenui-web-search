// =============================================================================
// @onegenui/web-search - MCP Tool Definitions (React Native Compatible)
// =============================================================================
// Excludes web-snapshot tool and BrowserService fallback.
// OneCrawl adapters are the sole search/scrape providers.

import { z } from "zod";
import { defineMcpTool } from "@onegenui/mcp";
import { logDebug } from "./logger.native.js";
import type { SearchResults, ScrapeResult } from "./types.js";
import { WebSearchUseCase } from "./use-cases/index.js";
import type { SearchProgress, ScrapeProgress } from "./ports/index.js";

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

const DEFAULT_SEARCH_TIMEOUT = 60000;
const DEFAULT_SCRAPE_TIMEOUT = 30000;

// -----------------------------------------------------------------------------
// Service Factory
// -----------------------------------------------------------------------------

let webSearchUseCaseInstance: WebSearchUseCase | null = null;

/**
 * Get or create the WebSearchUseCase with OneCrawl adapters only.
 * BrowserService fallback is not available on React Native.
 * Adapters are dynamically imported to defer the OneCrawl dependency tree.
 */
async function getWebSearchUseCase(): Promise<WebSearchUseCase> {
  if (webSearchUseCaseInstance) return webSearchUseCaseInstance;

  const { OneCrawlSearchAdapter, OneCrawlScraperAdapter } = await import(
    "./adapters/index.native.js"
  );

  webSearchUseCaseInstance = new WebSearchUseCase(
    [new OneCrawlSearchAdapter()],
    [new OneCrawlScraperAdapter()],
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
// Cached Image Validator Import
// -----------------------------------------------------------------------------

let imageValidatorPromise: Promise<
  typeof import("./utils/image-validator.js")
> | null = null;

function getImageValidator() {
  if (!imageValidatorPromise) {
    imageValidatorPromise = import("./utils/image-validator.js");
  }
  return imageValidatorPromise;
}

// -----------------------------------------------------------------------------
// Progress Streaming Helper (cached per tool name)
// -----------------------------------------------------------------------------

const progressLoggerCache = new Map<
  string,
  (progress: SearchProgress | ScrapeProgress) => void
>();

function createProgressLogger(
  toolName: string,
): (progress: SearchProgress | ScrapeProgress) => void {
  let logger = progressLoggerCache.get(toolName);
  if (logger) return logger;

  logger = (progress) => {
    logDebug(toolName, progress.message, {
      phase: progress.phase,
      ...("results" in progress && progress.results !== undefined
        ? { results: progress.results }
        : {}),
    });
  };
  progressLoggerCache.set(toolName, logger);
  return logger;
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

    const useCase = await getWebSearchUseCase();
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
      .describe(
        "Whether to validate image URLs are accessible (default: true)",
      ),
    preferHDImages: z
      .boolean()
      .optional()
      .default(true)
      .describe(
        "Whether to prefer HD images (800x600+) over smaller ones (default: true)",
      ),
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

    const useCase = await getWebSearchUseCase();
    const response = await useCase.scrape(url, {
      includeLinks,
      includeImages,
      maxContentLength,
      timeout: timeout ?? DEFAULT_SCRAPE_TIMEOUT,
      cache: true,
      onProgress: createProgressLogger("WEB-SCRAPE"),
    });

    let result = response.result;
    if (includeImages && result.images && result.images.length > 0) {
      const { validateAndScoreImages, selectBestImage } =
        await getImageValidator();

      const extendedImages = result.images.map((img) => ({
        src: img.src,
        alt: img.alt,
      }));

      if (validateImages) {
        const validatedImages = await validateAndScoreImages(extendedImages, {
          maxImages: 10,
          timeout: 3000,
          requireHD: preferHDImages,
        });

        logDebug("WEB-SCRAPE", `Image validation complete`, {
          original: result.images.length,
          validated: validatedImages.length,
        });

        const outputImages = validatedImages.map(
          (img: { src: string; alt?: string }) => ({
            src: img.src,
            alt: img.alt ?? "",
          }),
        );
        result = { ...result, images: outputImages };
      } else {
        const best = selectBestImage(extendedImages);
        if (best) {
          const bestOutput = { src: best.src, alt: best.alt ?? "" };
          result = {
            ...result,
            images: [
              bestOutput,
              ...result.images.filter((i) => i.src !== best.src),
            ],
          };
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
// Web Batch Scrape Tool
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
      .describe(
        "Whether to validate image URLs are accessible (default: true)",
      ),
    timeout: z
      .number()
      .min(10000)
      .max(600000)
      .optional()
      .describe("Timeout in milliseconds (default: 120000)"),
  }),
  domain: "web",
  tags: ["scrape", "batch", "extract", "content", "bulk"],

  async execute({
    urls,
    includeLinks,
    includeImages,
    validateImages = true,
    timeout,
  }): Promise<{
    results: ScrapeResult[];
    failed: Array<{ url: string; error: string }>;
  }> {
    logDebug("WEB-BATCH-SCRAPE", `Starting batch scrape`, {
      urlCount: urls.length,
    });

    const useCase = await getWebSearchUseCase();
    const response = await useCase.scrapeMany(urls, {
      includeLinks,
      includeImages,
      timeout: timeout ?? 120000,
      cache: true,
      onProgress: createProgressLogger("WEB-BATCH-SCRAPE"),
    });

    const results: ScrapeResult[] = [];
    const failed: Array<{ url: string; error: string }> = [];

    const { validateAndScoreImages } = await getImageValidator();

    for (const [_url, scrapeResponse] of response.results) {
      let result = scrapeResponse.result;

      if (
        includeImages &&
        validateImages &&
        result.images &&
        result.images.length > 0
      ) {
        const extendedImages = result.images.map((img) => ({
          src: img.src,
          alt: img.alt,
        }));

        const validatedImages = await validateAndScoreImages(extendedImages, {
          maxImages: 5,
          timeout: 2000,
          requireHD: true,
        });

        const outputImages = validatedImages.map(
          (img: { src: string; alt?: string }) => ({
            src: img.src,
            alt: img.alt ?? "",
          }),
        );
        result = { ...result, images: outputImages };
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
// Web Health Check Tool
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

    const useCase = await getWebSearchUseCase();
    const health = await useCase.healthCheck();

    logDebug("WEB-HEALTH", `Health check complete`, {
      searchServices: health.search.length,
      scraperServices: health.scraper.length,
    });

    return health;
  },
});

// -----------------------------------------------------------------------------
// All Tools Export (no web-snapshot on React Native)
// -----------------------------------------------------------------------------

export const webSearchTools = {
  "web-search": webSearchTool,
  "web-scrape": webScrapeTool,
  "web-batch-scrape": webBatchScrapeTool,
  "web-health-check": webHealthCheckTool,
};
