// =============================================================================
// @onegenui/web-search - Browser Service (CLI-based)
// =============================================================================
// Uses agent-browser CLI with JSON output for reliable cross-platform operation

import type {
  SearchResults,
  ScrapeResult,
  PageSnapshot,
  BrowserServiceOptions,
  SearchOptions,
  ScrapeOptions,
  BrowserAction,
} from "./types";
import {
  runCommand,
  parseSearchResults,
  extractContentFromTree,
  extractLinksFromTree,
} from "./browser";

// -----------------------------------------------------------------------------
// Action Emitter Type
// -----------------------------------------------------------------------------

export type ActionEmitter = (
  action: Omit<BrowserAction, "id" | "timestamp">,
) => void;

// -----------------------------------------------------------------------------
// Browser Service Class
// -----------------------------------------------------------------------------

export class BrowserService {
  private options: BrowserServiceOptions;
  private isOpen = false;

  constructor(options: BrowserServiceOptions = {}) {
    this.options = {
      headless: true,
      viewport: { width: 1280, height: 720 },
      timeout: 30000,
      ...options,
    };
  }

  // ---------------------------------------------------------------------------
  // Core Operations
  // ---------------------------------------------------------------------------

  /**
   * Navigate to a URL and get page snapshot
   */
  async navigate(url: string, emit?: ActionEmitter): Promise<PageSnapshot> {
    emit?.({ action: "navigating", url, status: "loading" });

    const openResult = await runCommand(`open "${url}"`, false);
    if (!openResult.success) {
      emit?.({
        action: "navigating",
        url,
        status: "error",
        error: openResult.error,
      });
      throw new Error(`Failed to navigate: ${openResult.error}`);
    }

    this.isOpen = true;
    emit?.({ action: "navigating", url, status: "complete" });

    emit?.({
      action: "extracting",
      target: "page snapshot",
      status: "loading",
    });
    const snapshotResult = await runCommand("snapshot -i");

    if (!snapshotResult.success || !snapshotResult.data) {
      emit?.({
        action: "extracting",
        target: "page snapshot",
        status: "error",
      });
      throw new Error(`Failed to get snapshot: ${snapshotResult.error}`);
    }

    emit?.({
      action: "extracting",
      target: "page snapshot",
      status: "complete",
    });

    const data = snapshotResult.data as {
      data?: {
        snapshot: string;
        refs: Record<string, { role: string; name: string }>;
      };
    };

    return {
      url,
      tree: data.data?.snapshot ?? String(snapshotResult.data),
      refs: data.data?.refs ?? {},
    };
  }

  /**
   * Search using a search engine and extract results
   */
  async search(
    query: string,
    options: SearchOptions = {},
    emit?: ActionEmitter,
  ): Promise<SearchResults> {
    const { maxResults = 10, engine = "google" } = options;

    // Build search URL
    const searchUrls: Record<string, string> = {
      google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
      bing: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
    };

    const searchUrl = searchUrls[engine] ?? searchUrls.google;

    // Navigate to search
    emit?.({ action: "navigating", url: searchUrl, status: "loading" });
    await runCommand(`open "${searchUrl}"`, false);
    this.isOpen = true;
    emit?.({ action: "navigating", url: searchUrl, status: "complete" });

    // Wait for results
    emit?.({ action: "waiting", target: "search results", status: "loading" });
    await runCommand("wait 2000", false);
    emit?.({ action: "waiting", target: "search results", status: "complete" });

    // Get snapshot
    emit?.({
      action: "extracting",
      target: "search results",
      status: "loading",
    });
    const snapshotResult = await runCommand("snapshot -i");

    if (!snapshotResult.success) {
      emit?.({
        action: "extracting",
        target: "search results",
        status: "error",
        error: snapshotResult.error,
      });
      throw new Error(`Failed to get snapshot: ${snapshotResult.error}`);
    }

    // Parse results from snapshot
    const data = snapshotResult.data as {
      data?: {
        snapshot: string;
        refs: Record<string, { role: string; name: string }>;
      };
    };
    const tree = data.data?.snapshot ?? String(snapshotResult.data);
    const refs = data.data?.refs ?? {};

    const results = parseSearchResults(tree, refs, maxResults);

    emit?.({
      action: "extracting",
      target: "search results",
      status: "complete",
      message: `Found ${results.length} results`,
    });

    return {
      query,
      results,
      totalResults: results.length,
    };
  }

  /**
   * Scrape content from a specific URL
   */
  async scrape(
    url: string,
    options: ScrapeOptions = {},
    emit?: ActionEmitter,
  ): Promise<ScrapeResult> {
    // Navigate
    emit?.({ action: "navigating", url, status: "loading" });
    await runCommand(`open "${url}"`, false);
    this.isOpen = true;
    emit?.({ action: "navigating", url, status: "complete" });

    // Wait for content
    await runCommand("wait 1500", false);

    // Get title
    const titleResult = await runCommand("get title");
    const title = (titleResult.data as { data?: string })?.data ?? "";

    // Get snapshot
    emit?.({ action: "extracting", target: "page content", status: "loading" });
    const snapshotResult = await runCommand("snapshot");

    if (!snapshotResult.success) {
      emit?.({ action: "extracting", target: "page content", status: "error" });
      throw new Error(`Failed to scrape: ${snapshotResult.error}`);
    }

    const data = snapshotResult.data as {
      data?: {
        snapshot: string;
        refs: Record<string, { role: string; name: string }>;
      };
    };
    const tree = data.data?.snapshot ?? String(snapshotResult.data);
    const refs = data.data?.refs ?? {};

    const content = extractContentFromTree(tree, options.maxContentLength);
    const links = options.includeLinks ? extractLinksFromTree(tree) : undefined;

    emit?.({
      action: "extracting",
      target: "page content",
      status: "complete",
    });

    return {
      url,
      title,
      content,
      links,
    };
  }

  /**
   * Close the browser
   */
  async close(): Promise<void> {
    if (this.isOpen) {
      await runCommand("close", false);
      this.isOpen = false;
    }
  }
}

// -----------------------------------------------------------------------------
// Singleton Instance
// -----------------------------------------------------------------------------

let defaultInstance: BrowserService | null = null;

export function getBrowserService(
  options?: BrowserServiceOptions,
): BrowserService {
  if (!defaultInstance) {
    defaultInstance = new BrowserService(options);
  }
  return defaultInstance;
}

export async function closeBrowserService(): Promise<void> {
  if (defaultInstance) {
    await defaultInstance.close();
    defaultInstance = null;
  }
}
