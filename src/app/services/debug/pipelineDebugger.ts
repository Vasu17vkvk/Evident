/**
 * Pipeline Debug Logger
 * 
 * Logs all document processing pipeline events with [EVIDENT_PIPELINE] prefix.
 * 
 * Enable/Disable:
 * - Set window.EVIDENT_DEBUG = true/false in browser console
 * - Or set VITE_DEBUG_PIPELINE=true in environment variables
 * 
 * Example:
 * window.EVIDENT_DEBUG = true;  // Enable in production
 * window.EVIDENT_DEBUG = false; // Disable
 */

type LogLevel = "info" | "warn" | "error";

const PREFIX = "[EVIDENT_PIPELINE]";

interface PipelineLog {
  timestamp: number;
  level: LogLevel;
  message: string;
  details?: Record<string, any>;
}

class PipelineDebugger {
  private logs: PipelineLog[] = [];
  private isEnabled: boolean;

  constructor() {
    // Check if debug is enabled via environment or window object
    this.isEnabled = 
      import.meta.env.VITE_DEBUG_PIPELINE === "true" || 
      (typeof window !== "undefined" && (window as any).EVIDENT_DEBUG === true);
    
    // Allow runtime toggle via window.EVIDENT_DEBUG
    if (typeof window !== "undefined") {
      Object.defineProperty(window, "EVIDENT_DEBUG", {
        get: () => this.isEnabled,
        set: (value: boolean) => {
          this.isEnabled = value;
          if (value) {
            this.log("debug enabled", { timestamp: new Date().toISOString() });
          } else {
            this.log("debug disabled", { timestamp: new Date().toISOString() });
          }
        },
      });
    }
  }

  private log(message: string, details?: Record<string, any>, level: LogLevel = "info") {
    if (!this.isEnabled) return;

    const logEntry: PipelineLog = {
      timestamp: Date.now(),
      level,
      message: `${PREFIX} ${message}`,
      details,
    };

    this.logs.push(logEntry);

    // Log to console
    const style = this.getStyle(level);
    const consoleMethod = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    
    if (details && Object.keys(details).length > 0) {
      consoleMethod(`%c${logEntry.message}`, style, details);
    } else {
      consoleMethod(`%c${logEntry.message}`, style);
    }
  }

  private getStyle(level: LogLevel): string {
    const baseStyle = "color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 3px; font-family: monospace;";
    
    switch (level) {
      case "error":
        return `${baseStyle} background-color: #ff4444;`;
      case "warn":
        return `${baseStyle} background-color: #ffaa00;`;
      case "info":
      default:
        return `${baseStyle} background-color: #0066ff;`;
    }
  }

  uploadStarted(fileName: string, fileSize: number) {
    this.log("Upload Started", { fileName, fileSizeKB: (fileSize / 1024).toFixed(2) });
  }

  uploadCompleted(fileName: string) {
    this.log("Upload Completed", { fileName });
  }

  parsingStarted(fileName: string, fileType: string) {
    this.log("Parsing Started", { fileName, fileType });
  }

  parsingCompleted(fileName: string, pageCount: number) {
    this.log("Parsing Completed", { fileName, pageCount });
  }

  metadataStarted(fileName: string) {
    this.log("Metadata Started", { fileName });
  }

  metadataCompleted(fileName: string, wordCount: number, characterCount: number) {
    this.log("Metadata Completed", { fileName, wordCount, characterCount });
  }

  statisticsStarted(fileName: string) {
    this.log("Statistics Started", { fileName });
  }

  statisticsCompleted(
    fileName: string,
    stats: {
      words: number;
      sentences: number;
      paragraphs: number;
      readingTime: number;
    }
  ) {
    this.log("Statistics Completed", { fileName, ...stats });
  }

  documentReady(fileName: string, totalPages: number) {
    this.log("Document Ready", { fileName, totalPages, status: "Ready" });
  }

  error(message: string, errorCode?: string, additionalDetails?: Record<string, any>) {
    this.log(`Error: ${message}`, { errorCode, ...additionalDetails }, "error");
  }

  warning(message: string, additionalDetails?: Record<string, any>) {
    this.log(`Warning: ${message}`, additionalDetails, "warn");
  }

  /**
   * Get all collected logs (useful for debugging or sending to server)
   */
  getLogs(): PipelineLog[] {
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Export logs as JSON for debugging
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Check if debugging is enabled
   */
  isDebugging(): boolean {
    return this.isEnabled;
  }
}

// Single instance
export const pipelineDebugger = new PipelineDebugger();
