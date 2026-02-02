// =============================================================================
// @onegenui/web-search - Type Definitions
// =============================================================================

import { z } from "zod";

// -----------------------------------------------------------------------------
// Media Types (from OneCrawl extraction) - Must be defined first
// -----------------------------------------------------------------------------

export const videoProviderSchema = z.enum([
  "youtube",
  "vimeo",
  "dailymotion",
  "twitch",
  "tiktok",
  "twitter",
]);

export type VideoProvider = z.infer<typeof videoProviderSchema>;

export const extractedImageSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
  title: z.string().optional(),
  score: z.number().optional(),
  description: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export type ExtractedImage = z.infer<typeof extractedImageSchema>;

export const extractedVideoSchema = z.object({
  src: z.string(),
  embedUrl: z.string().optional(),
  provider: videoProviderSchema.optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  duration: z.number().optional(),
  thumbnail: z.string().optional(),
});

export type ExtractedVideo = z.infer<typeof extractedVideoSchema>;

export const extractedAudioSchema = z.object({
  src: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  duration: z.number().optional(),
});

export type ExtractedAudio = z.infer<typeof extractedAudioSchema>;

// -----------------------------------------------------------------------------
// Search Result Types
// -----------------------------------------------------------------------------

export const searchResultSchema = z.object({
  title: z.string(),
  url: z.string(),
  snippet: z.string(),
  favicon: z.string().optional(),
  position: z.number().optional(),
  type: z.enum(["web", "image", "video", "news"]).optional(),
  // Rich media info for image/video results
  media: z
    .object({
      url: z.string(),
      thumbnail: z.string().optional(),
      duration: z.string().optional(),
      views: z.string().optional(),
      publishedAt: z.string().optional(),
      provider: videoProviderSchema.optional(),
      dimensions: z
        .object({
          width: z.number(),
          height: z.number(),
        })
        .optional(),
    })
    .optional(),
  // Additional metadata for news/rich results
  image: z.string().optional(),
  date: z.string().optional(),
  source: z.string().optional(),
});

export type SearchResult = z.infer<typeof searchResultSchema>;

export const searchResultsSchema = z.object({
  query: z.string(),
  results: z.array(searchResultSchema),
  totalResults: z.number().optional(),
  searchTime: z.number().optional(),
});

export type SearchResults = z.infer<typeof searchResultsSchema>;

// -----------------------------------------------------------------------------
// Browser Action Types (for progressive UI)
// -----------------------------------------------------------------------------

export type BrowserActionStatus = "pending" | "loading" | "complete" | "error";

export const browserActionSchema = z.object({
  id: z.string(),
  action: z.enum([
    "navigating",
    "searching",
    "extracting",
    "clicking",
    "typing",
    "waiting",
    "capturing",
  ]),
  target: z.string().optional(),
  url: z.string().optional(),
  status: z.enum(["pending", "loading", "complete", "error"]),
  message: z.string().optional(),
  error: z.string().optional(),
  timestamp: z.number(),
});

export type BrowserAction = z.infer<typeof browserActionSchema>;

// -----------------------------------------------------------------------------
// Scrape Result Types
// -----------------------------------------------------------------------------

export const scrapeResultSchema = z.object({
  url: z.string(),
  title: z.string(),
  content: z.string(),
  headings: z.array(z.string()).optional(),
  links: z
    .array(
      z.object({
        text: z.string(),
        href: z.string(),
      }),
    )
    .optional(),
  // Basic image format
  images: z
    .array(
      z.object({
        alt: z.string(),
        src: z.string(),
      }),
    )
    .optional(),
  // New enhanced media extraction from OneCrawl
  media: z
    .object({
      images: z.array(extractedImageSchema).optional(),
      videos: z.array(extractedVideoSchema).optional(),
      audio: z.array(extractedAudioSchema).optional(),
    })
    .optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export type ScrapeResult = z.infer<typeof scrapeResultSchema>;

// -----------------------------------------------------------------------------
// Snapshot Types (from agent-browser)
// -----------------------------------------------------------------------------

export interface SnapshotRef {
  role: string;
  name: string;
  level?: number;
}

export interface PageSnapshot {
  url: string;
  tree: string;
  refs: Record<string, SnapshotRef>;
}

// -----------------------------------------------------------------------------
// Service Options
// -----------------------------------------------------------------------------

export interface BrowserServiceOptions {
  headless?: boolean;
  viewport?: { width: number; height: number };
  timeout?: number;
}

export interface SearchOptions {
  maxResults?: number;
  engine?: "google" | "duckduckgo" | "bing";
  searchType?: "web" | "image" | "video" | "news";
}

export interface ScrapeOptions {
  includeImages?: boolean;
  includeLinks?: boolean;
  maxContentLength?: number;
}
