// =============================================================================
// Tree Parser - Extracts data from accessibility tree snapshots
// =============================================================================

import type { SearchResult } from "../types";

// -----------------------------------------------------------------------------
// Search Results Parser
// -----------------------------------------------------------------------------

export function parseSearchResults(
  tree: string,
  refs: Record<string, { role: string; name: string }>,
  maxResults: number,
): SearchResult[] {
  const results: SearchResult[] = [];
  const linkPattern = /- link "([^"]+)" \[ref=(e\d+)\]/g;
  let match: RegExpExecArray | null;

  while (
    (match = linkPattern.exec(tree)) !== null &&
    results.length < maxResults
  ) {
    const [, title, refId] = match;
    const ref = refId ? refs[refId] : undefined;

    if (title && isSearchResult(title)) {
      results.push({
        title,
        url: "",
        snippet: ref?.name ?? "",
        position: results.length + 1,
      });
    }
  }

  return results;
}

function isSearchResult(title: string): boolean {
  const skipPatterns = [
    /^(Images|Videos|News|Maps|Shopping|Books|Flights)$/i,
    /^(Sign in|Settings|Privacy|Terms)$/i,
    /^(About|Help|Feedback)$/i,
    /^More$/i,
  ];
  return !skipPatterns.some((p) => p.test(title));
}

// -----------------------------------------------------------------------------
// Content Extractor
// -----------------------------------------------------------------------------

export function extractContentFromTree(
  tree: string,
  maxLength?: number,
): string {
  const contentPattern = /- (?:heading|text|paragraph|StaticText) "([^"]+)"/g;
  const parts: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = contentPattern.exec(tree)) !== null) {
    const [, textContent] = match;
    if (textContent && textContent.length > 10) {
      parts.push(textContent);
    }
  }

  const content = parts.join("\n\n");
  return maxLength ? content.slice(0, maxLength) : content;
}

// -----------------------------------------------------------------------------
// Links Extractor
// -----------------------------------------------------------------------------

export function extractLinksFromTree(
  tree: string,
): Array<{ text: string; href: string }> {
  const links: Array<{ text: string; href: string }> = [];
  const linkPattern = /- link "([^"]+)"/g;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(tree)) !== null && links.length < 20) {
    const [, text] = match;
    if (text && text.length > 2) {
      links.push({ text, href: "" });
    }
  }

  return links;
}
