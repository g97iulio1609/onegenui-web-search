# AGENTS.md - @onegenui/web-search

Web search and content scraping for generative UI.

## Purpose

This package provides:
- **Web Search**: Search the web using various providers
- **Content Scraping**: Extract content from web pages
- **Browser Service**: Headless browser automation
- **OneCrawl Integration**: Native TypeScript crawling

## File Structure

```
src/
├── index.ts              # Public exports
├── types.ts              # Web search types
├── tools.ts              # AI SDK tool definitions
├── browser-service.ts    # Browser automation
├── logger.ts             # Logging utilities
├── ports/                # Hexagonal architecture ports
└── adapters/             # OneCrawl, Playwright, Fetch adapters
```

## Key Exports

```typescript
export { webSearchTools } from './tools';
export { BrowserService } from './browser-service';
export { OneCrawlScraperAdapter, OneCrawlSearchAdapter } from './adapters';
export type { SearchResult, ScrapeResult } from './types';
```

## Development Guidelines

- Handle rate limiting and retries
- Cache search results when appropriate
- Support multiple search providers
- Clean and structure scraped content
- Handle JavaScript-rendered pages

## Architecture

Uses hexagonal architecture with:
- **Ports**: WebSearchPort, WebScraperPort, ContentExtractorPort
- **Adapters**: OneCrawl (primary), Playwright, Fetch
- **Use Cases**: WebSearchUseCase with fallback chain

## Testing

```bash
pnpm --filter @onegenui/web-search check-types
pnpm --filter @onegenui/web-search build
```

## Dependencies

- `onecrawl` (workspace)
- `@onegenui/mcp` (workspace)
- `zod` ^4.0.0
- `ai` ^6.0.0 (peer)
