import { spawn } from "child_process";
import path from "path";
import type { ActionEmitter } from "./browser-service";
import type {
  ScrapeResult,
  ScrapeOptions,
  SearchResults,
  SearchResult,
  SearchOptions,
  ExtractedImage,
  ExtractedVideo,
  ExtractedAudio,
} from "./types";

// Use extracted modules
import {
  buildSearchUrl,
  normalizeSearchType,
  type SearchType,
  type SearchEngine,
} from "./crawler/url-builder";
import {
  getWaitForSelector,
  getMediaExtractionScript,
} from "./crawler/js-scripts";
import {
  parseImageResults,
  parseVideoResults,
  parseSearchResults,
  parseJsonResults,
} from "./crawler/result-parsers";
import { findPythonPath, findPythonDir } from "./crawler/python-resolver";

export interface Crawl4AIOptions {
  maxResults?: number;
  engine?: "google" | "duckduckgo" | "bing";
  searchType?: "web" | "image" | "video" | "news";
  includeLinks?: boolean;
  maxContentLength?: number;
  js_code?: string;
  wait_for?: string;
  js?: string;
  waitFor?: string;
  cache?: boolean;
  noMedia?: boolean;
}

export class Crawl4AIService {
  private pythonPath: string;
  private scriptPath: string;

  constructor() {
    const pythonDir = findPythonDir();
    this.pythonPath = findPythonPath(pythonDir);
    this.scriptPath = path.resolve(pythonDir, "crawler.py");

    console.log(`[Crawl4AI] Python dir: ${pythonDir}`);
    console.log(`[Crawl4AI] Python path: ${this.pythonPath}`);
    console.log(`[Crawl4AI] Script path: ${this.scriptPath}`);
  }

  /**
   * Search the web using Crawl4AI by scraping search engine results pages.
   * Supports web, image, video, and news search types.
   * Uses parallel crawling for multiple engines/fallbacks.
   */
  async search(
    query: string,
    options: SearchOptions = {},
    emit?: ActionEmitter,
  ): Promise<SearchResults> {
    const { maxResults = 10, engine = "duckduckgo" } = options;

    // Normalize searchType using extracted utility
    const searchType = normalizeSearchType(options.searchType);

    // Build search URL using extracted utility
    const searchUrl = buildSearchUrl(query, engine as SearchEngine, searchType);

    if (emit) {
      emit({
        action: "searching",
        target: query,
        url: searchUrl,
        status: "loading",
        message: `Searching for "${query}" on ${engine} (${searchType})...`,
      });
    }

    // Determine JS extraction script for rich media results
    let jsScript: string | undefined;
    let waitForSelector: string | undefined;

    // For image/video search, prefer Bing which is faster and more reliable
    const effectiveEngine: SearchEngine =
      searchType === "image" || searchType === "video"
        ? "bing"
        : (engine as SearchEngine);

    if (effectiveEngine === "duckduckgo" && searchType !== "web") {
      // Use JS extraction for media search types (extracted utilities)
      jsScript = getMediaExtractionScript(searchType);
      waitForSelector = getWaitForSelector(searchType);
    }

    // For HTML version of DDG (web search), no JS needed
    const useHtmlVersion = searchType === "web" || searchType === "news";
    const finalUrl = useHtmlVersion
      ? buildSearchUrl(query, effectiveEngine, searchType, true)
      : buildSearchUrl(query, effectiveEngine, searchType);

    // Scrape the search results page
    const scrapeResults = await this.scrape(
      finalUrl,
      {
        js: jsScript,
        waitFor: waitForSelector,
        cache: false, // Always fresh for search
        noMedia: searchType === "web" || searchType === "news", // Only extract media for image/video
      },
      emit,
    );

    if (!scrapeResults || scrapeResults.length === 0) {
      throw new Error("No search results page content");
    }

    const pageContent = scrapeResults[0];
    let results: SearchResult[] = [];

    // Debug: log what we received for image search
    if (searchType === "image") {
      console.log(`[Crawl4AI] Image search debug:`, {
        hasMedia: !!pageContent?.media,
        imageCount: pageContent?.media?.images?.length || 0,
        legacyImageCount: pageContent?.images?.length || 0,
        contentLength: pageContent?.content?.length || 0,
      });
    }

    // Parse results based on search type using extracted parsers
    if (
      searchType === "image" &&
      (pageContent?.media?.images?.length || pageContent?.images?.length)
    ) {
      // Image search - use extracted parser
      results = parseImageResults(pageContent!, maxResults);
    } else if (searchType === "video" && pageContent?.media?.videos) {
      // Video search - use extracted parser
      results = parseVideoResults(pageContent, maxResults);
    } else if (jsScript && pageContent?.content) {
      // Try to parse JS-injected JSON results using extracted parser
      const jsonResults = parseJsonResults(pageContent.content, maxResults);
      results =
        jsonResults ||
        parseSearchResults(pageContent.content || "", maxResults);
    } else {
      // Standard text parsing for web/news
      results = parseSearchResults(pageContent?.content || "", maxResults);
    }

    if (emit) {
      emit({
        action: "searching",
        target: query,
        url: finalUrl,
        status: "complete",
        message: `Found ${results.length} results`,
      });
    }

    return {
      query,
      results,
      totalResults: results.length,
    };
  }

