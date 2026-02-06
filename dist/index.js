"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/utils/image-validator.ts
var image_validator_exports = {};
__export(image_validator_exports, {
  isHDImage: () => isHDImage,
  isReliableDomain: () => isReliableDomain,
  isUnreliableDomain: () => isUnreliableDomain,
  scoreImage: () => scoreImage,
  selectBestImage: () => selectBestImage,
  validateAndScoreImages: () => validateAndScoreImages,
  validateImageUrl: () => validateImageUrl
});
function isReliableDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    return RELIABLE_DOMAINS.has(hostname) || Array.from(RELIABLE_DOMAINS).some((d) => hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
}
function isUnreliableDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    return UNRELIABLE_DOMAINS.has(hostname) || Array.from(UNRELIABLE_DOMAINS).some((d) => hostname.endsWith(`.${d}`));
  } catch {
    return true;
  }
}
function isHDImage(img) {
  if (!img.width || !img.height) return false;
  return img.width >= MIN_HD_WIDTH && img.height >= MIN_HD_HEIGHT;
}
function scoreImage(img) {
  let score = 0;
  if (img.width && img.height) {
    const pixels = img.width * img.height;
    if (pixels >= 1920 * 1080) score += 50;
    else if (pixels >= 1280 * 720) score += 40;
    else if (pixels >= 800 * 600) score += 30;
    else if (pixels >= 400 * 300) score += 15;
  } else {
    score += 20;
  }
  if (isReliableDomain(img.src)) {
    score += 30;
  } else if (isUnreliableDomain(img.src)) {
    score -= 50;
  } else {
    score += 10;
  }
  if (img.alt && img.alt.length > 3) {
    score += 10;
  }
  if (img.score) {
    score += img.score;
  }
  return score;
}
async function validateImageUrl(url, timeout = 3e3) {
  if (isUnreliableDomain(url)) {
    return false;
  }
  if (isReliableDomain(url)) {
    return true;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; OneGenUI/1.0; Image Validator)"
      }
    });
    clearTimeout(timeoutId);
    const contentType = response.headers.get("content-type") || "";
    const isImage = contentType.startsWith("image/");
    return response.ok && isImage;
  } catch {
    return false;
  }
}
async function validateAndScoreImages(images, options = {}) {
  const { maxImages = 10, timeout = 3e3, requireHD = false } = options;
  const candidates = images.filter((img) => {
    if (!img.src) return false;
    if (isUnreliableDomain(img.src)) return false;
    if (requireHD && !isHDImage(img)) return false;
    return true;
  });
  const scored = candidates.map((img) => ({
    img,
    score: scoreImage(img)
  }));
  scored.sort((a, b) => b.score - a.score);
  const topCandidates = scored.slice(0, maxImages * 2);
  const validationResults = await Promise.all(
    topCandidates.map(async ({ img, score }) => ({
      img,
      score,
      valid: await validateImageUrl(img.src, timeout)
    }))
  );
  return validationResults.filter((r) => r.valid).slice(0, maxImages).map((r) => r.img);
}
function selectBestImage(images) {
  if (!images.length) return null;
  const reliable = images.filter((img) => !isUnreliableDomain(img.src));
  if (!reliable.length) return images[0] ?? null;
  let best = reliable[0];
  let bestScore = scoreImage(best);
  for (let i = 1; i < reliable.length; i++) {
    const img = reliable[i];
    const score = scoreImage(img);
    if (score > bestScore) {
      best = img;
      bestScore = score;
    }
  }
  return best;
}
var MIN_HD_WIDTH, MIN_HD_HEIGHT, RELIABLE_DOMAINS, UNRELIABLE_DOMAINS;
var init_image_validator = __esm({
  "src/utils/image-validator.ts"() {
    "use strict";
    MIN_HD_WIDTH = 800;
    MIN_HD_HEIGHT = 600;
    RELIABLE_DOMAINS = /* @__PURE__ */ new Set([
      "unsplash.com",
      "images.unsplash.com",
      "images.pexels.com",
      "cdn.pixabay.com",
      "cache.marriott.com",
      "photos.hotelbeds.com",
      "cf.bstatic.com",
      // booking.com
      "q-xx.bstatic.com",
      // booking.com
      "images.trvl-media.com",
      // Expedia
      "media-cdn.tripadvisor.com",
      "lh3.googleusercontent.com",
      "i.ytimg.com"
    ]);
    UNRELIABLE_DOMAINS = /* @__PURE__ */ new Set([
      "placeholder.com",
      "via.placeholder.com",
      "example.com",
      "placehold.it",
      "dummyimage.com",
      "picsum.photos"
      // Can be slow/unreliable
    ]);
  }
});

// src/index.ts
var index_exports = {};
__export(index_exports, {
  BrowserService: () => BrowserService,
  BrowserServiceScraperAdapter: () => BrowserServiceScraperAdapter,
  BrowserServiceSearchAdapter: () => BrowserServiceSearchAdapter,
  OneCrawlScraperAdapter: () => OneCrawlScraperAdapter,
  OneCrawlSearchAdapter: () => OneCrawlSearchAdapter,
  WebSearchUseCase: () => WebSearchUseCase,
  basicContentExtractor: () => basicContentExtractor,
  browserActionSchema: () => browserActionSchema,
  buildSearchUrl: () => buildSearchUrl,
  clearLog: () => clearLog,
  closeBrowserService: () => closeBrowserService,
  createOneCrawlScraperAdapter: () => createOneCrawlScraperAdapter,
  createOneCrawlSearchAdapter: () => createOneCrawlSearchAdapter,
  extractedAudioSchema: () => extractedAudioSchema,
  extractedImageSchema: () => extractedImageSchema,
  extractedVideoSchema: () => extractedVideoSchema,
  getBrowserService: () => getBrowserService,
  isHDImage: () => isHDImage,
  isReliableDomain: () => isReliableDomain,
  isUnreliableDomain: () => isUnreliableDomain,
  logDebug: () => logDebug,
  noopWebScraper: () => noopWebScraper,
  noopWebSearch: () => noopWebSearch,
  normalizeSearchType: () => normalizeSearchType,
  parseImageResults: () => parseImageResults,
  parseJsonResults: () => parseJsonResults,
  parseSearchResults: () => parseSearchResults2,
  parseVideoResults: () => parseVideoResults,
  scoreImage: () => scoreImage,
  scrapeResultSchema: () => scrapeResultSchema,
  searchResultSchema: () => searchResultSchema,
  searchResultsSchema: () => searchResultsSchema,
  selectBestImage: () => selectBestImage,
  validateAndScoreImages: () => validateAndScoreImages,
  validateImageUrl: () => validateImageUrl,
  videoProviderSchema: () => videoProviderSchema,
  webBatchScrapeTool: () => webBatchScrapeTool,
  webHealthCheckTool: () => webHealthCheckTool,
  webScrapeTool: () => webScrapeTool,
  webSearchTool: () => webSearchTool,
  webSearchTools: () => webSearchTools,
  webSnapshotTool: () => webSnapshotTool
});
module.exports = __toCommonJS(index_exports);

