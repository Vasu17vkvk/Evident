import { openDB, DBSchema, IDBPDatabase } from "idb";
import type { MessageStatus } from "../../../services/ai/chatService";

// ---------------------------------------------------------------------------
// Persisted message shape  (superset of the UI Message type)
// ---------------------------------------------------------------------------

export interface PersistedCitation {
  page: number;
  excerpt: string;
  confidence: number;
}

export interface PersistedMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: PersistedCitation[];
  timestamp: number; // Unix ms
  /**
   * Messages interrupted mid-stream (status === "streaming") are stored as
   * "error" on load so stale cursors never appear after a reload.
   */
  status: MessageStatus;
}


interface PersistedChatSession {
  documentId: string;            // primary key
  messages: PersistedMessage[];
  updatedAt: number;             // Unix ms
}

// ---------------------------------------------------------------------------
// DB schema  (version 2 — adds the chatHistory store alongside documents)
// ---------------------------------------------------------------------------

interface EvidentDBv2 extends DBSchema {
  documents: {
    key: string;
    value: any;
  };
  chatHistory: {
    key: string;                 // documentId
    value: PersistedChatSession;
  };
}

// Reuse / upgrade the same DB that DocumentService already uses so we stay
// within one IndexedDB origin.
let dbPromise: Promise<IDBPDatabase<EvidentDBv2>> | null = null;

function getDb(): Promise<IDBPDatabase<EvidentDBv2>> {
  if (!dbPromise) {
    dbPromise = openDB<EvidentDBv2>("EvidentDocumentDB", 2, {
      upgrade(db, oldVersion) {
        // Preserve documents store from v1
        if (!db.objectStoreNames.contains("documents")) {
          db.createObjectStore("documents", { keyPath: "id" });
        }
        // Add chatHistory store in v2
        if (oldVersion < 2 && !db.objectStoreNames.contains("chatHistory")) {
          db.createObjectStore("chatHistory", { keyPath: "documentId" });
        }
      },
    });
  }
  return dbPromise;
}

// ---------------------------------------------------------------------------
// Public service
// ---------------------------------------------------------------------------

export const ChatHistoryService = {
  /**
   * Load persisted messages for a document.
   * Returns an empty array if nothing is stored yet.
   */
  async load(documentId: string): Promise<PersistedMessage[]> {
    try {
      const db = await getDb();
      const session = await db.get("chatHistory", documentId);
      const messages = session?.messages ?? [];
      // Normalise any messages that were mid-stream when the page closed
      return messages.map((m) =>
        m.status === "streaming" ? { ...m, status: "error" as MessageStatus } : m
      );
    } catch (err) {
      console.warn("[EVIDENT] ChatHistoryService.load failed:", err);
      return [];
    }
  },


  /**
   * Persist the full message list for a document (overwrites previous).
   */
  async save(documentId: string, messages: PersistedMessage[]): Promise<void> {
    try {
      const db = await getDb();
      const session: PersistedChatSession = {
        documentId,
        messages,
        updatedAt: Date.now(),
      };
      await db.put("chatHistory", session);
    } catch (err) {
      console.warn("[EVIDENT] ChatHistoryService.save failed:", err);
    }
  },

  /**
   * Delete chat history for a specific document.
   * Called when a new document replaces the current one.
   */
  async clear(documentId: string): Promise<void> {
    try {
      const db = await getDb();
      await db.delete("chatHistory", documentId);
    } catch (err) {
      console.warn("[EVIDENT] ChatHistoryService.clear failed:", err);
    }
  },
};
