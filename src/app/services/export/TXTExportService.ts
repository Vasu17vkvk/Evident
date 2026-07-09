import { ExportOptions, ExportResult, ExportFormat, ExportPayload } from "../../types/export";

export class TXTExportService {
  async export(payload: ExportPayload, options?: ExportOptions): Promise<ExportResult> {
    const fileName = options?.fileName || `${payload.document.name.replace(/\.[^/.]+$/, "")}_export.txt`;
    
    let txt = `=================================\n`;
    txt += `DOCUMENT INFORMATION\n`;
    txt += `=================================\n\n`;
    txt += `Document Name: ${payload.document.name}\n`;
    txt += `File Size: ${payload.document.size} bytes\n`;
    txt += `Generated At: ${payload.generatedAt}\n`;
    txt += `Exporter Version: ${payload.version}\n\n`;
    
    if (payload.metadata) {
      txt += `---------------------------------\n`;
      txt += `METADATA\n`;
      txt += `---------------------------------\n\n`;
      txt += `Title: ${payload.metadata.title || "N/A"}\n`;
      txt += `Author: ${payload.metadata.author || "N/A"}\n`;
      txt += `Category: ${payload.metadata.documentCategory || "N/A"}\n`;
      txt += `Language: ${payload.metadata.language || "N/A"}\n`;
      txt += `Page Count: ${payload.metadata.pageCount || "N/A"}\n`;
      txt += `Word Count: ${payload.metadata.wordCount || "N/A"}\n`;
      txt += `Character Count: ${payload.metadata.characterCount || "N/A"}\n\n`;
    }

    if (payload.statistics) {
      txt += `---------------------------------\n`;
      txt += `STATISTICS\n`;
      txt += `---------------------------------\n\n`;
      txt += `Words: ${payload.statistics.words ?? "N/A"}\n`;
      txt += `Characters: ${payload.statistics.characters ?? "N/A"}\n`;
      txt += `Paragraphs: ${payload.statistics.paragraphs ?? "N/A"}\n`;
      txt += `Sentences: ${payload.statistics.sentences ?? "N/A"}\n`;
      txt += `Average Sentence Length: ${payload.statistics.averageSentenceLength ?? "N/A"}\n`;
      txt += `Reading Time: ${payload.statistics.readingTime ?? "N/A"} minutes\n\n`;
    }

    if (payload.insights) {
      txt += `---------------------------------\n`;
      txt += `SUMMARY\n`;
      txt += `---------------------------------\n\n`;
      txt += `Executive Summary:\n${payload.insights.executiveSummary || "N/A"}\n\n`;
      txt += `Document Purpose:\n${payload.insights.documentPurpose || "N/A"}\n\n`;

      if (payload.insights.keyTopics && payload.insights.keyTopics.length > 0) {
        txt += `---------------------------------\n`;
        txt += `KEY TOPICS\n`;
        txt += `---------------------------------\n\n`;
        payload.insights.keyTopics.forEach((topic) => {
          txt += `- ${topic}\n`;
        });
        txt += `\n`;
      }

      if (payload.insights.entities) {
        txt += `---------------------------------\n`;
        txt += `ENTITIES\n`;
        txt += `---------------------------------\n\n`;

        const { people, organizations, locations } = payload.insights.entities;

        if (people && people.length > 0) {
          txt += `PEOPLE:\n`;
          people.forEach((p) => {
            const roleStr = p.role ? ` (${p.role})` : "";
            txt += `- ${p.name}${roleStr}: ${p.mentions} mentions\n`;
          });
          txt += `\n`;
        }

        if (organizations && organizations.length > 0) {
          txt += `ORGANIZATIONS:\n`;
          organizations.forEach((org) => {
            const roleStr = org.role ? ` (${org.role})` : "";
            txt += `- ${org.name}${roleStr}: ${org.mentions} mentions\n`;
          });
          txt += `\n`;
        }

        if (locations && locations.length > 0) {
          txt += `LOCATIONS:\n`;
          locations.forEach((loc) => {
            txt += `- ${loc.name}: ${loc.mentions} mentions\n`;
          });
          txt += `\n`;
        }
      }

      if (payload.insights.timeline && payload.insights.timeline.length > 0) {
        txt += `---------------------------------\n`;
        txt += `TIMELINE\n`;
        txt += `---------------------------------\n\n`;
        payload.insights.timeline.forEach((event) => {
          txt += `- [${event.date}] ${event.title} (Page ${event.page})\n`;
          txt += `  ${event.description}\n\n`;
        });
      }
    }

    if (options?.includeContent) {
      txt += `---------------------------------\n`;
      txt += `DOCUMENT CONTENT\n`;
      txt += `---------------------------------\n\n`;
      const pages = payload.document.content?.textPages || payload.document.pagesContent || [];
      pages.forEach((pageText, idx) => {
        txt += `--- Page ${idx + 1} ---\n`;
        txt += `${pageText.replace(/<[^>]*>/g, "")}\n\n`;
      });
    }

    const content = new Blob([txt], { type: "text/plain" });

    return {
      content,
      mimeType: "text/plain",
      fileName,
      format: ExportFormat.TXT,
    };
  }
}