// src/types.ts
var import_zod = require("zod");
var videoProviderSchema = import_zod.z.enum([
  "youtube",
  "vimeo",
  "dailymotion",
  "twitch",
  "tiktok",
  "twitter"
]);
var extractedImageSchema = import_zod.z.object({
  src: import_zod.z.string(),
  alt: import_zod.z.string().optional(),
  title: import_zod.z.string().optional(),
  score: import_zod.z.number().optional(),
  description: import_zod.z.string().optional(),
  width: import_zod.z.number().optional(),
  height: import_zod.z.number().optional()
});
var extractedVideoSchema = import_zod.z.object({
  src: import_zod.z.string(),
  embedUrl: import_zod.z.string().optional(),
  provider: videoProviderSchema.optional(),
  title: import_zod.z.string().optional(),
  description: import_zod.z.string().optional(),
  duration: import_zod.z.number().optional(),
  thumbnail: import_zod.z.string().optional()
});
var extractedAudioSchema = import_zod.z.object({
  src: import_zod.z.string(),
  title: import_zod.z.string().optional(),
  description: import_zod.z.string().optional(),
  duration: import_zod.z.number().optional()
});
var searchResultSchema = import_zod.z.object({
  title: import_zod.z.string(),
  url: import_zod.z.string(),
  snippet: import_zod.z.string(),
  favicon: import_zod.z.string().optional(),
  position: import_zod.z.number().optional(),
  type: import_zod.z.enum(["web", "image", "video", "news"]).optional(),
  // Rich media info for image/video results
  media: import_zod.z.object({
    url: import_zod.z.string(),
    thumbnail: import_zod.z.string().optional(),
    duration: import_zod.z.string().optional(),
    views: import_zod.z.string().optional(),
    publishedAt: import_zod.z.string().optional(),
    provider: videoProviderSchema.optional(),
    dimensions: import_zod.z.object({
      width: import_zod.z.number(),
      height: import_zod.z.number()
    }).optional()
  }).optional(),
  // Additional metadata for news/rich results
  image: import_zod.z.string().optional(),
  date: import_zod.z.string().optional(),
  source: import_zod.z.string().optional()
});
var searchResultsSchema = import_zod.z.object({
  query: import_zod.z.string(),
  results: import_zod.z.array(searchResultSchema),
  totalResults: import_zod.z.number().optional(),
  searchTime: import_zod.z.number().optional()
});
var browserActionSchema = import_zod.z.object({
  id: import_zod.z.string(),
  action: import_zod.z.enum([
    "navigating",
    "searching",
    "extracting",
    "clicking",
    "typing",
    "waiting",
    "capturing"
  ]),
  target: import_zod.z.string().optional(),
  url: import_zod.z.string().optional(),
  status: import_zod.z.enum(["pending", "loading", "complete", "error"]),
  message: import_zod.z.string().optional(),
  error: import_zod.z.string().optional(),
  timestamp: import_zod.z.number()
});
var scrapeResultSchema = import_zod.z.object({
  url: import_zod.z.string(),
  title: import_zod.z.string(),
  content: import_zod.z.string(),
  headings: import_zod.z.array(import_zod.z.string()).optional(),
  links: import_zod.z.array(
    import_zod.z.object({
      text: import_zod.z.string(),
      href: import_zod.z.string()
    })
  ).optional(),
  // Basic image format
  images: import_zod.z.array(
    import_zod.z.object({
      alt: import_zod.z.string(),
      src: import_zod.z.string()
    })
  ).optional(),
  // New enhanced media extraction from OneCrawl
  media: import_zod.z.object({
    images: import_zod.z.array(extractedImageSchema).optional(),
    videos: import_zod.z.array(extractedVideoSchema).optional(),
    audio: import_zod.z.array(extractedAudioSchema).optional()
  }).optional(),
  metadata: import_zod.z.record(import_zod.z.string(), import_zod.z.string()).optional()
});

// src/browser/cli-runner.ts
var import_child_process = require("child_process");
var import_util = require("util");
var execAsync = (0, import_util.promisify)(import_child_process.exec);
async function runCommand(command, json = true) {
  try {
    const fullCommand = `npx agent-browser ${command}${json ? " --json" : ""}`;
    const { stdout, stderr } = await execAsync(fullCommand, {
      timeout: 6e4,
      maxBuffer: 10 * 1024 * 1024
      // 10MB
    });
    if (stderr && !stderr.includes("WARN")) {
      console.warn("[agent-browser] stderr:", stderr);
    }
    if (json && stdout.trim()) {
      try {
        const parsed = JSON.parse(stdout.trim());
        return { success: true, data: parsed };
      } catch {
        return { success: true, data: stdout.trim() };
      }
    }
    return { success: true, data: stdout.trim() };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[agent-browser] command failed:", message);
    return { success: false, error: message };
  }
}

// src/browser/tree-parser.ts
function parseSearchResults(tree, refs, maxResults) {
  const results = [];
  const linkPattern = /- link "([^"]+)" \[ref=(e\d+)\]/g;
  let match;
  while ((match = linkPattern.exec(tree)) !== null && results.length < maxResults) {
    const [, title, refId] = match;
    const ref = refId ? refs[refId] : void 0;
    if (title && isSearchResult(title)) {
      results.push({
        title,
        url: "",
        snippet: ref?.name ?? "",
        position: results.length + 1
      });
    }
  }
  return results;
}
function isSearchResult(title) {
  const skipPatterns = [
    /^(Images|Videos|News|Maps|Shopping|Books|Flights)$/i,
    /^(Sign in|Settings|Privacy|Terms)$/i,
    /^(About|Help|Feedback)$/i,
    /^More$/i
  ];
  return !skipPatterns.some((p) => p.test(title));
}
function extractContentFromTree(tree, maxLength) {
  const contentPattern = /- (?:heading|text|paragraph|StaticText) "([^"]+)"/g;
  const parts = [];
  let match;
  while ((match = contentPattern.exec(tree)) !== null) {
    const [, textContent] = match;
    if (textContent && textContent.length > 10) {
      parts.push(textContent);
    }
  }
  const content = parts.join("\n\n");
  return maxLength ? content.slice(0, maxLength) : content;
}
function extractLinksFromTree(tree) {
  const links = [];
  const linkPattern = /- link "([^"]+)"/g;
  let match;
  while ((match = linkPattern.exec(tree)) !== null && links.length < 20) {
    const [, text] = match;
    if (text && text.length > 2) {
      links.push({ text, href: "" });
    }
  }
  return links;
}

