import { DocumentMetadata, DocumentContent } from "../../types/document";

export class MetadataService {
  static extractMetadata(fileName: string, fileSize: number, fileType: string, content?: DocumentContent): DocumentMetadata {
    const pageCount = content?.textPages?.length || 0;
    const fullText = content?.fullText || "";
    const words = fullText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const characterCount = fullText.length;
    const estimatedReadingTime = Math.max(1, Math.ceil(wordCount / 200));
    const language = "English";

    // Determine document category based on filename keywords and content
    let documentCategory = "General";
    let documentType = "Document";
    const lowerName = fileName.toLowerCase();
    const lowerContent = fullText.toLowerCase();

    // Category detection
    if (lowerName.includes("financial") || lowerName.includes("report") || lowerName.includes("q4") || lowerName.includes("budget") || lowerContent.includes("financial") || lowerContent.includes("revenue")) {
      documentCategory = "Financial";
    } else if (lowerName.includes("legal") || lowerName.includes("contract") || lowerName.includes("agreement") || lowerName.includes("employment") || lowerContent.includes("agreement") || lowerContent.includes("contract")) {
      documentCategory = "Legal";
    } else if (lowerName.includes("technical") || lowerName.includes("spec") || lowerName.includes("api") || lowerContent.includes("api") || lowerContent.includes("technical")) {
      documentCategory = "Technical";
    } else if (lowerName.includes("resume") || lowerName.includes("cv") || lowerContent.includes("experience") || lowerContent.includes("education")) {
      documentCategory = "Resume";
    }

    // Title extraction: try first heading or first line
    let title = fileName;
    if (content?.sections && content.sections.length > 0) {
      title = content.sections[0].replace(/^#+/, "").trim();
    } else if (content?.paragraphs && content.paragraphs.length > 0) {
      const firstPara = content.paragraphs[0];
      if (firstPara.length < 150) {
        title = firstPara;
      }
    }

    return {
      title,
      author: "Unknown",
      language,
      pageCount,
      wordCount,
      characterCount,
      estimatedReadingTime,
      documentType,
      documentCategory,
      fileType,
      fileSize
    };
  }
}
