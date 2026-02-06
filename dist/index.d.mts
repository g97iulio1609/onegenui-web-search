import { z } from 'zod';
import * as _onegenui_mcp from '@onegenui/mcp';

declare const videoProviderSchema: z.ZodEnum<{
    youtube: "youtube";
    vimeo: "vimeo";
    dailymotion: "dailymotion";
    twitch: "twitch";
    tiktok: "tiktok";
    twitter: "twitter";
}>;
type VideoProvider = z.infer<typeof videoProviderSchema>;
declare const extractedImageSchema: z.ZodObject<{
    src: z.ZodString;
    alt: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    score: z.ZodOptional<z.ZodNumber>;
    description: z.ZodOptional<z.ZodString>;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
type ExtractedImage = z.infer<typeof extractedImageSchema>;
declare const extractedVideoSchema: z.ZodObject<{
    src: z.ZodString;
    embedUrl: z.ZodOptional<z.ZodString>;
    provider: z.ZodOptional<z.ZodEnum<{
        youtube: "youtube";
        vimeo: "vimeo";
        dailymotion: "dailymotion";
        twitch: "twitch";
        tiktok: "tiktok";
        twitter: "twitter";
    }>>;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodNumber>;
    thumbnail: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
type ExtractedVideo = z.infer<typeof extractedVideoSchema>;
declare const extractedAudioSchema: z.ZodObject<{
    src: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
type ExtractedAudio = z.infer<typeof extractedAudioSchema>;
declare const searchResultSchema: z.ZodObject<{
    title: z.ZodString;
    url: z.ZodString;
    snippet: z.ZodString;
    favicon: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodNumber>;
    type: z.ZodOptional<z.ZodEnum<{
        web: "web";
        image: "image";
        video: "video";
        news: "news";
    }>>;
    media: z.ZodOptional<z.ZodObject<{
        url: z.ZodString;
        thumbnail: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodString>;
        views: z.ZodOptional<z.ZodString>;
        publishedAt: z.ZodOptional<z.ZodString>;
        provider: z.ZodOptional<z.ZodEnum<{
            youtube: "youtube";
            vimeo: "vimeo";
            dailymotion: "dailymotion";
            twitch: "twitch";
            tiktok: "tiktok";
            twitter: "twitter";
        }>>;
        dimensions: z.ZodOptional<z.ZodObject<{
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    image: z.ZodOptional<z.ZodString>;
    date: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
type SearchResult = z.infer<typeof searchResultSchema>;
declare const searchResultsSchema: z.ZodObject<{
    query: z.ZodString;
    results: z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        url: z.ZodString;
        snippet: z.ZodString;
        favicon: z.ZodOptional<z.ZodString>;
        position: z.ZodOptional<z.ZodNumber>;
        type: z.ZodOptional<z.ZodEnum<{
            web: "web";
            image: "image";
            video: "video";
            news: "news";
        }>>;
        media: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            thumbnail: z.ZodOptional<z.ZodString>;
            duration: z.ZodOptional<z.ZodString>;
            views: z.ZodOptional<z.ZodString>;
            publishedAt: z.ZodOptional<z.ZodString>;
            provider: z.ZodOptional<z.ZodEnum<{
                youtube: "youtube";
                vimeo: "vimeo";
                dailymotion: "dailymotion";
                twitch: "twitch";
                tiktok: "tiktok";
                twitter: "twitter";
            }>>;
            dimensions: z.ZodOptional<z.ZodObject<{
                width: z.ZodNumber;
                height: z.ZodNumber;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
        image: z.ZodOptional<z.ZodString>;
        date: z.ZodOptional<z.ZodString>;
        source: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    totalResults: z.ZodOptional<z.ZodNumber>;
    searchTime: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
type SearchResults = z.infer<typeof searchResultsSchema>;
type BrowserActionStatus = "pending" | "loading" | "complete" | "error";
declare const browserActionSchema: z.ZodObject<{
    id: z.ZodString;
    action: z.ZodEnum<{
        navigating: "navigating";
        searching: "searching";
        extracting: "extracting";
        clicking: "clicking";
        typing: "typing";
        waiting: "waiting";
        capturing: "capturing";
    }>;
    target: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<{
        pending: "pending";
        loading: "loading";
        complete: "complete";
        error: "error";
    }>;
    message: z.ZodOptional<z.ZodString>;
    error: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodNumber;
}, z.core.$strip>;
type BrowserAction = z.infer<typeof browserActionSchema>;
declare const scrapeResultSchema: z.ZodObject<{
    url: z.ZodString;
    title: z.ZodString;
    content: z.ZodString;
    headings: z.ZodOptional<z.ZodArray<z.ZodString>>;
    links: z.ZodOptional<z.ZodArray<z.ZodObject<{
        text: z.ZodString;
        href: z.ZodString;
    }, z.core.$strip>>>;
    images: z.ZodOptional<z.ZodArray<z.ZodObject<{
        alt: z.ZodString;
        src: z.ZodString;
    }, z.core.$strip>>>;
    media: z.ZodOptional<z.ZodObject<{
        images: z.ZodOptional<z.ZodArray<z.ZodObject<{
            src: z.ZodString;
            alt: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodString>;
            score: z.ZodOptional<z.ZodNumber>;
            description: z.ZodOptional<z.ZodString>;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>>;
        videos: z.ZodOptional<z.ZodArray<z.ZodObject<{
            src: z.ZodString;
            embedUrl: z.ZodOptional<z.ZodString>;
            provider: z.ZodOptional<z.ZodEnum<{
                youtube: "youtube";
                vimeo: "vimeo";
                dailymotion: "dailymotion";
                twitch: "twitch";
                tiktok: "tiktok";
                twitter: "twitter";
            }>>;
            title: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            duration: z.ZodOptional<z.ZodNumber>;
            thumbnail: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
        audio: z.ZodOptional<z.ZodArray<z.ZodObject<{
            src: z.ZodString;
            title: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            duration: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, z.core.$strip>;
type ScrapeResult = z.infer<typeof scrapeResultSchema>;
interface SnapshotRef {
    role: string;
    name: string;
    level?: number;
}
interface PageSnapshot {
    url: string;
    tree: string;
    refs: Record<string, SnapshotRef>;
}
interface BrowserServiceOptions {
    headless?: boolean;
    viewport?: {
        width: number;
        height: number;
    };
    timeout?: number;
}
interface SearchOptions {
    maxResults?: number;
    engine?: "google" | "duckduckgo" | "bing";
    searchType?: "web" | "image" | "video" | "news";
}
interface ScrapeOptions {
    includeImages?: boolean;
    includeLinks?: boolean;
    maxContentLength?: number;
}

type ActionEmitter = (action: Omit<BrowserAction, "id" | "timestamp">) => void;
declare class BrowserService {
    private options;
    private isOpen;
    constructor(options?: BrowserServiceOptions);
    /**
     * Navigate to a URL and get page snapshot
     */
    navigate(url: string, emit?: ActionEmitter): Promise<PageSnapshot>;
    /**
     * Search using a search engine and extract results
     */
    search(query: string, options?: SearchOptions, emit?: ActionEmitter): Promise<SearchResults>;
    /**
     * Scrape content from a specific URL
     */
    scrape(url: string, options?: ScrapeOptions, emit?: ActionEmitter): Promise<ScrapeResult>;
    /**
     * Close the browser
     */
    close(): Promise<void>;
}
declare function getBrowserService(options?: BrowserServiceOptions): BrowserService;
declare function closeBrowserService(): Promise<void>;

/**
 * Write a debug log entry to web.log file (and console in dev mode)
 */
declare function logDebug(context: string, message: string, data?: unknown): void;
/**
 * Clear the log file
 */
declare function clearLog(): void;

declare const webSearchTool: _onegenui_mcp.McpToolDefinition<z.ZodObject<{
    query: z.ZodString;
    maxResults: z.ZodOptional<z.ZodNumber>;
    engine: z.ZodOptional<z.ZodEnum<{
        google: "google";
        duckduckgo: "duckduckgo";
        bing: "bing";
    }>>;
    type: z.ZodOptional<z.ZodEnum<{
        web: "web";
        image: "image";
        video: "video";
        news: "news";
    }>>;
    timeout: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>>;
declare const webScrapeTool: _onegenui_mcp.McpToolDefinition<z.ZodObject<{
    url: z.ZodString;
    includeLinks: z.ZodOptional<z.ZodBoolean>;
    includeImages: z.ZodOptional<z.ZodBoolean>;
    validateImages: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    preferHDImages: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    maxContentLength: z.ZodOptional<z.ZodNumber>;
    timeout: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>>;
declare const webBatchScrapeTool: _onegenui_mcp.McpToolDefinition<z.ZodObject<{
    urls: z.ZodArray<z.ZodString>;
    includeLinks: z.ZodOptional<z.ZodBoolean>;
    includeImages: z.ZodOptional<z.ZodBoolean>;
    validateImages: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    timeout: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>>;
declare const webSnapshotTool: _onegenui_mcp.McpToolDefinition<z.ZodObject<{
    url: z.ZodString;
}, z.core.$strip>>;
declare const webHealthCheckTool: _onegenui_mcp.McpToolDefinition<z.ZodObject<{}, z.core.$strip>>;
declare const webSearchTools: {
    "web-search": _onegenui_mcp.McpToolDefinition<z.ZodObject<{
        query: z.ZodString;
        maxResults: z.ZodOptional<z.ZodNumber>;
        engine: z.ZodOptional<z.ZodEnum<{
            google: "google";
            duckduckgo: "duckduckgo";
            bing: "bing";
        }>>;
        type: z.ZodOptional<z.ZodEnum<{
            web: "web";
            image: "image";
            video: "video";
            news: "news";
        }>>;
        timeout: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    "web-scrape": _onegenui_mcp.McpToolDefinition<z.ZodObject<{
        url: z.ZodString;
        includeLinks: z.ZodOptional<z.ZodBoolean>;
        includeImages: z.ZodOptional<z.ZodBoolean>;
        validateImages: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        preferHDImages: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        maxContentLength: z.ZodOptional<z.ZodNumber>;
        timeout: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    "web-batch-scrape": _onegenui_mcp.McpToolDefinition<z.ZodObject<{
        urls: z.ZodArray<z.ZodString>;
        includeLinks: z.ZodOptional<z.ZodBoolean>;
        includeImages: z.ZodOptional<z.ZodBoolean>;
        validateImages: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        timeout: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    "web-snapshot": _onegenui_mcp.McpToolDefinition<z.ZodObject<{
        url: z.ZodString;
    }, z.core.$strip>>;
    "web-health-check": _onegenui_mcp.McpToolDefinition<z.ZodObject<{}, z.core.$strip>>;
};

/**
 * Image validation utilities - parallel validation without blocking
 *
 * Validates image URLs are accessible and prefers high-resolution images.
 */

/**
 * Check if URL is from a reliable domain
 */
declare function isReliableDomain(url: string): boolean;
/**
 * Check if URL is from a known unreliable domain
 */
declare function isUnreliableDomain(url: string): boolean;
/**
 * Check if image dimensions indicate HD quality
 */
declare function isHDImage(img: ExtractedImage): boolean;
/**
 * Calculate image score based on various factors
 * Higher score = better quality
 */
declare function scoreImage(img: ExtractedImage): number;
/**
 * Validate a single image URL via HEAD request
 * Returns true if accessible, false otherwise
 */
declare function validateImageUrl(url: string, timeout?: number): Promise<boolean>;
/**
 * Validate multiple images in parallel (non-blocking)
 * Returns images that passed validation, sorted by score
 */
declare function validateAndScoreImages(images: ExtractedImage[], options?: {
    maxImages?: number;
    timeout?: number;
    requireHD?: boolean;
}): Promise<ExtractedImage[]>;
/**
 * Select the best image from a list (quick, no validation)
 * Useful when you need just one image quickly
 */
declare function selectBestImage(images: ExtractedImage[]): ExtractedImage | null;

/**
 * Progress callback for search operations
 */
interface SearchProgress {
    phase: "starting" | "searching" | "parsing" | "complete" | "error";
    message: string;
    progress?: number;
    results?: number;
}
type SearchProgressCallback = (progress: SearchProgress) => void;
/**
 * Search options with extended configuration
 */
interface ExtendedSearchOptions extends SearchOptions {
    /** Timeout in milliseconds */
    timeout?: number;
    /** Enable caching */
    cache?: boolean;
    /** Cache TTL in seconds */
    cacheTTL?: number;
    /** Progress callback */
    onProgress?: SearchProgressCallback;
    /** Abort signal for cancellation */
    signal?: AbortSignal;
}
/**
 * Search result with metadata
 */
interface SearchResponse {
    results: SearchResults;
    cached: boolean;
    duration: number;
    source: string;
}
/**
 * WebSearchPort - Primary port for web search operations
 *
 * Implementations:
 * - OneCrawlSearchAdapter (primary)
 * - BrowserServiceSearchAdapter (fallback)
 */
interface WebSearchPort {
    /**
     * Search the web for a query
     */
    search(query: string, options?: ExtendedSearchOptions): Promise<SearchResponse>;
    /**
     * Check if the search service is available
     */
    isAvailable(): Promise<boolean>;
    /**
     * Get service name for identification
     */
    getName(): string;
}
declare const noopWebSearch: WebSearchPort;

/**
 * Progress callback for scrape operations
 */
interface ScrapeProgress {
    phase: "starting" | "navigating" | "extracting" | "complete" | "error";
    message: string;
    url: string;
    progress?: number;
}
type ScrapeProgressCallback = (progress: ScrapeProgress) => void;
/**
 * Scrape options with extended configuration
 */
interface ExtendedScrapeOptions extends ScrapeOptions {
    /** Timeout in milliseconds */
    timeout?: number;
    /** Enable caching */
    cache?: boolean;
    /** Cache TTL in seconds */
    cacheTTL?: number;
    /** Progress callback */
    onProgress?: ScrapeProgressCallback;
    /** Abort signal for cancellation */
    signal?: AbortSignal;
    /** Custom JavaScript to execute */
    jsCode?: string;
    /** CSS selector to wait for */
    waitFor?: string;
    /** Extract media (images, videos) */
    extractMedia?: boolean;
}
/**
 * Scrape result with metadata
 */
interface ScrapeResponse {
    result: ScrapeResult;
    cached: boolean;
    duration: number;
    source: string;
}
/**
 * Batch scrape result
 */
interface BatchScrapeResponse {
    results: Map<string, ScrapeResponse>;
    failed: Map<string, Error>;
    totalDuration: number;
}
/**
 * WebScraperPort - Primary port for web scraping operations
 *
 * Implementations:
 * - OneCrawlScraperAdapter (primary)
 * - BrowserServiceScraperAdapter (fallback)
 */
interface WebScraperPort {
    /**
     * Scrape a single URL
     */
    scrape(url: string, options?: ExtendedScrapeOptions): Promise<ScrapeResponse>;
    /**
     * Scrape multiple URLs in parallel (optimized)
     */
    scrapeMany(urls: string[], options?: ExtendedScrapeOptions): Promise<BatchScrapeResponse>;
    /**
     * Check if the scraper service is available
     */
    isAvailable(): Promise<boolean>;
    /**
     * Get service name for identification
     */
    getName(): string;
}
declare const noopWebScraper: WebScraperPort;

/**
 * Extracted content structure
 */
interface ExtractedContent {
    /** Main text content */
    text: string;
    /** Page title */
    title: string;
    /** Meta description */
    description?: string;
    /** Extracted headings (h1-h6) */
    headings: Array<{
        level: number;
        text: string;
    }>;
    /** Extracted links */
    links: Array<{
        text: string;
        href: string;
    }>;
    /** Extracted images */
    images: Array<{
        src: string;
        alt?: string;
    }>;
    /** Extracted videos */
    videos: Array<{
        src: string;
        title?: string;
        provider?: string;
    }>;
    /** Page metadata */
    metadata: Record<string, string>;
    /** Content language */
    language?: string;
    /** Author if detected */
    author?: string;
    /** Publish date if detected */
    publishedAt?: string;
    /** Reading time estimate in minutes */
    readingTime?: number;
}
/**
 * Extraction options
 */
interface ExtractionOptions {
    /** Include images in extraction */
    includeImages?: boolean;
    /** Include links in extraction */
    includeLinks?: boolean;
    /** Include videos in extraction */
    includeVideos?: boolean;
    /** Maximum text content length */
    maxTextLength?: number;
    /** Clean HTML tags from text */
    cleanHtml?: boolean;
    /** Extract structured data (JSON-LD, microdata) */
    extractStructuredData?: boolean;
}
/**
 * ContentExtractorPort - Port for extracting structured content from HTML
 *
 * This port handles the transformation from raw HTML to structured content.
 * It's separate from scraping (which handles fetching) to allow different
 * extraction strategies.
 *
 * Implementations:
 * - OneCrawlExtractorAdapter (native TypeScript)
 * - CheerioExtractorAdapter (lightweight, no browser needed)
 * - ReadabilityExtractorAdapter (uses Mozilla Readability)
 */
interface ContentExtractorPort {
    /**
     * Extract structured content from HTML
     */
    extract(html: string, url: string, options?: ExtractionOptions): ExtractedContent;
    /**
     * Check if extractor supports a specific option
     */
    supports(option: keyof ExtractionOptions): boolean;
    /**
     * Get extractor name
     */
    getName(): string;
}
/**
 * basicContentExtractor - Simple regex-based extraction
 *
 * Good for quick extraction when external dependencies aren't available.
 * Limited accuracy compared to full HTML parsing.
 */
declare const basicContentExtractor: ContentExtractorPort;

/**
 * OneCrawl Adapter for @onegenui/web-search
 * Implements WebScraperPort using OneCrawl native TypeScript crawler.
 */

/**
 * OneCrawlScraperAdapter - WebScraperPort implementation using OneCrawl
 *
 * This adapter bridges the OneGenUI web-search ports with the OneCrawl
 * TypeScript crawler, providing native scraping without Python dependencies.
 */
declare class OneCrawlScraperAdapter implements WebScraperPort {
    private scrapeUseCase;
    private available;
    scrape(url: string, options?: ExtendedScrapeOptions): Promise<ScrapeResponse>;
    scrapeMany(urls: string[], options?: ExtendedScrapeOptions): Promise<BatchScrapeResponse>;
    isAvailable(): Promise<boolean>;
    getName(): string;
}
/**
 * Create an OneCrawl scraper adapter
 */
declare function createOneCrawlScraperAdapter(): WebScraperPort;

/**
 * OneCrawl Search Adapter for @onegenui/web-search
 * Implements WebSearchPort using OneCrawl native TypeScript crawler.
 */

/**
 * OneCrawlSearchAdapter - WebSearchPort implementation using OneCrawl
 */
declare class OneCrawlSearchAdapter implements WebSearchPort {
    private searchUseCase;
    private available;
    search(query: string, options?: ExtendedSearchOptions): Promise<SearchResponse>;
    isAvailable(): Promise<boolean>;
    getName(): string;
}
/**
 * Create an OneCrawl search adapter
 */
declare function createOneCrawlSearchAdapter(): WebSearchPort;

/**
 * BrowserServiceSearchAdapter - WebSearchPort fallback using agent-browser
 *
 * Used when OneCrawl is not available. Slower but more reliable for
 * JavaScript-heavy pages.
 */
declare class BrowserServiceSearchAdapter implements WebSearchPort {
    private service;
    private available;
    constructor();
    search(query: string, options?: ExtendedSearchOptions): Promise<SearchResponse>;
    isAvailable(): Promise<boolean>;
    getName(): string;
}
/**
 * BrowserServiceScraperAdapter - WebScraperPort fallback using agent-browser
 *
 * Used when OneCrawl is not available. Better for JavaScript-heavy pages.
 */
declare class BrowserServiceScraperAdapter implements WebScraperPort {
    private service;
    private available;
    constructor();
    scrape(url: string, options?: ExtendedScrapeOptions): Promise<ScrapeResponse>;
    scrapeMany(urls: string[], options?: ExtendedScrapeOptions): Promise<BatchScrapeResponse>;
    isAvailable(): Promise<boolean>;
    getName(): string;
}

/**
 * Retry configuration
 */
interface RetryConfig {
    /** Maximum number of retries */
    maxRetries: number;
    /** Initial delay in ms */
    initialDelay: number;
    /** Multiplier for exponential backoff */
    backoffMultiplier: number;
    /** Maximum delay in ms */
    maxDelay: number;
}
/**
 * Health check result
 */
interface HealthStatus {
    name: string;
    available: boolean;
    latency?: number;
    error?: string;
}
/**
 * WebSearchUseCase - Orchestrates search and scraping with fallback chain
 *
 * Features:
 * - Primary/fallback adapter chain
 * - Exponential backoff retry
 * - Circuit breaker pattern
 * - Partial failure handling
 * - Health checks
 */
declare class WebSearchUseCase {
    private searchAdapters;
    private scraperAdapters;
    private retryConfig;
    private circuitState;
    private circuitThreshold;
    private circuitResetTime;
    constructor(searchAdapters: WebSearchPort[], scraperAdapters: WebScraperPort[], retryConfig?: Partial<RetryConfig>);
    /**
     * Search with fallback chain
     */
    search(query: string, options?: ExtendedSearchOptions): Promise<SearchResponse>;
    /**
     * Scrape single URL with fallback chain
     */
    scrape(url: string, options?: ExtendedScrapeOptions): Promise<ScrapeResponse>;
    /**
     * Scrape multiple URLs with fallback and partial results
     */
    scrapeMany(urls: string[], options?: ExtendedScrapeOptions): Promise<BatchScrapeResponse>;
    /**
     * Check health of all adapters
     */
    healthCheck(): Promise<{
        search: HealthStatus[];
        scraper: HealthStatus[];
    }>;
    /**
     * Execute with exponential backoff retry
     */
    private executeWithRetry;
    /**
     * Check if circuit is open for an adapter
     */
    private isCircuitOpen;
    /**
     * Record a failure for circuit breaker
     */
    private recordFailure;
    /**
     * Reset circuit for an adapter
     */
    private resetCircuit;
    /**
     * Sleep helper
     */
    private sleep;
    private normalizeTimeout;
}

/**
 * Search URL builders for various search engines
 */
type SearchType = "web" | "image" | "video" | "news";
type SearchEngine = "google" | "duckduckgo" | "bing";
/**
 * Build a search URL for the specified engine and search type
 */
declare function buildSearchUrl(query: string, engine: SearchEngine, type?: SearchType, useHtml?: boolean): string;
/**
 * Normalize search type from user input to valid enum value
 */
declare function normalizeSearchType(rawType: string | undefined): SearchType;

/**
 * Search result parsers for extracting structured data from crawled pages
 */

/**
 * Parse image search results from scraped media
 */
declare function parseImageResults(pageContent: ScrapeResult, maxResults: number): SearchResult[];
/**
 * Parse video search results from scraped media
 */
declare function parseVideoResults(pageContent: ScrapeResult, maxResults: number): SearchResult[];
/**
 * Parse DuckDuckGo HTML search results from markdown
 */
declare function parseSearchResults(markdown: string, maxResults: number): SearchResult[];
/**
 * Try to parse JS-injected JSON results from page content
 */
declare function parseJsonResults(content: string, maxResults: number): SearchResult[] | null;

export { type ActionEmitter, type BatchScrapeResponse, type BrowserAction, type BrowserActionStatus, BrowserService, type BrowserServiceOptions, BrowserServiceScraperAdapter, BrowserServiceSearchAdapter, type ContentExtractorPort, type ExtendedScrapeOptions, type ExtendedSearchOptions, type ExtractedAudio, type ExtractedContent, type ExtractedImage, type ExtractedVideo, type ExtractionOptions, type HealthStatus, OneCrawlScraperAdapter, OneCrawlSearchAdapter, type PageSnapshot, type RetryConfig, type ScrapeOptions, type ScrapeProgress, type ScrapeProgressCallback, type ScrapeResponse, type ScrapeResult, type SearchEngine, type SearchOptions, type SearchProgress, type SearchProgressCallback, type SearchResponse, type SearchResult, type SearchResults, type SearchType, type SnapshotRef, type VideoProvider, type WebScraperPort, type WebSearchPort, WebSearchUseCase, basicContentExtractor, browserActionSchema, buildSearchUrl, clearLog, closeBrowserService, createOneCrawlScraperAdapter, createOneCrawlSearchAdapter, extractedAudioSchema, extractedImageSchema, extractedVideoSchema, getBrowserService, isHDImage, isReliableDomain, isUnreliableDomain, logDebug, noopWebScraper, noopWebSearch, normalizeSearchType, parseImageResults, parseJsonResults, parseSearchResults, parseVideoResults, scoreImage, scrapeResultSchema, searchResultSchema, searchResultsSchema, selectBestImage, validateAndScoreImages, validateImageUrl, videoProviderSchema, webBatchScrapeTool, webHealthCheckTool, webScrapeTool, webSearchTool, webSearchTools, webSnapshotTool };
