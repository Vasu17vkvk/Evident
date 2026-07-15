import { DocumentContent } from "../../types/document";
import { pipelineDebugger } from "../debug/pipelineDebugger";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Configure pdfjs worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export class ParserService {
  static getExtension(name: string): string {
    const parts = name.split(".");
    return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
  }

  /** Strip HTML tags from a string to produce plain text */
  private static stripHtml(html: string): string {
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

  static async extractPDFText(file: File): Promise<string[]> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const pages: string[] = [];
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        pages.push(pageText.trim() || `[Page ${i} contains no extractable text]`);
      }

      return pages.length > 0 ? pages : ["Document contains no extractable text"];
    } catch (err) {
      console.error("PDF text extraction failed:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown PDF extraction error";
      pipelineDebugger.warning(errorMessage, { fileName: file.name, errorType: "PDF_EXTRACTION" });
      return ["Failed to extract text from PDF document"];
    }
  }

  static async extractDOCXText(file: File): Promise<{ htmlPages: string[]; plainText: string }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Get both HTML (for display) and raw text (for processing)
      const [htmlResult, rawTextResult] = await Promise.all([
        mammoth.convertToHtml({ arrayBuffer }),
        mammoth.extractRawText({ arrayBuffer })
      ]);
      
      const html = htmlResult.value;
      // Use rawText from mammoth; fall back to stripping HTML tags if rawText is empty
      // (some DOCX files produce empty rawText but valid HTML via mammoth)
      let plainText = rawTextResult.value || "";
      
      // Split HTML into "pages" (simulate by chunks, since DOCX doesn't have native pages)
      const htmlPages: string[] = [];
      // Split on paragraphs or headings (including those with attributes e.g. <h1 class="...">)
      const chunks = html.split(/(?=<p[ >]|<h[1-6][ >])/i);
      let currentPage = "";
      const maxCharsPerPage = 2000;

      for (const chunk of chunks) {
        if (currentPage.length + chunk.length > maxCharsPerPage && currentPage) {
          htmlPages.push(currentPage);
          currentPage = chunk;
        } else {
          currentPage += chunk;
        }
      }

      if (currentPage) {
        htmlPages.push(currentPage);
      }

      const finalHtmlPages = htmlPages.length > 0 ? htmlPages : ["Document has no readable text content"];

      // If mammoth returned empty rawText, derive plainText by stripping HTML tags from all pages
      if (!plainText.trim()) {
        plainText = finalHtmlPages
          .map((page) => this.stripHtml(page))
          .join("\n")
          .trim();
        console.log("[Pipeline] DOCX: mammoth rawText was empty — derived plainText from HTML pages.");
      }

      return {
        htmlPages: finalHtmlPages,
        plainText
      };
    } catch (err) {
      console.error("DOCX text extraction failed:", err);
      return { htmlPages: ["Failed to extract text from DOCX document"], plainText: "" };
    }
  }

  static async readTxtFile(file: File): Promise<string[]> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const pages: string[] = [];
        let start = 0;
        // Chunk text into pages of ~1200 characters each
        while (start < text.length) {
          pages.push(text.substring(start, start + 1200));
          start += 1200;
        }
        resolve(pages.length > 0 ? pages : ["Document contains no extractable text"]);
      };
      reader.onerror = () => resolve(["Failed to read plain text file contents"]);
      reader.readAsText(file);
    });
  }

  static async parseFile(file: File): Promise<DocumentContent> {
    const extension = this.getExtension(file.name);
    let textPages: string[] = ["Unsupported file type"];
    let fullText = "";

    try {
      if (extension === "pdf") {
        textPages = await this.extractPDFText(file);
        fullText = textPages.join("\n");
      } else if (extension === "docx") {
        const docxResult = await this.extractDOCXText(file);
        textPages = docxResult.htmlPages;
        fullText = docxResult.plainText;
      } else if (extension === "txt") {
        textPages = await this.readTxtFile(file);
        fullText = textPages.join("\n");
      } else {
        textPages = ["Unsupported file type"];
        fullText = "";
        pipelineDebugger.warning(`Unsupported file type: ${extension}`, { fileName: file.name });
      }
    } catch (e) {
      console.error("File extraction pipeline failure:", e);
      const errorMessage = e instanceof Error ? e.message : "Unknown parsing error";
      pipelineDebugger.error(errorMessage, "PARSE_ERROR", {
        fileName: file.name,
        fileType: extension,
      });
      textPages = ["Failed to process document"];
      fullText = "";
    }

    // For DOCX: if fullText is still empty after extraction, strip HTML from textPages as last resort
    if (!fullText.trim() && extension === "docx" && textPages.length > 0) {
      fullText = textPages
        .map((page) => this.stripHtml(page))
        .join("\n")
        .trim();
      console.log("[Pipeline] DOCX: derived fullText from HTML page stripping at parseFile level.");
    }

    const paragraphs = fullText.split(/\n\s*\n/).filter(Boolean);
    // Extract headings (simple heuristic: lines starting with #, or all caps)
    const sections = paragraphs.filter(p => 
      p.startsWith("#") || 
      (p === p.toUpperCase() && p.length > 0 && p.length < 100)
    );

    const result: DocumentContent = {
      textPages: textPages.length > 0 ? textPages : ["Failed to process document"],
      fullText: fullText || "",
      paragraphs: paragraphs.length > 0 ? paragraphs : [],
      sections: sections.length > 0 ? sections : []
    };

    console.log(
      `[Pipeline] Content extraction complete — extension: ${extension}, pages: ${result.textPages?.length ?? 0}, fullText length: ${result.fullText?.length ?? 0}, paragraphs: ${result.paragraphs?.length ?? 0}`
    );

    return result;
  }
}
