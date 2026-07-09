import { SearchResult } from "./SearchService";

export class HighlightService {
  /**
   * Slice plain text page content into match highlights and plain text parts.
   */
  static getHighlightedSegments(
    text: string,
    pageNumber: number,
    searchResults: SearchResult[],
    activeIndex: number | null
  ) {
    const pageMatches = searchResults.filter(r => r.page === pageNumber);
    if (pageMatches.length === 0) {
      return [{ text, isMatch: false, isActive: false, matchIndex: -1 }];
    }

    // Sort pageMatches by charOffset ascending to avoid overlap issues
    pageMatches.sort((a, b) => a.charOffset - b.charOffset);

    const segments: Array<{ text: string; isMatch: boolean; isActive: boolean; matchIndex: number }> = [];
    let lastIndex = 0;

    for (const match of pageMatches) {
      const start = match.charOffset;
      const end = start + match.matchedText.length;

      // Validate bounds and prevent overlapping segments
      if (start >= lastIndex && end <= text.length) {
        if (start > lastIndex) {
          segments.push({
            text: text.substring(lastIndex, start),
            isMatch: false,
            isActive: false,
            matchIndex: -1,
          });
        }

        const isActive = match.matchIndex === activeIndex;
        segments.push({
          text: text.substring(start, end),
          isMatch: true,
          isActive,
          matchIndex: match.matchIndex,
        });

        lastIndex = end;
      }
    }

    if (lastIndex < text.length) {
      segments.push({
        text: text.substring(lastIndex),
        isMatch: false,
        isActive: false,
        matchIndex: -1,
      });
    }

    return segments;
  }

  /**
   * Highlights HTML strings safely (such as those generated for DOCX paragraphs),
   * splitting tags from plain text segments.
   */
  static highlightHtml(
    html: string,
    pageNumber: number,
    searchResults: SearchResult[],
    activeIndex: number | null
  ): string {
    const pageMatches = searchResults.filter(r => r.page === pageNumber);
    if (pageMatches.length === 0) return html;

    const query = pageMatches[0].matchedText;
    const escapedSearch = query.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`(${escapedSearch})`, "gi");
    const parts = html.split(/(<[^>]+>)/g);

    let pageMatchCounter = 0;

    const highlightedParts = parts.map((part) => {
      if (part.startsWith("<") && part.endsWith(">")) {
        return part;
      }

      return part.replace(regex, (match) => {
        const matchInfo = pageMatches[pageMatchCounter];
        if (matchInfo) {
          pageMatchCounter++;
          const isActive = matchInfo.matchIndex === activeIndex;
          const bgClass = isActive
            ? "bg-[#ff9f00] text-[#0a0a0a] border-[#ff9f00]/80 scale-105"
            : "bg-[#ff3d00]/30 text-[#ff3d00] border-[#ff3d00]/60";
          return `<mark id="search-match-${matchInfo.matchIndex}" class="font-medium border-b px-0.5 rounded-sm transition-all duration-150 ${bgClass}">${match}</mark>`;
        }
        return match;
      });
    });

    return highlightedParts.join("");
  }
}
