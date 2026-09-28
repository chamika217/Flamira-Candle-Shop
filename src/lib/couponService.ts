/**
 * couponService.ts
 * Firestore CRUD for the `coupons` collection.
 *
 * Codes are stored and compared in UPPERCASE for case-insensitive lookup.
 */

import {
  collection,
  doc,
  query,
  orderBy,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Coupon } from "@/lib/types";

const COLLECTION = "coupons";

function toCoupon(id: string, data: DocumentData): Coupon {
  return { id, ...data } as Coupon;
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/** Returns all coupons, newest first (by validFrom). */
export async function getCoupons(): Promise<Coupon[]> {
  const q = query(collection(db, COLLECTION), orderBy("validFrom", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toCoupon(d.id, d.data()));
}

/**
 * Looks up a coupon by code (case-insensitive).
 * Returns null when the coupon:
 *  - doesn't exist
 *  - is inactive
 *  - has expired (validTo < now)
 *  - has hit its usage limit
 *
 * Not wired into checkout yet — reserved for a future pass.
 */
export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const upper = code.toUpperCase().trim();
  const q = query(collection(db, COLLECTION), where("code", "==", upper));
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const coupon = toCoupon(snap.docs[0].id, snap.docs[0].data());
  const now = Timestamp.now();

  if (!coupon.active)                                              return null;
  if (coupon.validTo.toMillis() < now.toMillis())                 return null;
  if (coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit) return null;

  return coupon;
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

/**
 * Creates a new coupon. `code` is automatically uppercased.
 * Returns the new document's id.
 */
export async function createCoupon(
  data: Omit<Coupon, "id" | "usedCount">
): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    code:      data.code.toUpperCase().trim(),
    usedCount: 0,
  });
  return ref.id;
}

/** Partially updates a coupon document. */
export async function updateCoupon(
  id: string,
  data: Partial<Omit<Coupon, "id">>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    ...data,
    ...(data.code ? { code: data.code.toUpperCase().trim() } : {}),
  });
}

/** Permanently deletes a coupon. */
export async function deleteCoupon(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
