import {
  Document,
  CreateDocumentInput,
  DocumentStatus,
} from "../../types/document";

// Simple in-memory store for demonstration
let documents: Map<string, Document> = new Map();

export class DocumentService {
  // Generate a unique ID
  private static generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  // Restore a document state into memory mapping
  static restore(doc: Document) {
    documents.set(doc.id, doc);
  }

  // Create a new document
  static async create(input: CreateDocumentInput): Promise<Document> {
    const now = new Date();
    const id = this.generateId();
    const document: Document = {
      ...input,
      id,
      createdAt: now,
      uploadedAt: now,
      status: DocumentStatus.UPLOADING,
    };
    documents.set(id, document);
    return document;
  }

  // Update a document
  static async update(
    id: string,
    updates: Partial<Document>
  ): Promise<Document | undefined> {
    const existing = documents.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    documents.set(id, updated);
    return updated;
  }
}