  /**
   * Search multiple queries or sources in parallel
   */
  async searchParallel(
    queries: Array<{ query: string; engine?: string; searchType?: string }>,
    emit?: ActionEmitter,
  ): Promise<SearchResults[]> {
    const urls = queries.map((q) =>
      buildSearchUrl(
        q.query,
        (q.engine || "duckduckgo") as SearchEngine,
        normalizeSearchType(q.searchType),
        true, // Use HTML version for reliability
      ),
    );

    if (emit) {
      emit({
        action: "searching",
        target: `${queries.length} parallel searches`,
        status: "loading",
        message: `Starting parallel search for ${queries.length} queries...`,
      });
    }

    // Parallel scrape all URLs
    const scrapeResults = await this.scrape(
      urls,
      { cache: false, noMedia: true },
      emit,
    );

    // Parse each result using extracted parser
    const allResults: SearchResults[] = [];
    for (let i = 0; i < queries.length; i++) {
      const q = queries[i]!;
      const content = scrapeResults[i]?.content || "";
      const results = parseSearchResults(content, 10);

      allResults.push({
        query: q.query,
        results,
        totalResults: results.length,
      });

      if (emit) {
        emit({
          action: "searching",
          target: q.query,
          status: "complete",
          message: `Found ${results.length} results for "${q.query}"`,
        });
      }
    }

    return allResults;
  }

