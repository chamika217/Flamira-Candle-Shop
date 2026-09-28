/**
 * customerAuthService.ts
 * Storefront customer authentication and profile management.
 *
 * Uses the primary `auth` instance (same Firebase project as admin, but
 * different user accounts — customers live in `customers/{uid}`, admins in
 * `admins/{uid}`). Because this is intentional sign-in of the current browser
 * user, we do NOT use a secondary app (unlike the admin createAdminUser flow).
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  DocumentData,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { CustomerProfile, Order } from "@/lib/types";

const CUSTOMERS = "customers";
const ORDERS    = "orders";

function toProfile(uid: string, data: DocumentData): CustomerProfile {
  return { uid, ...data } as CustomerProfile;
}

function toOrder(id: string, data: DocumentData): Order {
  return { id, ...data } as Order;
}

// ---------------------------------------------------------------------------
// Auth operations
// ---------------------------------------------------------------------------

/**
 * Creates a new Firebase Auth account and a matching `customers/{uid}` doc.
 * Because this is a customer sign-up flow (not admin creation), signing the
 * browser in as the new user is the intended behaviour.
 */
export async function signUpCustomer(
  name: string,
  email: string,
  password: string,
  phone: string
): Promise<void> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);

  // Write the Firestore profile. If this fails due to rules not yet being
  // published, the Auth account still exists and the profile will be missing
  // (the account page handles a null profile gracefully).
  try {
    await setDoc(doc(db, CUSTOMERS, user.uid), {
      uid:       user.uid,
      name:      name.trim(),
      email:     email.trim().toLowerCase(),
      phone:     phone.trim(),
      addresses: [],
      createdAt: serverTimestamp(),
    });
  } catch (firestoreErr) {
    // Log but don't rethrow — Auth account was created successfully.
    // The most common cause is Firestore rules not yet published in Firebase Console.
    // Fix: publish the updated firestore.rules (customers/{uid} read/write for owner).
    console.warn("[signUpCustomer] Firestore profile write failed:", firestoreErr);
  }
}

/** Signs the customer in with email + password. */
export async function loginCustomer(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

/** Signs the customer out. */
export async function logoutCustomer(): Promise<void> {
  await signOut(auth);
}

/** Sends a password reset email. */
export async function sendCustomerPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

/** Returns a customer's profile, or null if the document doesn't exist. */
export async function getCustomerProfile(uid: string): Promise<CustomerProfile | null> {
  const snap = await getDoc(doc(db, CUSTOMERS, uid));
  if (!snap.exists()) return null;
  return toProfile(uid, snap.data());
}

/** Partially updates the customer's profile document. */
export async function updateCustomerProfile(
  uid: string,
  data: Partial<Omit<CustomerProfile, "uid" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, CUSTOMERS, uid), data);
}

// ---------------------------------------------------------------------------
// Order history (keyed by phone, not uid — supports guest order lookup too)
// ---------------------------------------------------------------------------

/**
 * Fetches all orders where `customer.phone` matches the given phone number.
 * This works for both registered and guest orders because orders store the
 * phone at checkout rather than a uid.
 */
export async function getOrdersByCustomerPhone(phone: string): Promise<Order[]> {
  const q = query(
    collection(db, ORDERS),
    where("customer.phone", "==", phone.trim())
  );
  const snap = await getDocs(q);
  const orders = snap.docs.map((d) => toOrder(d.id, d.data()));
  // Sort newest-first client-side to avoid requiring a composite Firestore index
  return orders.sort((a, b) => {
    const at = a.createdAt?.toMillis?.() ?? 0;
    const bt = b.createdAt?.toMillis?.() ?? 0;
    return bt - at;
  });
}
