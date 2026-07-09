import { ExportOptions, ExportResult, ExportFormat, ExportPayload } from "../../types/export";

export class CSVExportService {
  async export(payload: ExportPayload, options?: ExportOptions): Promise<ExportResult> {
    const fileName = options?.fileName || `${payload.document.name.replace(/\.[^/.]+$/, "")}_export.csv`;
    
    const rows: Array<{ key: string; value: any }> = [];

    // Document Information
    rows.push({ key: "fileName", value: payload.document.name });
    rows.push({ key: "fileSize", value: payload.document.size });
    rows.push({ key: "fileType", value: payload.document.type });
    rows.push({ key: "generatedAt", value: payload.generatedAt });
    rows.push({ key: "exporterVersion", value: payload.version });

    // Metadata
    if (payload.metadata) {
      rows.push({ key: "title", value: payload.metadata.title });
      rows.push({ key: "author", value: payload.metadata.author });
      rows.push({ key: "category", value: payload.metadata.documentCategory });
      rows.push({ key: "language", value: payload.metadata.language });
      rows.push({ key: "pageCount", value: payload.metadata.pageCount });
      rows.push({ key: "wordCount", value: payload.metadata.wordCount });
      rows.push({ key: "characterCount", value: payload.metadata.characterCount });
    }

    // Statistics
    if (payload.statistics) {
      rows.push({ key: "words", value: payload.statistics.words });
      rows.push({ key: "characters", value: payload.statistics.characters });
      rows.push({ key: "paragraphs", value: payload.statistics.paragraphs });
      rows.push({ key: "sentences", value: payload.statistics.sentences });
      rows.push({ key: "averageSentenceLength", value: payload.statistics.averageSentenceLength });
      rows.push({ key: "readingTime", value: payload.statistics.readingTime });
    }

    // Insights Summary
    if (payload.insights) {
      rows.push({ key: "executiveSummary", value: payload.insights.executiveSummary });
      rows.push({ key: "documentPurpose", value: payload.insights.documentPurpose });
      rows.push({ key: "readingDifficulty", value: payload.insights.readingDifficulty });
      rows.push({ key: "tone", value: payload.insights.tone });

      // Flatten Key Topics
      if (payload.insights.keyTopics) {
        payload.insights.keyTopics.forEach((topic, idx) => {
          rows.push({ key: `keyTopic.${idx + 1}`, value: topic });
        });
      }

      // Flatten Entities
      if (payload.insights.entities) {
        const { people, organizations, locations } = payload.insights.entities;

        if (people) {
          people.forEach((p, idx) => {
            rows.push({ key: `entity.person.${idx + 1}.name`, value: p.name });
            rows.push({ key: `entity.person.${idx + 1}.role`, value: p.role });
            rows.push({ key: `entity.person.${idx + 1}.mentions`, value: p.mentions });
          });
        }

        if (organizations) {
          organizations.forEach((org, idx) => {
            rows.push({ key: `entity.organization.${idx + 1}.name`, value: org.name });
            rows.push({ key: `entity.organization.${idx + 1}.role`, value: org.role });
            rows.push({ key: `entity.organization.${idx + 1}.mentions`, value: org.mentions });
          });
        }

        if (locations) {
          locations.forEach((loc, idx) => {
            rows.push({ key: `entity.location.${idx + 1}.name`, value: loc.name });
            rows.push({ key: `entity.location.${idx + 1}.mentions`, value: loc.mentions });
          });
        }
      }

      // Flatten Timeline
      if (payload.insights.timeline) {
        payload.insights.timeline.forEach((event, idx) => {
          rows.push({ key: `timeline.event.${idx + 1}.date`, value: event.date });
          rows.push({ key: `timeline.event.${idx + 1}.title`, value: event.title });
          rows.push({ key: `timeline.event.${idx + 1}.page`, value: event.page });
          rows.push({ key: `timeline.event.${idx + 1}.description`, value: event.description });
        });
      }
    }

    if (payload.searchSummary) {
      rows.push({ key: "searchQuery", value: payload.searchSummary.query });
      rows.push({ key: "searchTotalMatches", value: payload.searchSummary.totalMatches });
    }

    // Map rows into valid key,value format
    const csvContent = rows
      .map((r) => `${this.escapeCSV(r.key)},${this.escapeCSV(r.value)}`)
      .join("\n");

    // Prepend UTF-8 BOM to prevent character corruptions
    const bom = "\ufeff";
    const content = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });

    return {
      content,
      mimeType: "text/csv",
      fileName,
      format: ExportFormat.CSV,
    };
  }

  private escapeCSV(val: any): string {
    const str = val === undefined || val === null ? "" : String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }
}