// src/browser-service.ts
var BrowserService = class {
  options;
  isOpen = false;
  constructor(options = {}) {
    this.options = {
      headless: true,
      viewport: { width: 1280, height: 720 },
      timeout: 3e4,
      ...options
    };
  }
  // ---------------------------------------------------------------------------
  // Core Operations
  // ---------------------------------------------------------------------------
  /**
   * Navigate to a URL and get page snapshot
   */
  async navigate(url, emit) {
    emit?.({ action: "navigating", url, status: "loading" });
    const openResult = await runCommand(`open "${url}"`, false);
    if (!openResult.success) {
      emit?.({
        action: "navigating",
        url,
        status: "error",
        error: openResult.error
      });
      throw new Error(`Failed to navigate: ${openResult.error}`);
    }
    this.isOpen = true;
    emit?.({ action: "navigating", url, status: "complete" });
    emit?.({
      action: "extracting",
      target: "page snapshot",
      status: "loading"
    });
    const snapshotResult = await runCommand("snapshot -i");
    if (!snapshotResult.success || !snapshotResult.data) {
      emit?.({
        action: "extracting",
        target: "page snapshot",
        status: "error"
      });
      throw new Error(`Failed to get snapshot: ${snapshotResult.error}`);
    }
    emit?.({
      action: "extracting",
      target: "page snapshot",
      status: "complete"
    });
    const data = snapshotResult.data;
    return {
      url,
      tree: data.data?.snapshot ?? String(snapshotResult.data),
      refs: data.data?.refs ?? {}
    };
  }
  /**
   * Search using a search engine and extract results
   */
  async search(query, options = {}, emit) {
    const { maxResults = 10, engine = "google" } = options;
    const searchUrls = {
      google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
      bing: `https://www.bing.com/search?q=${encodeURIComponent(query)}`
    };
    const searchUrl = searchUrls[engine] ?? searchUrls.google;
    emit?.({ action: "navigating", url: searchUrl, status: "loading" });
    await runCommand(`open "${searchUrl}"`, false);
    this.isOpen = true;
    emit?.({ action: "navigating", url: searchUrl, status: "complete" });
    emit?.({ action: "waiting", target: "search results", status: "loading" });
    await runCommand("wait 2000", false);
    emit?.({ action: "waiting", target: "search results", status: "complete" });
    emit?.({
      action: "extracting",
      target: "search results",
      status: "loading"
    });
    const snapshotResult = await runCommand("snapshot -i");
    if (!snapshotResult.success) {
      emit?.({
        action: "extracting",
        target: "search results",
        status: "error",
        error: snapshotResult.error
      });
      throw new Error(`Failed to get snapshot: ${snapshotResult.error}`);
    }
    const data = snapshotResult.data;
    const tree = data.data?.snapshot ?? String(snapshotResult.data);
    const refs = data.data?.refs ?? {};
    const results = parseSearchResults(tree, refs, maxResults);
    emit?.({
      action: "extracting",
      target: "search results",
      status: "complete",
      message: `Found ${results.length} results`
    });
    return {
      query,
      results,
      totalResults: results.length
    };
  }
  /**
   * Scrape content from a specific URL
   */
  async scrape(url, options = {}, emit) {
    emit?.({ action: "navigating", url, status: "loading" });
    await runCommand(`open "${url}"`, false);
    this.isOpen = true;
    emit?.({ action: "navigating", url, status: "complete" });
    await runCommand("wait 1500", false);
    const titleResult = await runCommand("get title");
    const title = titleResult.data?.data ?? "";
    emit?.({ action: "extracting", target: "page content", status: "loading" });
    const snapshotResult = await runCommand("snapshot");
    if (!snapshotResult.success) {
      emit?.({ action: "extracting", target: "page content", status: "error" });
      throw new Error(`Failed to scrape: ${snapshotResult.error}`);
    }
    const data = snapshotResult.data;
    const tree = data.data?.snapshot ?? String(snapshotResult.data);
    const refs = data.data?.refs ?? {};
    const content = extractContentFromTree(tree, options.maxContentLength);
    const links = options.includeLinks ? extractLinksFromTree(tree) : void 0;
    emit?.({
      action: "extracting",
      target: "page content",
      status: "complete"
    });
    return {
      url,
      title,
      content,
      links
    };
  }
  /**
   * Close the browser
   */
  async close() {
    if (this.isOpen) {
      await runCommand("close", false);
      this.isOpen = false;
    }
  }
};
var defaultInstance = null;
function getBrowserService(options) {
  if (!defaultInstance) {
    defaultInstance = new BrowserService(options);
  }
  return defaultInstance;
}
async function closeBrowserService() {
  if (defaultInstance) {
    await defaultInstance.close();
    defaultInstance = null;
  }
}

// src/logger.ts
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var LOG_FILE = import_path.default.resolve(process.cwd(), "web.log");
var DEBUG = process.env.NODE_ENV === "development";
function logDebug(context, message, data) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const entry = `[${timestamp}] [${context}] ${message}${data ? ` | ${JSON.stringify(data)}` : ""}`;
  if (DEBUG) {
    console.log(`\u{1F50D} ${entry}`);
  }
  try {
    import_fs.default.appendFileSync(LOG_FILE, entry + "\n");
  } catch {
  }
}
function clearLog() {
  try {
    import_fs.default.writeFileSync(
      LOG_FILE,
      `--- Web Search Log Started: ${(/* @__PURE__ */ new Date()).toISOString()} ---
`
    );
  } catch (e) {
  }
}

// src/tools.ts
var import_zod2 = require("zod");
var import_mcp = require("@onegenui/mcp");

