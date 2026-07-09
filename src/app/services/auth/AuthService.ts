import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "./firebase";
import { UserService } from "./UserService";

export interface EvidentUser {
  uid: string;
  email: string | null;
  name: string;
  initials: string;
  photoURL: string | null;
}

export class AuthService {
  private static getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return parts
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join("");
  }

  private static deriveUserFromFirebaseUser(user: FirebaseUser): EvidentUser {
    const email = user.email;
    const name = user.displayName || (email ? email.split("@")[0].replace(/[._-]/g, " ") : "User");
    const initials = this.getInitials(name);
    return {
      uid: user.uid,
      email,
      name,
      initials,
      photoURL: user.photoURL,
    };
  }

  /**
   * Syncs (creates or updates) the Firestore user document.
   * Silently catches errors so auth flow is never blocked by Firestore.
   */
  private static async syncUserDocument(user: FirebaseUser): Promise<void> {
    try {
      const name = user.displayName || (user.email ? user.email.split("@")[0].replace(/[._-]/g, " ") : "User");
      await UserService.createUser({
        uid: user.uid,
        email: user.email,
        displayName: name,
        photoURL: user.photoURL,
      });
    } catch (err) {
      console.warn("[AuthService] Failed to sync Firestore user document:", err);
    }
  }

  /**
   * Triggers Google Sign In popup.
   */
  static async signInWithGoogle(): Promise<EvidentUser> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await this.syncUserDocument(result.user);
      return this.deriveUserFromFirebaseUser(result.user);
    } catch (error: any) {
      console.error("Firebase Sign In with Google error:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Authenticates with Email & Password.
   */
  static async signInWithEmail(email: string, password: string): Promise<EvidentUser> {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await this.syncUserDocument(result.user);
      return this.deriveUserFromFirebaseUser(result.user);
    } catch (error: any) {
      console.error("Firebase Sign In with Email error:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Registers a new account with Email & Password.
   */
  static async signUpWithEmail(email: string, password: string): Promise<EvidentUser> {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await this.syncUserDocument(result.user);
      return this.deriveUserFromFirebaseUser(result.user);
    } catch (error: any) {
      console.error("Firebase Sign Up error:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Terminate active authentication session.
   */
  static async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      console.error("Firebase Sign Out error:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Synchronously fetch the currently logged in user if available.
   */
  static getCurrentUser(): EvidentUser | null {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    return this.deriveUserFromFirebaseUser(currentUser);
  }

  /**
   * Listen for real-time authentication session state mutations.
   */
  static onAuthStateChanged(callback: (user: EvidentUser | null) => void): () => void {
    return firebaseOnAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        callback(this.deriveUserFromFirebaseUser(firebaseUser));
      } else {
        callback(null);
      }
    });
  }

  /**
   * Maps obscure Firebase error codes to user-friendly messages.
   */
  private static handleError(error: any): Error {
    const code = error.code;
    let message = error.message || "An authentication error occurred. Please try again.";

    switch (code) {
      case "auth/invalid-email":
        message = "The email address format is invalid.";
        break;
      case "auth/user-disabled":
        message = "This user account has been disabled.";
        break;
      case "auth/user-not-found":
      case "auth/invalid-credential":
        message = "Invalid credentials. Please verify your details.";
        break;
      case "auth/wrong-password":
        message = "Incorrect password. Please verify and try again.";
        break;
      case "auth/email-already-in-use":
        message = "An account already exists with this email address.";
        break;
      case "auth/weak-password":
        message = "The password is too weak. Please choose a password with 6 or more characters.";
        break;
      case "auth/popup-closed-by-user":
        message = "Google authorization popup was closed before completion.";
        break;
    }

    return new Error(message);
  }
}
