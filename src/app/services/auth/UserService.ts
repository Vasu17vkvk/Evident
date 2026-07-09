/**
 * UserService
 *
 * Manages Firestore CRUD operations against the users/{uid} collection.
 * All methods are strongly typed against the FirestoreUser schema.
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  type FirestoreUser,
  type AppUser,
  type UserPlan,
  DEFAULT_USER_DOCUMENT,
} from "../../types/user";

const USERS_COLLECTION = "users";

// ── Conversion Helpers ──────────────────────────────────────────────────────

function toAppUser(data: FirestoreUser): AppUser {
  return {
    ...data,
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate()
      : new Date(data.createdAt as any),
  };
}

// ── UserService ─────────────────────────────────────────────────────────────

export class UserService {
  /**
   * Fetches a user document from Firestore by UID.
   * Returns null if no document exists yet.
   */
  static async getUser(uid: string): Promise<AppUser | null> {
    try {
      const ref = doc(db, USERS_COLLECTION, uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      return toAppUser(snap.data() as FirestoreUser);
    } catch (error) {
      console.error("[UserService] getUser error:", error);
      throw error;
    }
  }

  /**
   * Creates a new user document in Firestore at users/{uid}.
   * Safe to call multiple times — uses setDoc with merge:true to avoid
   * overwriting existing fields on re-login.
   */
  static async createUser(params: {
    uid: string;
    email: string | null;
    displayName: string;
    photoURL: string | null;
  }): Promise<void> {
    try {
      const ref = doc(db, USERS_COLLECTION, params.uid);
      const existing = await getDoc(ref);

      if (existing.exists()) {
        // Only update mutable profile fields on re-login
        await updateDoc(ref, {
          email: params.email,
          displayName: params.displayName,
          photoURL: params.photoURL,
        });
        return;
      }

      // New document with default values
      const newUser: Omit<FirestoreUser, "createdAt"> & { createdAt: any } = {
        uid: params.uid,
        email: params.email,
        displayName: params.displayName,
        photoURL: params.photoURL,
        createdAt: serverTimestamp(),
        ...DEFAULT_USER_DOCUMENT,
      };

      await setDoc(ref, newUser);
      console.info(`[UserService] Created user document for ${params.uid}`);
    } catch (error) {
      console.error("[UserService] createUser error:", error);
      throw error;
    }
  }

  /**
   * Updates mutable profile fields on the user document.
   */
  static async updateProfile(uid: string, updates: {
    displayName?: string;
    photoURL?: string | null;
    plan?: UserPlan;
  }): Promise<void> {
    try {
      const ref = doc(db, USERS_COLLECTION, uid);
      await updateDoc(ref, updates);
    } catch (error) {
      console.error("[UserService] updateProfile error:", error);
      throw error;
    }
  }

  /**
   * Atomically increments the documentCount counter.
   */
  static async incrementDocumentCount(uid: string, by = 1): Promise<void> {
    try {
      const ref = doc(db, USERS_COLLECTION, uid);
      await updateDoc(ref, { documentCount: increment(by) });
    } catch (error) {
      console.error("[UserService] incrementDocumentCount error:", error);
      throw error;
    }
  }

  /**
   * Atomically increments the exportCount counter.
   */
  static async incrementExportCount(uid: string, by = 1): Promise<void> {
    try {
      const ref = doc(db, USERS_COLLECTION, uid);
      await updateDoc(ref, { exportCount: increment(by) });
    } catch (error) {
      console.error("[UserService] incrementExportCount error:", error);
      throw error;
    }
  }

  /**
   * Permanently deletes the user document from Firestore.
   * Use with caution — no soft delete.
   */
  static async deleteUser(uid: string): Promise<void> {
    try {
      const ref = doc(db, USERS_COLLECTION, uid);
      await deleteDoc(ref);
      console.info(`[UserService] Deleted user document for ${uid}`);
    } catch (error) {
      console.error("[UserService] deleteUser error:", error);
      throw error;
    }
  }
}
