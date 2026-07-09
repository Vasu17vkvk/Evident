import { ExportOptions, ExportResult, ExportFormat, ExportPayload } from "../../types/export";

export class MarkdownExportService {
  async export(payload: ExportPayload, options?: ExportOptions): Promise<ExportResult> {
    const fileName = options?.fileName || `${payload.document.name.replace(/\.[^/.]+$/, "")}_export.md`;
    
    let md = `# Document: ${payload.document.name}\n\n`;
    md += `- **File Name**: ${payload.document.name}\n`;
    md += `- **File Size**: ${payload.document.size} bytes\n`;
    md += `- **Generated At**: ${payload.generatedAt}\n`;
    md += `- **Exporter Version**: ${payload.version}\n\n`;
    
    if (payload.metadata) {
      md += `## Metadata\n\n`;
      md += `| Attribute | Value |\n`;
      md += `| --- | --- |\n`;
      md += `| **Title** | ${payload.metadata.title || "N/A"} |\n`;
      md += `| **Author** | ${payload.metadata.author || "N/A"} |\n`;
      md += `| **Category** | ${payload.metadata.documentCategory || "N/A"} |\n`;
      md += `| **Language** | ${payload.metadata.language || "N/A"} |\n`;
      md += `| **Page Count** | ${payload.metadata.pageCount || "N/A"} |\n`;
      md += `| **Word Count** | ${payload.metadata.wordCount || "N/A"} |\n`;
      md += `| **Character Count** | ${payload.metadata.characterCount || "N/A"} |\n\n`;
    }

    if (payload.statistics) {
      md += `## Statistics\n\n`;
      md += `| Metric | Count |\n`;
      md += `| --- | --- |\n`;
      md += `| **Words** | ${payload.statistics.words ?? "N/A"} |\n`;
      md += `| **Characters** | ${payload.statistics.characters ?? "N/A"} |\n`;
      md += `| **Paragraphs** | ${payload.statistics.paragraphs ?? "N/A"} |\n`;
      md += `| **Sentences** | ${payload.statistics.sentences ?? "N/A"} |\n`;
      md += `| **Average Sentence Length** | ${payload.statistics.averageSentenceLength ?? "N/A"} |\n`;
      md += `| **Reading Time** | ${payload.statistics.readingTime ?? "N/A"} minutes |\n\n`;
    }

    if (payload.insights) {
      md += `## Summary\n\n`;
      md += `### Executive Summary\n${payload.insights.executiveSummary || "N/A"}\n\n`;
      md += `### Document Purpose\n${payload.insights.documentPurpose || "N/A"}\n\n`;

      if (payload.insights.keyTopics && payload.insights.keyTopics.length > 0) {
        md += `## Key Topics\n\n`;
        payload.insights.keyTopics.forEach((topic) => {
          md += `- ${topic}\n`;
        });
        md += `\n`;
      }

      if (payload.insights.entities) {
        md += `## Entities\n\n`;
        const { people, organizations, locations } = payload.insights.entities;

        if (people && people.length > 0) {
          md += `### People\n\n`;
          md += `| Name | Role | Mentions |\n`;
          md += `| --- | --- | --- |\n`;
          people.forEach((p) => {
            md += `| ${p.name} | ${p.role || "N/A"} | ${p.mentions} |\n`;
          });
          md += `\n`;
        }

        if (organizations && organizations.length > 0) {
          md += `### Organizations\n\n`;
          md += `| Organization | Role | Mentions |\n`;
          md += `| --- | --- | --- |\n`;
          organizations.forEach((org) => {
            md += `| ${org.name} | ${org.role || "N/A"} | ${org.mentions} |\n`;
          });
          md += `\n`;
        }

        if (locations && locations.length > 0) {
          md += `### Locations\n\n`;
          md += `| Location | Mentions |\n`;
          md += `| --- | --- |\n`;
          locations.forEach((loc) => {
            md += `| ${loc.name} | ${loc.mentions} |\n`;
          });
          md += `\n`;
        }
      }

      if (payload.insights.timeline && payload.insights.timeline.length > 0) {
        md += `## Timeline\n\n`;
        md += `| Date | Event Title | Page | Description |\n`;
        md += `| --- | --- | --- | --- |\n`;
        payload.insights.timeline.forEach((event) => {
          md += `| ${event.date} | ${event.title} | ${event.page} | ${event.description} |\n`;
        });
        md += `\n`;
      }
    }

    if (options?.includeContent) {
      md += `## Document Content\n\n`;
      const pages = payload.document.content?.textPages || payload.document.pagesContent || [];
      pages.forEach((pageText, idx) => {
        md += `### Page ${idx + 1}\n${pageText.replace(/<[^>]*>/g, "")}\n\n`;
      });
    }

    const content = new Blob([md], { type: "text/markdown" });

    return {
      content,
      mimeType: "text/markdown",
      fileName,
      format: ExportFormat.Markdown,
    };
  }
}
