/**
 * MigrationService
 *
 * Orchestrates the migration of anonymous local documents to an authenticated
 * user's account when they log in for the first time.
 */

import { AnonymousSessionService, AnonymousDocumentEntry } from "./AnonymousSessionService";

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  skippedCount: number;
  errors: string[];
}

export class MigrationService {
  /**
   * Returns the list of documents waiting to be migrated.
   */
  static getPendingDocuments(): AnonymousDocumentEntry[] {
    return AnonymousSessionService.getMigrationQueue();
  }

  /**
   * Returns true if there are documents pending migration.
   */
  static hasPendingMigration(): boolean {
    return AnonymousSessionService.hasPendingMigration();
  }

  /**
   * Performs the migration of locally queued documents to the authenticated
   * user's cloud account.
   *
   * Currently, this is implemented as a local-first operation that:
   * 1. Reads documents from the migration queue.
   * 2. Marks them as migrated (clears queue locally).
   * 3. Returns the migration result.
   *
   * Future enhancement: Send documents to the backend API / Firebase Firestore.
   */
  static async migrate(userId: string): Promise<MigrationResult> {
    const queue = AnonymousSessionService.getMigrationQueue();
    const errors: string[] = [];
    let migratedCount = 0;
    let skippedCount = 0;

    for (const doc of queue) {
      try {
        // Future: await CloudDocumentService.upload(userId, doc);
        console.info(`[MigrationService] Migrating "${doc.name}" (${doc.id}) for user ${userId}`);
        AnonymousSessionService.dequeueDocument(doc.id);
        migratedCount++;
      } catch (err: any) {
        console.error(`[MigrationService] Failed to migrate "${doc.name}":`, err);
        errors.push(`${doc.name}: ${err.message ?? "Unknown error"}`);
        skippedCount++;
      }
    }

    // Clear anonymous session ID after successful migration
    if (migratedCount > 0 && errors.length === 0) {
      AnonymousSessionService.clearSessionId();
    }

    return {
      success: errors.length === 0,
      migratedCount,
      skippedCount,
      errors,
    };
  }

  /**
   * Discards all locally queued documents without migrating.
   */
  static dismissMigration(): void {
    AnonymousSessionService.clearMigrationQueue();
    AnonymousSessionService.clearSessionId();
  }
}
