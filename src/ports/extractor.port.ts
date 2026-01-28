// =============================================================================
// @onegenui/web-search - Content Extractor Port (Hexagonal Architecture)
// =============================================================================

/**
 * Extracted content structure
 */
export interface ExtractedContent {
  /** Main text content */
  text: string;
  /** Page title */
  title: string;
  /** Meta description */
  description?: string;
  /** Extracted headings (h1-h6) */
  headings: Array<{ level: number; text: string }>;
  /** Extracted links */
  links: Array<{ text: string; href: string }>;
  /** Extracted images */
  images: Array<{ src: string; alt?: string }>;
  /** Extracted videos */
  videos: Array<{ src: string; title?: string; provider?: string }>;
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
export interface ExtractionOptions {
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
 * - Crawl4AIExtractorAdapter (uses Crawl4AI's built-in extraction)
 * - CheerioExtractorAdapter (lightweight, no browser needed)
 * - ReadabilityExtractorAdapter (uses Mozilla Readability)
 */
export interface ContentExtractorPort {
  /**
   * Extract structured content from HTML
   */
  extract(
    html: string,
    url: string,
    options?: ExtractionOptions,
  ): ExtractedContent;

  /**
   * Check if extractor supports a specific option
   */
  supports(option: keyof ExtractionOptions): boolean;

  /**
   * Get extractor name
   */
  getName(): string;
}

// =============================================================================
// Basic Implementation
// =============================================================================

/**
 * basicContentExtractor - Simple regex-based extraction
 *
 * Good for quick extraction when external dependencies aren't available.
 * Limited accuracy compared to full HTML parsing.
 */
export const basicContentExtractor: ContentExtractorPort = {
  extract(
    html: string,
    url: string,
    options: ExtractionOptions = {},
  ): ExtractedContent {
    const { maxTextLength = 10000 } = options;

    // Basic title extraction
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.trim() ?? "";

    // Basic meta description
    const descMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
    );
    const description = descMatch?.[1]?.trim();

    // Strip HTML tags for text content
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxTextLength);

    // Extract headings
    const headings: Array<{ level: number; text: string }> = [];
    const headingRegex = /<h([1-6])[^>]*>([^<]+)<\/h[1-6]>/gi;
    let match;
    while ((match = headingRegex.exec(html)) !== null) {
      if (match[1] && match[2]) {
        headings.push({ level: parseInt(match[1], 10), text: match[2].trim() });
      }
    }

    // Extract links if requested
    const links: Array<{ text: string; href: string }> = [];
    if (options.includeLinks) {
      const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
      while ((match = linkRegex.exec(html)) !== null) {
        if (match[1] && match[2]) {
          links.push({ href: match[1], text: match[2].trim() });
        }
      }
    }

    // Extract images if requested
    const images: Array<{ src: string; alt?: string }> = [];
    if (options.includeImages) {
      const imgRegex =
        /<img[^>]*src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?/gi;
      while ((match = imgRegex.exec(html)) !== null) {
        if (match[1]) {
          images.push({ src: match[1], alt: match[2] });
        }
      }
    }

    // Estimate reading time (average 200 words per minute)
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
      readingTime,
    };
  },

  supports(option: keyof ExtractionOptions): boolean {
    const supported: (keyof ExtractionOptions)[] = [
      "includeImages",
      "includeLinks",
      "maxTextLength",
      "cleanHtml",
    ];
    return supported.includes(option);
  },

  getName(): string {
    return "basic";
  },
};