  /**
   * Scrape one or more URLs in parallel with full media extraction
   */
  async scrape(
    urls: string | string[],
    options: ScrapeOptions & Crawl4AIOptions = {},
    emit?: ActionEmitter,
  ): Promise<ScrapeResult[]> {
    const urlList = Array.isArray(urls) ? urls : [urls];
    const { includeImages = true, cache = true, noMedia = false } = options;

    // Build arguments for Python crawler
    const args = ["--urls", JSON.stringify(urlList)];

    if (options.js) {
      args.push("--js", options.js);
    }

    if (options.waitFor) {
      args.push("--wait-for", options.waitFor);
    }

    if (options.cache === false) {
      args.push("--no-cache");
    }

    if (noMedia || !includeImages) {
      args.push("--no-media");
    }

    return new Promise((resolve, reject) => {
      // 5 minute max timeout - AI agent determines when it has enough results
      const timeout = setTimeout(() => {
        try {
          pythonProcess.kill();
        } catch {}
        reject(new Error("Crawl4AI timeout after 5 minutes"));
      }, 300000);

      const pythonProcess = spawn(this.pythonPath, [this.scriptPath, ...args]);

      let errorData = "";
      let resultReceived = false;
      // Buffer for handling large JSON that spans multiple data chunks
      let stdoutBuffer = "";

      const processLine = (line: string) => {
        if (!line.trim()) return;

        try {
          const event = JSON.parse(line);

          if (event.type === "progress") {
            // Forward progress events to frontend
            if (emit) {
              emit({
                action: event.action,
                target: event.target,
                url: event.url,
                status: event.status,
                message: event.message,
              });
            }
          } else if (event.type === "result") {
            resultReceived = true;
            clearTimeout(timeout);
            const results = this.transformCrawlResults(event.results);
            resolve(results);
          } else if (event.type === "error") {
            clearTimeout(timeout);
            reject(new Error(event.message));
          } else {
            // Log unknown events for debug
            console.log("[Crawl4AI Python Event]", event);
          }
        } catch {
          // Log non-JSON output from Python for debug (but skip if it's just Crawl4AI progress)
          if (
            !line.includes("[FETCH]") &&
            !line.includes("[SCRAPE]") &&
            !line.includes("[COMPLETE]") &&
            !line.includes("| ")
          ) {
            console.log("[Crawl4AI Python Stdout]", line.slice(0, 200));
          }
        }
      };

      pythonProcess.stdout.on("data", (data) => {
        // Append to buffer to handle large JSON spanning multiple chunks
        stdoutBuffer += data.toString();

        // Process complete lines (ending with newline)
        const lines = stdoutBuffer.split("\n");
        // Keep the last incomplete line in buffer
        stdoutBuffer = lines.pop() || "";

        for (const line of lines) {
          processLine(line);
        }
      });

      pythonProcess.stderr.on("data", (data) => {
        const msg = data.toString();
        errorData += msg;
        console.error("[Crawl4AI Python Stderr]", msg);
      });

      pythonProcess.on("close", (code) => {
        // Process any remaining buffer content
        if (stdoutBuffer.trim()) {
          processLine(stdoutBuffer);
        }
        clearTimeout(timeout);
        if (code !== 0 && !resultReceived) {
          reject(new Error(`Crawl4AI failed with code ${code}: ${errorData}`));
        }
      });

      pythonProcess.on("error", (err) => {
        clearTimeout(timeout);
        reject(new Error(`Failed to spawn Crawl4AI process: ${err.message}`));
      });
    });
  }

  /**
   * Transform Python crawler results to TypeScript ScrapeResult format.
   */
  private transformCrawlResults(
    results: Array<{
      url: string;
      title?: string;
      content?: string;
      links?: Array<{ text: string; href: string }>;
      images?: Array<{
        src: string;
        alt?: string;
        title?: string;
        score?: number;
        description?: string;
        width?: number;
        height?: number;
      }>;
      videos?: Array<{
        src: string;
        embedUrl?: string;
        provider?: string;
        title?: string;
        description?: string;
        duration?: number;
        thumbnail?: string;
      }>;
      audio?: Array<{
        src: string;
        title?: string;
        description?: string;
        duration?: number;
      }>;
      metadata?: Record<string, string>;
    }>,
  ): ScrapeResult[] {
    return results.map((r) => {
      const result: ScrapeResult = {
        url: r.url,
        title: r.title || "",
        content: r.content || "",
        links: r.links,
        metadata: r.metadata,
      };

      // Add media if available
      if (r.images || r.videos || r.audio) {
        result.media = {
          images: r.images as ExtractedImage[] | undefined,
          videos: r.videos as ExtractedVideo[] | undefined,
          audio: r.audio as ExtractedAudio[] | undefined,
        };

        // Legacy images array
        if (r.images && r.images.length > 0) {
          result.images = r.images.map((img) => ({
            src: img.src,
            alt: img.alt || "",
          }));
        }
      }

      return result;
    });
  }
}
