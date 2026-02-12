/**
 * Shared Zod schemas for tool parameters — used by both tools.ts and tools.native.ts.
 */

import { z } from "zod";

export const searchParamsSchema = z.object({
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
});

export const scrapeParamsSchema = z.object({
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
});

export const batchScrapeParamsSchema = z.object({
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
});

export const healthCheckParamsSchema = z.object({});

export const snapshotParamsSchema = z.object({
  url: z.string().url().describe("The URL to snapshot"),
});

export const DEFAULT_SEARCH_TIMEOUT = 60000;
export const DEFAULT_SCRAPE_TIMEOUT = 30000;
