import { Document } from "../../types/document";

export interface ValidationIssue {
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface DocumentValidationResult {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export class DocumentValidatorService {
  static validateDocument(
    document: Partial<Document> | null | undefined,
    options: { strict?: boolean } = {}
  ): DocumentValidationResult {
    const { strict = true } = options;
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];

    if (!document) {
      errors.push({
        field: "document",
        message: "Document payload is missing.",
        severity: "error",
      });
      return { isValid: false, errors, warnings };
    }

    if (!this.hasValue(document.id)) {
      errors.push({
        field: "id",
        message: "Document id is required.",
        severity: "error",
      });
    }

    if (!this.hasValue(document.name)) {
      errors.push({
        field: "name",
        message: "Document name is required.",
        severity: "error",
      });
    }

    if (!this.hasValue(document.status)) {
      errors.push({
        field: "status",
        message: "Document status is required.",
        severity: "error",
      });
    }

    if (strict) {
      if (!document.content || typeof document.content !== "object") {
        errors.push({
          field: "content",
          message: "Document content is required.",
          severity: "error",
        });
      } else if (!this.hasValue(document.content.fullText)) {
        errors.push({
          field: "content.fullText",
          message: "Document content fullText is required.",
          severity: "error",
        });
      }

      if (!document.metadata || typeof document.metadata !== "object") {
        errors.push({
          field: "metadata",
          message: "Document metadata is required.",
          severity: "error",
        });
      }

      if (!document.processing || typeof document.processing !== "object") {
        errors.push({
          field: "processing",
          message: "Document processing state is required.",
          severity: "error",
        });
      }
    } else {
      if (!document.content || typeof document.content !== "object") {
        warnings.push({
          field: "content",
          message: "Document content is still being prepared.",
          severity: "warning",
        });
      } else if (!this.hasValue(document.content.fullText)) {
        warnings.push({
          field: "content.fullText",
          message: "Document fullText is still being prepared.",
          severity: "warning",
        });
      }

      if (!document.metadata || typeof document.metadata !== "object") {
        warnings.push({
          field: "metadata",
          message: "Document metadata is still being prepared.",
          severity: "warning",
        });
      }

      if (!document.processing || typeof document.processing !== "object") {
        warnings.push({
          field: "processing",
          message: "Document processing state is still being prepared.",
          severity: "warning",
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private static hasValue(value: unknown): boolean {
    return value !== undefined && value !== null && !(typeof value === "string" && value.trim().length === 0);
  }
}