// src/use-cases/web-search.use-case.ts
var import_utils = require("@onegenui/utils");
var log = (0, import_utils.createLogger)({ prefix: "web-search" });
var DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1e3,
  backoffMultiplier: 2,
  maxDelay: 1e4
};
var DEFAULT_SEARCH_TIMEOUT_MS = 6e4;
var DEFAULT_SCRAPE_TIMEOUT_MS = 3e4;
var MIN_OPERATION_TIMEOUT_MS = 1e3;
var MAX_OPERATION_TIMEOUT_MS = 3e5;
var WebSearchUseCase = class {
  searchAdapters;
  scraperAdapters;
  retryConfig;
  // Circuit breaker state
  circuitState = /* @__PURE__ */ new Map();
  circuitThreshold = 5;
  circuitResetTime = 6e4;
  // 1 minute
  constructor(searchAdapters, scraperAdapters, retryConfig = {}) {
    if (searchAdapters.length === 0) {
      throw new Error("At least one search adapter is required");
    }
    if (scraperAdapters.length === 0) {
      throw new Error("At least one scraper adapter is required");
    }
    this.searchAdapters = searchAdapters;
    this.scraperAdapters = scraperAdapters;
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }
  /**
   * Search with fallback chain
   */
  async search(query, options = {}) {
    const { onProgress, signal } = options;
    const timeoutMs = this.normalizeTimeout(
      options.timeout,
      DEFAULT_SEARCH_TIMEOUT_MS
    );
    let lastError = null;
    for (const adapter of this.searchAdapters) {
      const name = adapter.getName();
      if (this.isCircuitOpen(name)) {
        onProgress?.({
          phase: "starting",
          message: `Skipping ${name} (circuit open)`
        });
        continue;
      }
      try {
        const response = await this.executeWithRetry(
          (attemptSignal) => adapter.search(query, {
            ...options,
            signal: attemptSignal,
            onProgress: (progress) => {
              onProgress?.({
                ...progress,
                message: `[${name}] ${progress.message}`
              });
            }
          }),
          name,
          {
            timeoutMs,
            signal
          }
        );
        this.resetCircuit(name);
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.recordFailure(name);
        onProgress?.({
          phase: "error",
          message: `${name} failed: ${lastError.message}, trying fallback...`
        });
      }
    }
    throw lastError || new Error("All search adapters failed");
  }
  /**
   * Scrape single URL with fallback chain
   */
  async scrape(url, options = {}) {
    const { onProgress, signal } = options;
    const timeoutMs = this.normalizeTimeout(
      options.timeout,
      DEFAULT_SCRAPE_TIMEOUT_MS
    );
    let lastError = null;
    for (const adapter of this.scraperAdapters) {
      const name = adapter.getName();
      if (this.isCircuitOpen(name)) {
        onProgress?.({
          phase: "starting",
          message: `Skipping ${name} (circuit open)`,
          url
        });
        continue;
      }
      try {
        const response = await this.executeWithRetry(
          (attemptSignal) => adapter.scrape(url, {
            ...options,
            signal: attemptSignal,
            onProgress: (progress) => {
              onProgress?.({
                ...progress,
                message: `[${name}] ${progress.message}`
              });
            }
          }),
          name,
          {
            timeoutMs,
            signal
          }
        );
        this.resetCircuit(name);
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.recordFailure(name);
        onProgress?.({
          phase: "error",
          message: `${name} failed: ${lastError.message}, trying fallback...`,
          url
        });
      }
    }
    throw lastError || new Error("All scraper adapters failed");
  }
  /**
   * Scrape multiple URLs with fallback and partial results
   */
  async scrapeMany(urls, options = {}) {
    const { onProgress } = options;
    const results = /* @__PURE__ */ new Map();
    const failed = /* @__PURE__ */ new Map();
    const startTime = Date.now();
    const primaryAdapter = this.scraperAdapters.find(
      (a) => !this.isCircuitOpen(a.getName())
    );
    if (primaryAdapter) {
      const name = primaryAdapter.getName();
      try {
        const batchResult = await primaryAdapter.scrapeMany(urls, {
          ...options,
          onProgress: (progress) => {
            onProgress?.({
              ...progress,
              message: `[${name}] ${progress.message}`
            });
          }
        });
        for (const [url, response] of batchResult.results) {
          results.set(url, response);
        }
        const failedUrls = Array.from(batchResult.failed.keys());
        if (failedUrls.length > 0) {
          onProgress?.({
            phase: "starting",
            message: `Retrying ${failedUrls.length} failed URLs with fallback...`,
            url: failedUrls[0]
          });
          for (const url of failedUrls) {
            try {
              const response = await this.scrape(url, options);
              results.set(url, response);
            } catch (error) {
              failed.set(
                url,
                error instanceof Error ? error : new Error(String(error))
              );
            }
          }
        }
        return { results, failed, totalDuration: Date.now() - startTime };
      } catch (error) {
        onProgress?.({
          phase: "error",
          message: `Batch scrape failed: ${error instanceof Error ? error.message : String(error)}`,
          url: urls[0]
        });
      }
    }
    for (const url of urls) {
      try {
        const response = await this.scrape(url, options);
        results.set(url, response);
      } catch (error) {
        failed.set(
          url,
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
    return { results, failed, totalDuration: Date.now() - startTime };
  }
  /**
   * Check health of all adapters
   */
  async healthCheck() {
    const checkAdapter = async (adapter) => {
      const name = adapter.getName();
      const start = Date.now();
      try {
        const available = await adapter.isAvailable();
        return {
          name,
          available,
          latency: Date.now() - start
        };
      } catch (error) {
        return {
          name,
          available: false,
          latency: Date.now() - start,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    };
    const [searchHealth, scraperHealth] = await Promise.all([
      Promise.all(this.searchAdapters.map(checkAdapter)),
      Promise.all(this.scraperAdapters.map(checkAdapter))
    ]);
    return {
      search: searchHealth,
      scraper: scraperHealth
    };
  }
  // ─────────────────────────────────────────────────────────────────────────────
  // Private Methods
  // ─────────────────────────────────────────────────────────────────────────────
  /**
   * Execute with exponential backoff retry
   */
  async executeWithRetry(fn, adapterName, options) {
    const { maxRetries, initialDelay, backoffMultiplier, maxDelay } = this.retryConfig;
    const deadline = Date.now() + options.timeoutMs;
    let lastError = null;
    let delay = initialDelay;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (options.signal?.aborted) {
        throw new Error(`${adapterName} aborted`);
      }
      const remainingMs = deadline - Date.now();
      if (remainingMs <= 0) {
        throw new Error(
          `${adapterName} timed out after ${options.timeoutMs}ms`
        );
      }
      const attemptController = new AbortController();
      const abortParent = () => attemptController.abort();
      const timeoutId = setTimeout(() => attemptController.abort(), remainingMs);
      if (options.signal) {
        if (options.signal.aborted) {
          clearTimeout(timeoutId);
          throw new Error(`${adapterName} aborted`);
        }
        options.signal.addEventListener("abort", abortParent, { once: true });
      }
      try {
        return await fn(attemptController.signal);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (options.signal?.aborted) {
          throw new Error(`${adapterName} aborted`);
        }
        if (Date.now() >= deadline) {
          throw new Error(
            `${adapterName} timed out after ${options.timeoutMs}ms`
          );
        }
        if (attempt < maxRetries) {
          log.debug(
            `[WebSearchUseCase] ${adapterName} attempt ${attempt + 1} failed, retrying in ${delay}ms...`
          );
          await this.sleep(delay);
          delay = Math.min(delay * backoffMultiplier, maxDelay);
        }
      } finally {
        clearTimeout(timeoutId);
        options.signal?.removeEventListener("abort", abortParent);
      }
    }
    throw lastError || new Error(`${adapterName} failed after ${maxRetries} retries`);
  }
  /**
   * Check if circuit is open for an adapter
   */
  isCircuitOpen(name) {
    const state = this.circuitState.get(name);
    if (!state || !state.open) return false;
    if (Date.now() - state.lastFailure > this.circuitResetTime) {
      state.open = false;
      state.failures = 0;
      return false;
    }
    return true;
  }
  /**
   * Record a failure for circuit breaker
   */
  recordFailure(name) {
    const state = this.circuitState.get(name) || {
      failures: 0,
      lastFailure: 0,
      open: false
    };
    state.failures++;
    state.lastFailure = Date.now();
    if (state.failures >= this.circuitThreshold) {
      state.open = true;
      log.warn(
        `[WebSearchUseCase] Circuit opened for ${name} after ${state.failures} failures`
      );
    }
    this.circuitState.set(name, state);
  }
  /**
   * Reset circuit for an adapter
   */
  resetCircuit(name) {
    this.circuitState.delete(name);
  }
  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  normalizeTimeout(timeoutMs, fallback) {
    if (typeof timeoutMs !== "number" || !Number.isFinite(timeoutMs)) {
      return fallback;
    }
    return Math.min(
      MAX_OPERATION_TIMEOUT_MS,
      Math.max(MIN_OPERATION_TIMEOUT_MS, timeoutMs)
    );
  }
};

// src/adapters/onecrawl.adapter.ts
var import_onecrawl = require("onecrawl");
var OneCrawlScraperAdapter = class {
  scrapeUseCase = (0, import_onecrawl.createScrapeUseCase)();
  available = null;
  async scrape(url, options) {
    const startTime = Date.now();
    const oneCrawlOptions = {
      preferBrowser: options?.extractMedia ?? false,
      fallbackToFetch: true,
      timeout: options?.timeout ?? 3e4,
      cache: options?.cache ?? true,
      extractMedia: options?.extractMedia ?? true,
      extractLinks: true,
      extractMetadata: true,
      onProgress: options?.onProgress ? (event) => {
        options.onProgress?.({
          phase: event.phase,
          message: event.message,
          url: event.url ?? url,
          progress: event.progress
        });
      } : void 0,
      signal: options?.signal
    };
    const response = await this.scrapeUseCase.execute(url, oneCrawlOptions);
    return {
      result: {
        url: response.result.url,
        title: response.result.title,
        content: response.result.content,
        links: response.result.links?.map((link) => ({
          href: link.href,
          text: link.text
        })),
        media: response.result.media ? {
          images: response.result.media.images?.map((img) => ({
            src: img.src,
            alt: img.alt ?? ""
          })) ?? [],
          videos: response.result.media.videos?.map((vid) => ({
            src: vid.src,
            title: vid.title ?? ""
          })) ?? []
        } : void 0
      },
      cached: response.cached,
      duration: Date.now() - startTime,
      source: this.getName()
    };
  }
  async scrapeMany(urls, options) {
    const startTime = Date.now();
    const results = /* @__PURE__ */ new Map();
    const failed = /* @__PURE__ */ new Map();
    const resultMap = await this.scrapeUseCase.executeMany(urls, {
      preferBrowser: options?.extractMedia ?? false,
      fallbackToFetch: true,
      timeout: options?.timeout ?? 3e4,
      cache: options?.cache ?? true,
      extractMedia: options?.extractMedia ?? true,
      concurrency: 5,
      onProgress: options?.onProgress ? (event) => {
        options.onProgress?.({
          phase: event.phase,
          message: event.message,
          url: event.url ?? urls[0] ?? "",
          progress: event.progress
        });
      } : void 0,
      signal: options?.signal
    });
    for (const [url, scrapeResult] of resultMap) {
      results.set(url, {
        result: {
          url: scrapeResult.url,
          title: scrapeResult.title,
          content: scrapeResult.content
        },
        cached: false,
        duration: scrapeResult.loadTime ?? 0,
        source: this.getName()
      });
    }
    return {
      results,
      failed,
      totalDuration: Date.now() - startTime
    };
  }
  async isAvailable() {
    if (this.available !== null) return this.available;
    try {
      const scrapers = await this.scrapeUseCase.getAvailableScrapers();
      this.available = scrapers.length > 0;
      return this.available;
    } catch {
      this.available = false;
      return false;
    }
  }
  getName() {
    return "onecrawl";
  }
};
function createOneCrawlScraperAdapter() {
  return new OneCrawlScraperAdapter();
}

// src/adapters/onecrawl-search.adapter.ts
var import_onecrawl2 = require("onecrawl");
var OneCrawlSearchAdapter = class {
  searchUseCase = (0, import_onecrawl2.createSearchUseCase)();
  available = null;
  async search(query, options) {
    const startTime = Date.now();
    const oneCrawlOptions = {
      engine: options?.engine ?? "duckduckgo",
      maxResults: options?.maxResults ?? 10,
      useBrowser: options?.engine === "google" || options?.engine === "bing",
      onProgress: options?.onProgress ? (event) => {
        options.onProgress?.({
          phase: event.phase,
          message: event.message,
          results: event.progress
        });
      } : void 0,
      signal: options?.signal
    };
    const results = await this.searchUseCase.execute(query, oneCrawlOptions);
    return {
      results: {
        query: results.query,
        results: results.results.map((r, i) => ({
          title: r.title,
          url: r.url,
          snippet: r.snippet ?? "",
          position: r.position ?? i + 1
        })),
        totalResults: results.totalResults,
        searchTime: results.searchTime
      },
      cached: false,
      duration: Date.now() - startTime,
      source: this.getName()
    };
  }
  async isAvailable() {
    if (this.available !== null) return this.available;
    this.available = true;
    return this.available;
  }
  getName() {
    return "onecrawl";
  }
};
function createOneCrawlSearchAdapter() {
  return new OneCrawlSearchAdapter();
}

// src/adapters/browser-service.adapter.ts
var BrowserServiceSearchAdapter = class {
  service;
  available = null;
  constructor() {
    this.service = new BrowserService();
  }
  async search(query, options = {}) {
    const { maxResults, engine, timeout = 6e4, onProgress, signal } = options;
    const startTime = Date.now();
    if (signal?.aborted) {
      throw new Error("Search aborted");
    }
    onProgress?.({
      phase: "starting",
      message: `Searching for "${query}" via browser...`
    });
    try {
      const timeoutPromise = new Promise((_, reject) => {
        const id = setTimeout(
          () => reject(new Error("Search timeout")),
          timeout
        );
        signal?.addEventListener("abort", () => {
          clearTimeout(id);
          reject(new Error("Search aborted"));
        });
      });
      const emit = onProgress ? (action) => {
        onProgress({
          phase: action.status === "complete" ? "complete" : action.status === "error" ? "error" : "searching",
          message: action.message || action.target || ""
        });
      } : void 0;
      const searchPromise = this.service.search(
        query,
        { maxResults, engine },
        emit
      );
      const results = await Promise.race([searchPromise, timeoutPromise]);
      const duration = Date.now() - startTime;
      onProgress?.({
        phase: "complete",
        message: `Found ${results.results.length} results`,
        results: results.results.length
      });
      return {
        results,
        cached: false,
        duration,
        source: this.getName()
      };
    } catch (error) {
      onProgress?.({
        phase: "error",
        message: error instanceof Error ? error.message : "Search failed"
      });
      throw error;
    }
  }
  async isAvailable() {
    if (this.available !== null) return this.available;
    try {
      const result = await this.service.search("test", { maxResults: 1 });
      this.available = result.results.length >= 0;
    } catch {
      this.available = false;
    }
    return this.available;
  }
  getName() {
    return "browser-service";
  }
};
var BrowserServiceScraperAdapter = class {
  service;
  available = null;
  constructor() {
    this.service = new BrowserService();
  }
  async scrape(url, options = {}) {
    const {
      includeImages,
      includeLinks,
      timeout = 3e4,
      onProgress,
      signal
    } = options;
    const startTime = Date.now();
    if (signal?.aborted) {
      throw new Error("Scrape aborted");
    }
    onProgress?.({
      phase: "starting",
      message: `Scraping ${url} via browser...`,
      url
    });
    try {
      const timeoutPromise = new Promise((_, reject) => {
        const id = setTimeout(
          () => reject(new Error("Scrape timeout")),
          timeout
        );
        signal?.addEventListener("abort", () => {
          clearTimeout(id);
          reject(new Error("Scrape aborted"));
        });
      });
      const emit = onProgress ? (action) => {
        onProgress({
          phase: action.status === "complete" ? "complete" : action.status === "error" ? "error" : action.action === "navigating" ? "navigating" : "extracting",
          message: action.message || action.target || "",
          url: action.url || url
        });
      } : void 0;
      const scrapePromise = this.service.scrape(
        url,
        { includeImages, includeLinks },
        emit
      );
      const result = await Promise.race([scrapePromise, timeoutPromise]);
      const duration = Date.now() - startTime;
      onProgress?.({
        phase: "complete",
        message: `Scraped ${result.content?.length || 0} characters`,
        url
      });
      return {
        result,
        cached: false,
        duration,
        source: this.getName()
      };
    } catch (error) {
      onProgress?.({
        phase: "error",
        message: error instanceof Error ? error.message : "Scrape failed",
        url
      });
      throw error;
    }
  }
  async scrapeMany(urls, options = {}) {
    const startTime = Date.now();
    const results = /* @__PURE__ */ new Map();
    const failed = /* @__PURE__ */ new Map();
    for (const url of urls) {
      try {
        const response = await this.scrape(url, options);
        results.set(url, response);
      } catch (error) {
        failed.set(
          url,
          error instanceof Error ? error : new Error("Scrape failed")
        );
      }
    }
    return {
      results,
      failed,
      totalDuration: Date.now() - startTime
    };
  }
  async isAvailable() {
    if (this.available !== null) return this.available;
    try {
      const result = await this.service.scrape("https://example.com");
      this.available = !!result.content;
    } catch {
      this.available = false;
    }
    return this.available;
  }
  getName() {
    return "browser-service";
  }
};

// src/tools.ts
var DEFAULT_SEARCH_TIMEOUT = 6e4;
var DEFAULT_SCRAPE_TIMEOUT = 3e4;
var isAgenticBrowserFallbackEnabled = () => {
  const enabled = process.env.ENABLE_AGENTIC_BROWSER_FALLBACK === "true";
  logDebug("CONFIG", `Agentic Browser Fallback Enabled: ${enabled}`);
  return enabled;
};
var webSearchUseCaseInstance = null;
function getWebSearchUseCase() {
  if (webSearchUseCaseInstance) return webSearchUseCaseInstance;
  const searchAdapters = [new OneCrawlSearchAdapter()];
  const scraperAdapters = [new OneCrawlScraperAdapter()];
  if (isAgenticBrowserFallbackEnabled()) {
    searchAdapters.push(new BrowserServiceSearchAdapter());
    scraperAdapters.push(new BrowserServiceScraperAdapter());
  }
  webSearchUseCaseInstance = new WebSearchUseCase(
    searchAdapters,
    scraperAdapters,
    {
      maxRetries: 2,
      initialDelay: 1e3,
      backoffMultiplier: 2,
      maxDelay: 5e3
    }
  );
  return webSearchUseCaseInstance;
}
function createProgressLogger(toolName) {
  return (progress) => {
    logDebug(toolName, progress.message, {
      phase: progress.phase,
      ..."results" in progress && progress.results !== void 0 ? { results: progress.results } : {}
    });
  };
}
var webSearchTool = (0, import_mcp.defineMcpTool)({
  name: "web-search",
  description: "Search the web using a search engine. Returns a list of search results with titles, URLs, and snippets. Use this when the user asks to search for information, find websites, or look up topics on the internet.",
  parameters: import_zod2.z.object({
    query: import_zod2.z.string().describe("The search query"),
    maxResults: import_zod2.z.number().min(1).max(20).optional().describe("Maximum number of results to return (default: 10)"),
    engine: import_zod2.z.enum(["google", "duckduckgo", "bing"]).optional().describe("Search engine to use (default: duckduckgo)"),
    type: import_zod2.z.enum(["web", "image", "video", "news"]).optional().describe("Type of search to perform (default: web)"),
    timeout: import_zod2.z.number().min(5e3).max(3e5).optional().describe("Timeout in milliseconds (default: 60000)")
  }),
  domain: "web",
  tags: ["search", "web", "browse", "find", "lookup"],
  async execute({
    query,
    maxResults,
    engine,
    type,
    timeout
  }) {
    logDebug("WEB-SEARCH", `Starting search`, {
      query,
      maxResults,
      engine,
      type
    });
    const useCase = getWebSearchUseCase();
    const response = await useCase.search(query, {
      maxResults: maxResults ?? 10,
      engine,
      searchType: type,
      timeout: timeout ?? DEFAULT_SEARCH_TIMEOUT,
      cache: true,
      onProgress: createProgressLogger("WEB-SEARCH")
    });
    logDebug("WEB-SEARCH", `Search complete`, {
      resultCount: response.results.results.length,
      cached: response.cached,
      duration: response.duration,
      source: response.source
    });
    return response.results;
  }
});
var webScrapeTool = (0, import_mcp.defineMcpTool)({
  name: "web-scrape",
  description: "Scrape and extract content from a specific webpage URL. Returns the page title, main content, and optionally links and images. Use this when the user wants to read or analyze content from a specific website. Images are automatically validated and sorted by quality (HD images preferred).",
  parameters: import_zod2.z.object({
    url: import_zod2.z.string().url().describe("The URL to scrape"),
    includeLinks: import_zod2.z.boolean().optional().describe("Whether to extract links from the page"),
    includeImages: import_zod2.z.boolean().optional().describe("Whether to extract images from the page"),
    validateImages: import_zod2.z.boolean().optional().default(true).describe("Whether to validate image URLs are accessible (default: true)"),
    preferHDImages: import_zod2.z.boolean().optional().default(true).describe("Whether to prefer HD images (800x600+) over smaller ones (default: true)"),
    maxContentLength: import_zod2.z.number().optional().describe("Maximum characters of content to return"),
    timeout: import_zod2.z.number().min(5e3).max(3e5).optional().describe("Timeout in milliseconds (default: 30000)")
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
    timeout
  }) {
    logDebug("WEB-SCRAPE", `Starting scrape`, { url });
    const useCase = getWebSearchUseCase();
    const response = await useCase.scrape(url, {
      includeLinks,
      includeImages,
      maxContentLength,
      timeout: timeout ?? DEFAULT_SCRAPE_TIMEOUT,
      cache: true,
      onProgress: createProgressLogger("WEB-SCRAPE")
    });
    let result = response.result;
    if (includeImages && result.images && result.images.length > 0) {
      const { validateAndScoreImages: validateAndScoreImages2, selectBestImage: selectBestImage2 } = await Promise.resolve().then(() => (init_image_validator(), image_validator_exports));
      const extendedImages = result.images.map((img) => ({
        src: img.src,
        alt: img.alt
      }));
      if (validateImages) {
        const validatedImages = await validateAndScoreImages2(extendedImages, {
          maxImages: 10,
          timeout: 3e3,
          requireHD: preferHDImages
        });
        logDebug("WEB-SCRAPE", `Image validation complete`, {
          original: result.images.length,
          validated: validatedImages.length
        });
        const outputImages = validatedImages.map((img) => ({
          src: img.src,
          alt: img.alt ?? ""
        }));
        result = { ...result, images: outputImages };
      } else {
        const best = selectBestImage2(extendedImages);
        if (best) {
          const bestOutput = { src: best.src, alt: best.alt ?? "" };
          result = { ...result, images: [bestOutput, ...result.images.filter((i) => i.src !== best.src)] };
        }
      }
    }
    logDebug("WEB-SCRAPE", `Scrape complete`, {
      url: response.result.url,
      contentLength: response.result.content?.length ?? 0,
      cached: response.cached,
      duration: response.duration,
      source: response.source,
      imageCount: result.images?.length ?? 0
    });
    return result;
  }
});
var webBatchScrapeTool = (0, import_mcp.defineMcpTool)({
  name: "web-batch-scrape",
  description: "Scrape multiple URLs in parallel for efficiency. Returns results for all URLs that succeeded, with errors for those that failed. Images are automatically validated and sorted by quality.",
  parameters: import_zod2.z.object({
    urls: import_zod2.z.array(import_zod2.z.string().url()).min(1).max(10).describe("Array of URLs to scrape (max 10)"),
    includeLinks: import_zod2.z.boolean().optional().describe("Whether to extract links from pages"),
    includeImages: import_zod2.z.boolean().optional().describe("Whether to extract images from pages"),
    validateImages: import_zod2.z.boolean().optional().default(true).describe("Whether to validate image URLs are accessible (default: true)"),
    timeout: import_zod2.z.number().min(1e4).max(6e5).optional().describe("Timeout in milliseconds (default: 120000)")
  }),
  domain: "web",
  tags: ["scrape", "batch", "extract", "content", "bulk"],
  async execute({ urls, includeLinks, includeImages, validateImages = true, timeout }) {
    logDebug("WEB-BATCH-SCRAPE", `Starting batch scrape`, {
      urlCount: urls.length
    });
    const useCase = getWebSearchUseCase();
    const response = await useCase.scrapeMany(urls, {
      includeLinks,
      includeImages,
      timeout: timeout ?? 12e4,
      cache: true,
      onProgress: createProgressLogger("WEB-BATCH-SCRAPE")
    });
    const results = [];
    const failed = [];
    const { validateAndScoreImages: validateAndScoreImages2 } = await Promise.resolve().then(() => (init_image_validator(), image_validator_exports));
    for (const [_url, scrapeResponse] of response.results) {
      let result = scrapeResponse.result;
      if (includeImages && validateImages && result.images && result.images.length > 0) {
        const extendedImages = result.images.map((img) => ({
          src: img.src,
          alt: img.alt
        }));
        const validatedImages = await validateAndScoreImages2(extendedImages, {
          maxImages: 5,
          // Less per URL in batch mode
          timeout: 2e3,
          requireHD: true
        });
        const outputImages = validatedImages.map((img) => ({
          src: img.src,
          alt: img.alt ?? ""
        }));
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
      totalDuration: response.totalDuration
    });
    return { results, failed };
  }
});
var webSnapshotTool = (0, import_mcp.defineMcpTool)({
  name: "web-snapshot",
  description: "Get an accessibility tree snapshot of a webpage. Returns a structured representation of the page with element references. Use this for analyzing page structure or preparing for more specific interactions.",
  parameters: import_zod2.z.object({
    url: import_zod2.z.string().url().describe("The URL to snapshot")
  }),
  domain: "web",
  tags: ["snapshot", "analyze", "inspect", "structure"],
  async execute({ url }) {
    logDebug("WEB-SNAPSHOT", `Starting snapshot`, { url });
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
  }
});
var webHealthCheckTool = (0, import_mcp.defineMcpTool)({
  name: "web-health-check",
  description: "Check the health status of all web search and scraping services. Returns availability and latency information for each service.",
  parameters: import_zod2.z.object({}),
  domain: "web",
  tags: ["health", "status", "diagnostics"],
  async execute() {
    logDebug("WEB-HEALTH", `Starting health check`);
    const useCase = getWebSearchUseCase();
    const health = await useCase.healthCheck();
    logDebug("WEB-HEALTH", `Health check complete`, {
      searchServices: health.search.length,
      scraperServices: health.scraper.length
    });
    return health;
  }
});
var webSearchTools = {
  "web-search": webSearchTool,
  "web-scrape": webScrapeTool,
  "web-batch-scrape": webBatchScrapeTool,
  "web-snapshot": webSnapshotTool,
  "web-health-check": webHealthCheckTool
};
if (typeof process !== "undefined") {
  process.on("beforeExit", async () => {
    await closeBrowserService();
  });
}

// src/utils/index.ts
init_image_validator();

// src/ports/search.port.ts
var noopWebSearch = {
  async search(query) {
    return {
      results: { query, results: [] },
      cached: false,
      duration: 0,
      source: "noop"
    };
  },
  async isAvailable() {
    return false;
  },
  getName() {
    return "noop";
  }
};

// src/ports/scraper.port.ts
var noopWebScraper = {
  async scrape(url) {
    return {
      result: { url, title: "", content: "" },
      cached: false,
      duration: 0,
      source: "noop"
    };
  },
  async scrapeMany(urls) {
    const results = /* @__PURE__ */ new Map();
    const failed = /* @__PURE__ */ new Map();
    for (const url of urls) {
      results.set(url, {
        result: { url, title: "", content: "" },
        cached: false,
        duration: 0,
        source: "noop"
      });
    }
    return { results, failed, totalDuration: 0 };
  },
  async isAvailable() {
    return false;
  },
  getName() {
    return "noop";
  }
};

// src/ports/extractor.port.ts
var basicContentExtractor = {
  extract(html, url, options = {}) {
    const { maxTextLength = 1e4 } = options;
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.trim() ?? "";
    const descMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
    );
    const description = descMatch?.[1]?.trim();
    const textContent = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, maxTextLength);
    const headings = [];
    const headingRegex = /<h([1-6])[^>]*>([^<]+)<\/h[1-6]>/gi;
    let match;
    while ((match = headingRegex.exec(html)) !== null) {
      if (match[1] && match[2]) {
        headings.push({ level: parseInt(match[1], 10), text: match[2].trim() });
      }
    }
    const links = [];
    if (options.includeLinks) {
      const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
      while ((match = linkRegex.exec(html)) !== null) {
        if (match[1] && match[2]) {
          links.push({ href: match[1], text: match[2].trim() });
        }
      }
    }
    const images = [];
    if (options.includeImages) {
      const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?/gi;
      while ((match = imgRegex.exec(html)) !== null) {
        if (match[1]) {
          images.push({ src: match[1], alt: match[2] });
        }
      }
    }
    const wordCount = textContent.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    return {
      text: textContent,
      title,
      description,
      headings,
      links,
      images,
      videos: [],
      metadata: { url },
      readingTime
    };
  },
  supports(option) {
    const supported = [
      "includeImages",
      "includeLinks",
      "maxTextLength",
      "cleanHtml"
    ];
    return supported.includes(option);
  },
  getName() {
    return "basic";
  }
};

// src/crawler/url-builder.ts
function buildSearchUrl(query, engine, type = "web", useHtml = false) {
  const encodedQuery = encodeURIComponent(query);
  if (engine === "duckduckgo") {
    return buildDuckDuckGoUrl(encodedQuery, type, useHtml);
  }
  if (engine === "bing") {
    return buildBingUrl(encodedQuery, type);
  }
  return buildGoogleUrl(encodedQuery, type);
}
function buildDuckDuckGoUrl(encodedQuery, type, useHtml) {
  if (useHtml && (type === "web" || type === "news")) {
    return `https://html.duckduckgo.com/html/?q=${encodedQuery}`;
  }
  switch (type) {
    case "image":
      return `https://duckduckgo.com/?q=${encodedQuery}&iax=images&ia=images`;
    case "video":
      return `https://duckduckgo.com/?q=${encodedQuery}&iax=videos&ia=videos`;
    case "news":
      return `https://duckduckgo.com/?q=${encodedQuery}&iar=news&ia=news`;
    case "web":
    default:
      return `https://duckduckgo.com/?q=${encodedQuery}&ia=web`;
  }
}
function buildBingUrl(encodedQuery, type) {
  switch (type) {
    case "image":
      return `https://www.bing.com/images/search?q=${encodedQuery}`;
    case "video":
      return `https://www.bing.com/videos/search?q=${encodedQuery}`;
    case "news":
      return `https://www.bing.com/news/search?q=${encodedQuery}`;
    case "web":
    default:
      return `https://www.bing.com/search?q=${encodedQuery}`;
  }
}
function buildGoogleUrl(encodedQuery, type) {
  const tbm = type === "image" ? "isch" : type === "video" ? "vid" : type === "news" ? "nws" : "";
  return `https://www.google.com/search?q=${encodedQuery}${tbm ? `&tbm=${tbm}` : ""}`;
}
function normalizeSearchType(rawType) {
  const normalized = rawType?.toLowerCase();
  if (normalized === "image" || normalized === "imagecontent" || normalized === "images") {
    return "image";
  }
  if (normalized === "video" || normalized === "videos") {
    return "video";
  }
  if (normalized === "news") {
    return "news";
  }
  return "web";
}

// src/crawler/result-parsers.ts
function parseImageResults(pageContent, maxResults) {
  const results = [];
  const enhancedImages = pageContent.media?.images || [];
  const basicImages = pageContent.images || [];
  for (const img of enhancedImages.slice(0, maxResults)) {
    results.push({
      title: img.alt || img.title || "Image",
      url: img.src,
      snippet: img.description || img.alt || "",
      media: {
        url: img.src,
        thumbnail: img.src,
        dimensions: img.width && img.height ? { width: img.width, height: img.height } : void 0
      }
    });
  }
  if (results.length === 0) {
    for (const img of basicImages.slice(0, maxResults)) {
      results.push({
        title: img.alt || "Image",
        url: img.src,
        snippet: img.alt || "",
        media: {
          url: img.src,
          thumbnail: img.src
        }
      });
    }
  }
  return results;
}
function parseVideoResults(pageContent, maxResults) {
  const results = [];
  const videos = pageContent.media?.videos || [];
  for (const vid of videos.slice(0, maxResults)) {
    results.push({
      title: vid.title || "Video",
      url: vid.src || vid.embedUrl || "",
      snippet: vid.description || "",
      media: {
        url: vid.embedUrl || vid.src,
        thumbnail: vid.thumbnail,
        duration: vid.duration ? String(vid.duration) : void 0,
        provider: vid.provider
      }
    });
  }
  return results;
}
function parseSearchResults2(markdown, maxResults) {
  const results = [];
  const seenUrls = /* @__PURE__ */ new Set();
  const headingLinkRegex = /##\s*\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = headingLinkRegex.exec(markdown)) !== null && results.length < maxResults) {
    const title = match[1]?.trim() ?? "";
    let rawUrl = match[2]?.trim() ?? "";
    if (!title || !rawUrl) continue;
    let actualUrl = rawUrl;
    if (rawUrl.includes("duckduckgo.com/l/?uddg=") || rawUrl.includes("duckduckgo.com/l?")) {
      try {
        const urlObj = new URL(rawUrl);
        const encodedUrl = urlObj.searchParams.get("uddg");
        if (encodedUrl) {
          actualUrl = decodeURIComponent(encodedUrl);
        }
      } catch {
        continue;
      }
    }
    if (seenUrls.has(actualUrl)) continue;
    if (actualUrl.includes("duckduckgo.com") || actualUrl.includes("google.com/search") || actualUrl.includes("bing.com/search")) {
      continue;
    }
    seenUrls.add(actualUrl);
    const matchEnd = (match.index ?? 0) + match[0].length;
    const snippetArea = markdown.slice(matchEnd, matchEnd + 500);
    const nextHeading = snippetArea.indexOf("##");
    const snippetText = nextHeading > 0 ? snippetArea.slice(0, nextHeading) : snippetArea.slice(0, 200);
    const snippet = snippetText.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[#*_\[\]]/g, "").replace(/\s+/g, " ").trim().slice(0, 150);
    results.push({
      title,
      url: actualUrl,
      snippet: snippet || title
    });
  }
  return results;
}
function parseJsonResults(content, maxResults) {
  try {
    const jsonContent = content.trim();
    if (jsonContent.startsWith("[") && jsonContent.endsWith("]")) {
      const rawData = JSON.parse(jsonContent);
      return rawData.slice(0, maxResults);
    }
  } catch {
  }
  return null;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BrowserService,
  BrowserServiceScraperAdapter,
  BrowserServiceSearchAdapter,
  OneCrawlScraperAdapter,
  OneCrawlSearchAdapter,
  WebSearchUseCase,
  basicContentExtractor,
  browserActionSchema,
  buildSearchUrl,
  clearLog,
  closeBrowserService,
  createOneCrawlScraperAdapter,
  createOneCrawlSearchAdapter,
  extractedAudioSchema,
  extractedImageSchema,
  extractedVideoSchema,
  getBrowserService,
  isHDImage,
  isReliableDomain,
  isUnreliableDomain,
  logDebug,
  noopWebScraper,
  noopWebSearch,
  normalizeSearchType,
  parseImageResults,
  parseJsonResults,
  parseSearchResults,
  parseVideoResults,
  scoreImage,
  scrapeResultSchema,
  searchResultSchema,
  searchResultsSchema,
  selectBestImage,
  validateAndScoreImages,
  validateImageUrl,
  videoProviderSchema,
  webBatchScrapeTool,
  webHealthCheckTool,
  webScrapeTool,
  webSearchTool,
  webSearchTools,
  webSnapshotTool
});
//# sourceMappingURL=index.js.map