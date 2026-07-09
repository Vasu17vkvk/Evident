import { ExportOptions, ExportResult, ExportFormat, ExportPayload } from "../../types/export";

export class JSONExportService {
  async export(payload: ExportPayload, options?: ExportOptions): Promise<ExportResult> {
    const fileName = options?.fileName || `${payload.document.name.replace(/\.[^/.]+$/, "")}_export.json`;
    
    // Serialize the full export payload, preserving nested structures, pretty-printed
    const jsonString = JSON.stringify(payload, null, 2);
    const content = new Blob([jsonString], { type: "application/json" });

    return {
      content,
      mimeType: "application/json",
      fileName,
      format: ExportFormat.JSON,
    };
  }
}
