import { DocumentMetadata, DocumentContent } from "../../types/document";

/** Strip HTML tags — mirrors the helper in parserService for safe word-counting */
function stripHtmlTags(html: string): string {
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

export class MetadataService {
  static extractMetadata(fileName: string, fileSize: number, fileType: string, content?: DocumentContent): DocumentMetadata {
    console.log(`[Pipeline] Metadata extraction start — file: ${fileName}, fileType: ${fileType}, pages: ${content?.textPages?.length ?? 0}`);

    const pageCount = content?.textPages?.length || 0;
    let fullText = content?.fullText || "";

    // If fullText is empty but textPages exist (e.g. DOCX with HTML-only pages),
    // derive plain text by stripping HTML tags — prevents wordCount from being 0.
    if (!fullText.trim() && content?.textPages && content.textPages.length > 0) {
      fullText = content.textPages.map(stripHtmlTags).join("\n").trim();
      console.log("[Pipeline] Metadata: fullText was empty — derived from textPages HTML strip.");
    }

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

    const result: DocumentMetadata = {
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

    console.log(
      `[Pipeline] Metadata extraction complete — wordCount: ${wordCount}, characterCount: ${characterCount}, category: ${documentCategory}, readingTime: ${estimatedReadingTime}min`
    );

    return result;
  }
}
