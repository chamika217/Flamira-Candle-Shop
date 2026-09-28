/**
 * adminAuthService.ts
 * Firebase Auth + Firestore helpers for the admin panel.
 */

import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { AdminUser } from "@/lib/types";

/**
 * Signs in with email + password.
 * Throws a Firebase AuthError on failure (caller handles message).
 */
export async function loginAdmin(
  email: string,
  password: string
): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

/** Signs out the current user. */
export async function logoutAdmin(): Promise<void> {
  await signOut(auth);
}

/**
 * Fetches the `admins/{uid}` Firestore document.
 * Returns null if the document doesn't exist (user is not an admin).
 */
export async function getAdminProfile(uid: string): Promise<AdminUser | null> {
  const snap = await getDoc(doc(db, "admins", uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() } as AdminUser;
}
