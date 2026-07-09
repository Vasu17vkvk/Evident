import { Document, DocumentMetadata, DocumentStatistics, DocumentInsights } from "./document";

export enum ExportFormat {
  PDF = "PDF",
  Markdown = "Markdown",
  TXT = "TXT",
  JSON = "JSON",
  CSV = "CSV",
}

export interface ExportOptions {
  includeContent?: boolean;
  includeMetadata?: boolean;
  includeInsights?: boolean;
  includeStatistics?: boolean;
  fileName?: string;
  searchQuery?: string; // Query to include a search summary in the export
}

export interface SearchSummary {
  query: string;
  totalMatches: number;
  results: Array<{
    page: number;
    paragraphIndex: number;
    matchedText: string;
  }>;
}

export interface ExportPayload {
  document: Document;
  metadata?: DocumentMetadata | null;
  statistics?: DocumentStatistics | null;
  insights?: DocumentInsights | null;
  searchSummary?: SearchSummary | null;
  generatedAt: string;
  version: string;
}

export interface ExportResult {
  content: Blob | string;
  mimeType: string;
  fileName: string;
  format: ExportFormat;
}
