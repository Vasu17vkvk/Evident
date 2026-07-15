import {
  Document,
  CreateDocumentInput,
  DocumentStatus,
} from "../../types/document";
import { openDB, DBSchema } from "idb";
import { fetchDocuments, updatePersistedDocument, deletePersistedDocument } from "../../../services/api/api";

interface EvidentDB extends DBSchema {
  documents: {
    key: string;
    value: Document;
  };
  chatHistory: {
    key: string;
    value: any;
  };
}

const dbPromise = openDB<EvidentDB>("EvidentDocumentDB", 2, {
  upgrade(db, oldVersion) {
    if (!db.objectStoreNames.contains("documents")) {
      db.createObjectStore("documents", { keyPath: "id" });
    }
    if (oldVersion < 2 && !db.objectStoreNames.contains("chatHistory")) {
      db.createObjectStore("chatHistory", { keyPath: "documentId" });
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
    window.dispatchEvent(new CustomEvent("evident-document-update"));
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
    window.dispatchEvent(new CustomEvent("evident-document-update"));
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

    // Sync to MongoDB backend if authenticated and has mongoDbId
    if (result.mongoDbId) {
      try {
        const backendUpdates: any = {};
        if (updates.status !== undefined) backendUpdates.status = updates.status;
        if (updates.pages !== undefined) backendUpdates.pages = updates.pages;
        if (updates.wordCount !== undefined) backendUpdates.wordCount = updates.wordCount;
        if (updates.pagesContent !== undefined) backendUpdates.pagesContent = updates.pagesContent;
        if (updates.favorite !== undefined) {
          backendUpdates.favorite = updates.favorite;
          try {
            const { addFavorite, deleteFavorite } = await import("../../../services/api/api");
            if (updates.favorite) {
              await addFavorite(result.mongoDbId);
            } else {
              await deleteFavorite(result.mongoDbId);
            }
          } catch (favErr) {
            console.warn("Failed to sync favorites to MongoDB favorites collection:", favErr);
          }
        }
        if (updates.lastOpenedAt !== undefined) backendUpdates.lastOpenedAt = updates.lastOpenedAt;

        if (Object.keys(backendUpdates).length > 0) {
          await updatePersistedDocument(result.mongoDbId, backendUpdates);
        }
      } catch (e) {
        console.warn("Failed to sync updates to MongoDB:", e);
      }
    }

    window.dispatchEvent(new CustomEvent("evident-document-update"));
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
    const existing = await db.get("documents", id);
    
    // Sync delete to MongoDB
    if (existing?.mongoDbId) {
      try {
        await deletePersistedDocument(existing.mongoDbId);
      } catch (e) {
        console.warn("Failed to delete document from MongoDB backend:", e);
      }
    }

    await db.delete("documents", id);
    window.dispatchEvent(new CustomEvent("evident-document-update"));
  }

  // Reconcile MongoDB documents with IndexedDB local cache
  static async sync(userId?: string): Promise<Document[]> {
    const token = localStorage.getItem("access_token");
    if (!token || !userId) {
      return this.getAll();
    }

    try {
      // 1. Fetch from backend (max 100 documents)
      const response = await fetchDocuments("", 1, 100);
      const cloudDocs = response.documents;

      // 2. Fetch all local docs from IndexedDB
      const localDocs = await this.getAll();
      const localDocMap = new Map(localDocs.map(d => [d.mongoDbId || d.id, d]));

      const db = await dbPromise;
      const cloudDocIds = new Set(cloudDocs.map(d => d.documentId));

      // 3. Reconcile
      for (const cloudDoc of cloudDocs) {
        const existing = localDocMap.get(cloudDoc.documentId);
        
        if (existing) {
          // Update details from cloud
          const updated: Document = {
            ...existing,
            name: cloudDoc.filename,
            size: cloudDoc.fileSize,
            pages: cloudDoc.pageCount,
            favorite: cloudDoc.favorite,
            lastOpenedAt: cloudDoc.lastOpenedAt,
            updatedAt: new Date(),
          };
          await db.put("documents", updated);
        } else {
          // Add new document placeholder from cloud
          const now = new Date(cloudDoc.uploadDate);
          const newDoc: Document = {
            id: cloudDoc.documentId,
            mongoDbId: cloudDoc.documentId,
            name: cloudDoc.filename,
            type: "application/pdf", // fallback
            size: cloudDoc.fileSize,
            pages: cloudDoc.pageCount,
            status: DocumentStatus.Ready,
            favorite: cloudDoc.favorite,
            lastOpenedAt: cloudDoc.lastOpenedAt,
            createdAt: now,
            updatedAt: now,
            uploadedAt: now,
          };
          await db.put("documents", newDoc);
        }
      }

      // 4. Remove local documents that were deleted from the cloud
      for (const localDoc of localDocs) {
        if (localDoc.mongoDbId && !cloudDocIds.has(localDoc.mongoDbId)) {
          await db.delete("documents", localDoc.id);
        }
      }

    } catch (e) {
      console.error("Failed to sync documents with backend:", e);
    }

    const updatedDocs = await this.getAll();
    window.dispatchEvent(new CustomEvent("evident-document-update"));
    return updatedDocs;
  }
}
