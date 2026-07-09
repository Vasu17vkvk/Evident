/**
 * AnonymousSessionService
 *
 * Manages anonymous users' local document sessions using localStorage.
 * Users can upload, search and export documents without signing in.
 * On sign-in, the migration queue is offered to link their local documents
 * to their new authenticated account.
 */

const MIGRATION_QUEUE_KEY = "evident:migration_queue";
const SESSION_ID_KEY = "evident:anonymous_session_id";

export interface AnonymousDocumentEntry {
  id: string;
  name: string;
  type: string;
  size: number;
  extension?: string;
  createdAt: string;
  sessionId: string;
}

export class AnonymousSessionService {
  /**
   * Returns the persistent anonymous session ID, generating one if needed.
   */
  static getSessionId(): string {
    let sessionId = localStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
      sessionId = `anon-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    return sessionId;
  }

  /**
   * Clears the anonymous session ID from storage.
   */
  static clearSessionId(): void {
    localStorage.removeItem(SESSION_ID_KEY);
  }

  /**
   * Reads all pending documents in the local migration queue.
   */
  static getMigrationQueue(): AnonymousDocumentEntry[] {
    try {
      const stored = localStorage.getItem(MIGRATION_QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Adds a document to the local migration queue.
   */
  static enqueueDocument(doc: Omit<AnonymousDocumentEntry, "sessionId">): void {
    const queue = this.getMigrationQueue();
    const sessionId = this.getSessionId();

    // Avoid duplicates
    const exists = queue.some((entry) => entry.id === doc.id);
    if (exists) return;

    queue.push({ ...doc, sessionId });
    localStorage.setItem(MIGRATION_QUEUE_KEY, JSON.stringify(queue));
  }

  /**
   * Removes a specific document from the migration queue.
   */
  static dequeueDocument(documentId: string): void {
    const queue = this.getMigrationQueue().filter((d) => d.id !== documentId);
    localStorage.setItem(MIGRATION_QUEUE_KEY, JSON.stringify(queue));
  }

  /**
   * Returns true if there are locally queued documents waiting for migration.
   */
  static hasPendingMigration(): boolean {
    return this.getMigrationQueue().length > 0;
  }

  /**
   * Clears the entire migration queue from local storage.
   */
  static clearMigrationQueue(): void {
    localStorage.removeItem(MIGRATION_QUEUE_KEY);
  }
}
