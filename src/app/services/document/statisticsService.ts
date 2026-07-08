import { DocumentStatistics, DocumentContent } from "../../types/document";

export class StatisticsService {
  static calculateStatistics(content?: DocumentContent): DocumentStatistics {
    const fullText = content?.fullText || "";
    const textPages = content?.textPages || [];
    const paragraphs = content?.paragraphs || [];
    const sections = content?.sections || [];

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

    return {
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
  }
}
