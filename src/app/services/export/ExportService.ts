import { Document } from "../../types/document";
import { ExportFormat, ExportOptions, ExportResult, ExportPayload } from "../../types/export";
import { PDFExportService } from "./PDFExportService";
import { MarkdownExportService } from "./MarkdownExportService";
import { TXTExportService } from "./TXTExportService";
import { JSONExportService } from "./JSONExportService";
import { CSVExportService } from "./CSVExportService";
import { SearchService } from "../document/SearchService";

export class ExportService {
  private static pdfExporter = new PDFExportService();
  private static markdownExporter = new MarkdownExportService();
  private static txtExporter = new TXTExportService();
  private static jsonExporter = new JSONExportService();
  private static csvExporter = new CSVExportService();

  /**
   * Dispatch export tasks to format-specific handlers.
   */
  static async export(
    doc: Document,
    format: ExportFormat | string,
    options?: ExportOptions
  ): Promise<ExportResult> {
    // 1. Normalize format parameter
    let normalizedFormat: ExportFormat;
    const formatLower = String(format).toLowerCase();
    
    switch (formatLower) {
      case "pdf":
        normalizedFormat = ExportFormat.PDF;
        break;
      case "markdown":
      case "md":
        normalizedFormat = ExportFormat.Markdown;
        break;
      case "txt":
      case "text":
        normalizedFormat = ExportFormat.TXT;
        break;
      case "json":
        normalizedFormat = ExportFormat.JSON;
        break;
      case "csv":
        normalizedFormat = ExportFormat.CSV;
        break;
      default:
        // Try direct enum match fallback
        normalizedFormat = format as ExportFormat;
    }

    // 2. Default to including all parts of the document if options is omitted
    const defaultOptions: ExportOptions = {
      includeContent: true,
      includeMetadata: true,
      includeInsights: true,
      includeStatistics: true,
    };
    
    const activeOptions = { ...defaultOptions, ...options };

    // 3. Construct standardized payload once
    let searchSummary = null;
    if (activeOptions.searchQuery && activeOptions.searchQuery.trim().length > 1) {
      const searchResults = SearchService.search(doc, activeOptions.searchQuery);
      searchSummary = {
        query: activeOptions.searchQuery,
        totalMatches: searchResults.length,
        results: searchResults.map((r) => ({
          page: r.page,
          paragraphIndex: r.paragraphIndex,
          matchedText: r.matchedText,
        })),
      };
    }

    const payload: ExportPayload = {
      document: doc,
      metadata: activeOptions.includeMetadata ? doc.metadata : null,
      statistics: activeOptions.includeStatistics ? doc.statistics : null,
      insights: activeOptions.includeInsights ? doc.insights : null,
      searchSummary,
      generatedAt: new Date().toISOString(),
      version: "1.0",
    };

    // 4. Select appropriate export provider
    switch (normalizedFormat) {
      case ExportFormat.PDF:
        return this.pdfExporter.export(payload, activeOptions);
      case ExportFormat.Markdown:
        return this.markdownExporter.export(payload, activeOptions);
      case ExportFormat.TXT:
        return this.txtExporter.export(payload, activeOptions);
      case ExportFormat.JSON:
        return this.jsonExporter.export(payload, activeOptions);
      case ExportFormat.CSV:
        return this.csvExporter.export(payload, activeOptions);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
}
