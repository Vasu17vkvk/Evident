import { Document } from "../../types/document";

export interface SearchResult {
  page: number; // 1-based page number
  paragraphIndex: number; // 0-based paragraph index within the page
  matchIndex: number; // 0-based global match index
  matchedText: string;
  charOffset: number; // Character offset within page content
}

export class SearchService {
  /**
   * Search for a query inside the document textPages and content.
   */
  static search(doc: Document | null | undefined, query: string): SearchResult[] {
    if (!doc || !query || !query.trim()) return [];

    const results: SearchResult[] = [];
    const pages = doc.content?.textPages || doc.pagesContent || [];
    const normalizedQuery = query.toLowerCase();
    let globalMatchIndex = 0;

    pages.forEach((pageText, pageIdx) => {
      const pageNum = pageIdx + 1;
      
      // Clean page text of HTML tags to avoid matching markup (e.g. for DOCX)
      // We will perform match mapping on the clean text, and then align offsets
      const cleanText = pageText.replace(/<[^>]*>/g, " ");

      // Split clean page text into paragraphs
      const paragraphs = cleanText.split(/\n+/).map(p => p.trim()).filter(Boolean);
      let paragraphSearchStartIndex = 0;

      paragraphs.forEach((para, paraIdx) => {
        let startPos = 0;
        const normalizedPara = para.toLowerCase();

        while (true) {
          const matchPos = normalizedPara.indexOf(normalizedQuery, startPos);
          if (matchPos === -1) break;

          const matchedText = para.substring(matchPos, matchPos + query.length);

          // Find paragraph offset inside the original pageText (respecting html tags if present)
          // For plain text pages, cleanText is identical to pageText.
          // For DOCX html pages, pageText contains HTML tags, so we align paragraph text.
          const cleanParaOffset = cleanText.indexOf(para, paragraphSearchStartIndex);
          
          let pageMatchOffset = cleanParaOffset !== -1 ? cleanParaOffset + matchPos : matchPos;

          // If there is HTML in the pageText, we should map the clean offset back to HTML offset.
          // Let's implement a simple mapping:
          if (pageText !== cleanText) {
            pageMatchOffset = this.mapCleanOffsetToHtmlOffset(pageText, pageMatchOffset);
          }

          results.push({
            page: pageNum,
            paragraphIndex: paraIdx,
            matchIndex: globalMatchIndex++,
            matchedText,
            charOffset: pageMatchOffset,
          });

          startPos = matchPos + query.length;
        }

        // Update paragraph search start index
        const cleanParaIndex = cleanText.indexOf(para, paragraphSearchStartIndex);
        if (cleanParaIndex !== -1) {
          paragraphSearchStartIndex = cleanParaIndex + para.length;
        }
      });
    });

    return results;
  }

  /**
   * Map an offset in stripped text back to the offset in the original HTML.
   */
  private static mapCleanOffsetToHtmlOffset(html: string, cleanOffset: number): number {
    let htmlIdx = 0;
    let cleanIdx = 0;
    let inTag = false;

    while (htmlIdx < html.length && cleanIdx < cleanOffset) {
      const char = html[htmlIdx];
      if (char === "<") {
        inTag = true;
        htmlIdx++;
      } else if (char === ">") {
        inTag = false;
        htmlIdx++;
        // HTML space is added in replace(/<[^>]*>/g, " ")
        cleanIdx++; 
      } else if (inTag) {
        htmlIdx++;
      } else {
        htmlIdx++;
        cleanIdx++;
      }
    }
    return htmlIdx;
  }
}
