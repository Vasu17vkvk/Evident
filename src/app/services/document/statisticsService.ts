import { DocumentStatistics, DocumentContent } from "../../types/document";

/** Strip HTML tags for statistics derivation when fullText is empty */
function stripHtmlForStats(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

export class StatisticsService {
  static calculateStatistics(content?: DocumentContent): DocumentStatistics {
    console.log(`[Pipeline] Statistics generation start — pages: ${content?.textPages?.length ?? 0}, fullText length: ${content?.fullText?.length ?? 0}`);

    let fullText = content?.fullText || "";
    const textPages = content?.textPages || [];
    const paragraphs = content?.paragraphs || [];
    const sections = content?.sections || [];

    // If fullText is empty but textPages exist (e.g. DOCX with HTML-only pages),
    // derive plain text by stripping HTML — prevents all statistics from being 0.
    if (!fullText.trim() && textPages.length > 0) {
      fullText = textPages.map(stripHtmlForStats).join("\n").trim();
      console.log("[Pipeline] Statistics: fullText was empty — derived from textPages HTML strip.");
    }

    // Words: split on whitespace and filter non-empty
    const words = fullText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Sentences: split on sentence endings and filter
    const sentences = fullText.split(/[.!?]\s+/).filter(Boolean);
    const sentenceCount = sentences.length;

    // Calculate average sentence length (in words)
    let totalSentenceWords = 0;
    for (const sentence of sentences) {
      const sentenceWords = sentence.split(/\s+/).filter(Boolean);
      totalSentenceWords += sentenceWords.length;
    }
    const averageSentenceLength = sentenceCount > 0 ? Math.round(totalSentenceWords / sentenceCount) : 0;

    // Reading time: average 200 words per minute
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    // Headings: count sections (from content.sections) plus any markdown headings
    const headingMatches = fullText.match(/^#+\s+.+$/gm) || [];
    const headings = sections.length + headingMatches.length;

    // Lists: count bullet points, numbered lists
    const listMatches = fullText.match(/^[\s]*[•\-*]|^\d+[.)]/gm) || [];
    const lists = listMatches.length;

    // Tables: look for table markers (we'll keep this simple for now)
    // In plain text, tables might be marked with pipes or dashes, but for this
    // implementation we'll keep it at 0 unless we find clear markers
    const tableMatches = fullText.match(/\|/g) || [];
    const tables = tableMatches.length > 0 ? 1 : 0;

    // Images: we don't have access to actual images, so this will be 0 for now
    const images = 0;

    const result: DocumentStatistics = {
      words: wordCount,
      characters: fullText.length,
      paragraphs: paragraphs.length,
      sentences: sentenceCount,
      tables,
      images,
      lists,
      headings,
      averageSentenceLength,
      readingTime
    };

    console.log(
      `[Pipeline] Statistics generation complete — words: ${wordCount}, sentences: ${sentenceCount}, paragraphs: ${paragraphs.length}, readingTime: ${readingTime}min`
    );

    return result;
  }
}
