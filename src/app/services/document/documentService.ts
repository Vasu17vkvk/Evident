import {
  Document,
  CreateDocumentInput,
  DocumentStatus,
} from "../../types/document";
import { openDB, DBSchema } from "idb";

interface EvidentDB extends DBSchema {
  documents: {
    key: string;
    value: Document;
  };
}

const dbPromise = openDB<EvidentDB>("EvidentDocumentDB", 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("documents")) {
      db.createObjectStore("documents", { keyPath: "id" });
    }
  },
});

export class DocumentService {
  // Generate a unique ID
  private static generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  // Deep merge helper function
  private static deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result = { ...target };
    for (const [key, value] of Object.entries(source)) {
      if (value !== null && typeof value === "object" && !Array.isArray(value) && key in target) {
        // @ts-ignore: dynamic key access
        result[key] = this.deepMerge(result[key], value);
      } else if (value !== undefined) {
        // @ts-ignore: dynamic key access
        result[key] = value;
      }
    }
    return result;
  }

  // Restore a document state (kept for API compatibility)
  static async restore(doc: Document) {
    const db = await dbPromise;
    await db.put("documents", doc);
  }

  // Create a new document
  static async create(input: CreateDocumentInput): Promise<Document> {
    const now = new Date();
    const id = this.generateId();
    const document: Document = {
      ...input,
      id,
      name: input.name || "Untitled Document",
      type: input.type || "application/octet-stream",
      size: input.size || 0,
      createdAt: now,
      updatedAt: now,
      uploadedAt: now,
      status: DocumentStatus.Uploading,
      processing: {
        uploadProgress: 0,
        parseProgress: 0,
        metadataProgress: 0,
        statisticsProgress: 0,
        insightsProgress: 0,
        overallProgress: 0
      }
    };
    const db = await dbPromise;
    await db.put("documents", document);
    return document;
  }

  // Update a document
  static async update(
    id: string,
    updates: Partial<Document>
  ): Promise<Document | undefined> {
    const db = await dbPromise;
    const existing = await db.get("documents", id);
    if (!existing) return undefined;

    const result: Document = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };

    // Deep merge specific nested objects
    const mergeKeys: Array<keyof Document> = ["processing", "metadata", "content", "statistics", "insights", "searchIndex"];
    for (const key of mergeKeys) {
      if (updates[key] && existing[key]) {
        // @ts-ignore: dynamic key access
        result[key] = this.deepMerge(existing[key], updates[key]);
      }
    }

    await db.put("documents", result);
    return result;
  }

  // Get a single document
  static async get(id: string): Promise<Document | undefined> {
    const db = await dbPromise;
    return db.get("documents", id);
  }

  // Get all documents
  static async getAll(): Promise<Document[]> {
    const db = await dbPromise;
    return db.getAll("documents");
  }

  // Delete a document
  static async delete(id: string): Promise<void> {
    const db = await dbPromise;
    await db.delete("documents", id);
  }
}
