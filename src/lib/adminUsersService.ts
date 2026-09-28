/**
 * adminUsersService.ts
 * Manages admin user accounts — Firestore `admins` documents + Firebase Auth.
 *
 * KEY PATTERN — secondary Firebase App for user creation:
 * Calling `createUserWithEmailAndPassword` on the primary `auth` instance would
 * sign the browser in AS the newly created user, immediately kicking out the
 * currently-logged-in Owner. To prevent that, we initialise a temporary
 * secondary Firebase App ("flamira-secondary") that has its own isolated Auth
 * instance. Creating the user there has zero effect on the primary auth session.
 */

import {
  getApps,
  initializeApp,
} from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, firebaseConfig } from "@/lib/firebase";
import type { AdminUser, AdminRole } from "@/lib/types";

const COLLECTION = "admins";

// ---------------------------------------------------------------------------
// Secondary app — reused across calls, never re-created if it already exists
// ---------------------------------------------------------------------------

function getSecondaryAuth() {
  const SECONDARY_APP_NAME = "flamira-secondary";
  const existing = getApps().find((a) => a.name === SECONDARY_APP_NAME);
  const app      = existing ?? initializeApp(firebaseConfig, SECONDARY_APP_NAME);
  return getAuth(app);
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/** Fetches all admin user profiles from Firestore. */
export async function getAdminUsers(): Promise<AdminUser[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map((d) => ({ ...(d.data() as Omit<AdminUser, "id">) } as AdminUser));
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Creates a new Firebase Auth account AND an `admins/{uid}` Firestore document.
 *
 * Uses a secondary app instance so the primary Owner session is never affected.
 * Signs out of the secondary app immediately after creation so no session lingers.
 */
export async function createAdminUser(
  name: string,
  email: string,
  password: string,
  role: AdminRole
): Promise<void> {
  const secondaryAuth = getSecondaryAuth();

  // Create the Auth account on the secondary app
  const { user } = await createUserWithEmailAndPassword(
    secondaryAuth,
    email,
    password
  );

  // Sign out of the secondary app immediately — does NOT affect primary session
  await firebaseSignOut(secondaryAuth);

  // Write the Firestore admin profile using the primary db
  await setDoc(doc(db, COLLECTION, user.uid), {
    uid:       user.uid,
    name:      name.trim(),
    email:     email.trim().toLowerCase(),
    role,
    createdAt: serverTimestamp(),
  });
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

/** Updates just the `role` field of an existing admin document. */
export async function updateAdminUserRole(
  uid: string,
  role: AdminRole
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, uid), { role });
}

// ---------------------------------------------------------------------------
// Deactivate
// ---------------------------------------------------------------------------

/**
 * Revokes admin access by deleting the `admins/{uid}` Firestore document.
 * ProtectedRoute checks for this document on every page load, so the
 * deactivated user will see "Access Denied" on their next visit.
 *
 * NOTE: Their Firebase Auth account still exists and can be manually deleted
 * from the Firebase Console → Authentication → Users tab if needed.
 * Deleting the actual Auth account programmatically requires the Admin SDK
 * (server-side), which this project does not yet have.
 */
export async function deactivateAdminUser(uid: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, uid));
}
