import { Timestamp } from "firebase/firestore";

/**
 * Supported subscription plans.
 */
export type UserPlan = "free" | "pro" | "enterprise";

/**
 * Firestore document schema for users/{uid}
 *
 * Maps directly to the Firestore document structure.
 * All timestamp fields are stored as Firestore Timestamps for
 * accurate server-side ordering and TTL rules.
 */
export interface FirestoreUser {
  uid: string;
  email: string | null;
  displayName: string;
  photoURL: string | null;
  createdAt: Timestamp;
  plan: UserPlan;
  documentCount: number;
  exportCount: number;
}

/**
 * Plain JS version of FirestoreUser with Date instead of Timestamp,
 * used inside the application layer.
 */
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string;
  photoURL: string | null;
  createdAt: Date;
  plan: UserPlan;
  documentCount: number;
  exportCount: number;
}

/**
 * Default values for a new user document.
 */
export const DEFAULT_USER_PLAN: UserPlan = "free";
export const DEFAULT_USER_DOCUMENT: Omit<FirestoreUser, "uid" | "email" | "displayName" | "photoURL" | "createdAt"> = {
  plan: DEFAULT_USER_PLAN,
  documentCount: 0,
  exportCount: 0,
};
