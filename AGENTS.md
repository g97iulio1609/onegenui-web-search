# AGENTS.md - @onegenui/web-search

Web search and content scraping for generative UI.

## Purpose

This package provides:
- **Web Search**: Search the web using various providers
- **Content Scraping**: Extract content from web pages
- **Browser Service**: Headless browser automation
- **Crawl4AI Integration**: Python-based crawling service

## File Structure

```
src/
├── index.ts              # Public exports
├── types.ts              # Web search types
├── tools.ts              # AI SDK tool definitions
├── browser-service.ts    # Browser automation
├── crawl4ai-service.ts   # Crawl4AI integration (NEEDS REFACTORING)
├── logger.ts             # Logging utilities
└── crawl4ai/             # Crawl4AI specific code

python/                   # Python crawling service
```

## Key Exports

```typescript
export { webSearchTool, scrapeTool } from './tools';
export { BrowserService } from './browser-service';
export { Crawl4AIService } from './crawl4ai-service';
export type { SearchResult, ScrapeResult } from './types';
```

## Development Guidelines

- Handle rate limiting and retries
- Cache search results when appropriate
- Support multiple search providers
- Clean and structure scraped content
- Handle JavaScript-rendered pages

## Refactoring Priorities (from toBeta.md)

| File | LOC | Priority | Action |
|------|-----|----------|--------|
| `crawl4ai-service.ts` | 843 | P0 | Split Python runner, scraping, parsing, caching |

### Target Structure for crawl4ai-service

```
crawl4ai/
├── index.ts              # Public API
├── types.ts              # Types
├── python-runner.ts      # Python process management
├── scraper.ts            # Scraping logic
├── parser.ts             # Content parsing
└── cache.ts              # Result caching
```

## Future: Package Consolidation

From `toBeta.md`, this package will merge with `@onegenui/mcp` into `@onegenui/tools`:

```
@onegenui/tools (consolidated)
├── mcp/        # MCP client and registry
├── search/     # This package (web search)
├── browsing/   # Content extraction
└── ports/      # Hexagonal interfaces
```

## Testing

```bash
pnpm --filter @onegenui/web-search check-types
pnpm --filter @onegenui/web-search build
```

## Dependencies

- `@onegenui/mcp` (workspace)
- `agent-browser` ^0.1.0
- `zod` ^4.0.0
- `ai` ^6.0.0 (peer)
