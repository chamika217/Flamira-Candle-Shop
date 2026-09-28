/**
 * reviewService.ts
 * Firestore operations for the `reviews` collection.
 *
 * Review submission is order-verified in application code:
 *  - The order must exist and have status 'delivered' or 'completed'.
 *  - The product being reviewed must appear in that order's items.
 *  - Only one review per (orderNumber, productId) pair is allowed.
 *
 * Moderation (approve/reject, reply, feature) is performed by authenticated
 * admin users. Until a server-side Route Handler with Firebase Admin SDK is
 * in place, these writes rely on Firestore rules + admin auth UI checks.
 */

import {
  collection,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getOrderByNumber } from "@/lib/orderService";
import type { Review } from "@/lib/types";

const COLLECTION = "reviews";

function toReview(id: string, data: DocumentData): Review {
  return { id, ...data } as Review;
}

// ---------------------------------------------------------------------------
// Submit (storefront — order-verified)
// ---------------------------------------------------------------------------

/**
 * Submits a new review.
 * Validates:
 *  1. The order exists and its status is 'delivered' or 'completed'.
 *  2. The given productId appears in that order's items.
 *  3. No review already exists for this (orderNumber, productId) pair.
 * Creates the review with `approved: false` and `featured: false`.
 */
export async function submitReview(
  data: Omit<Review, "id" | "approved" | "featured" | "createdAt">
): Promise<void> {
  // 1. Verify order status
  const order = await getOrderByNumber(data.orderNumber);
  if (!order) {
    throw new Error("Order not found. Please check your order number.");
  }
  if (order.orderStatus !== "delivered" && order.orderStatus !== "completed") {
    throw new Error(
      "You can only review products from a delivered order. Your order has not been delivered yet."
    );
  }

  // 2. Verify product is in the order
  const hasProduct = order.items.some((item) => item.productId === data.productId);
  if (!hasProduct) {
    throw new Error(
      "You can only review products from a delivered order. This product was not part of your order."
    );
  }

  // 3. Check for duplicate review
  const dupQuery = query(
    collection(db, COLLECTION),
    where("orderNumber", "==", data.orderNumber),
    where("productId",   "==", data.productId)
  );
  const dupSnap = await getDocs(dupQuery);
  if (!dupSnap.empty) {
    throw new Error("You have already submitted a review for this product.");
  }

  // 4. Create review
  await addDoc(collection(db, COLLECTION), {
    ...data,
    approved:  false,
    featured:  false,
    createdAt: serverTimestamp(),
  });
}

// ---------------------------------------------------------------------------
// Read — storefront
// ---------------------------------------------------------------------------

/** Returns only approved reviews for a product, newest first. */
export async function getApprovedReviews(productId: string): Promise<Review[]> {
  const q = query(
    collection(db, COLLECTION),
    where("productId", "==", productId),
    where("approved",  "==", true),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toReview(d.id, d.data()));
}

// ---------------------------------------------------------------------------
// Read — admin
// ---------------------------------------------------------------------------

/** Returns ALL reviews (pending + approved), newest first. */
export async function getAllReviewsAdmin(): Promise<Review[]> {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toReview(d.id, d.data()));
}

// ---------------------------------------------------------------------------
// Moderation — admin
// ---------------------------------------------------------------------------

/** Approves or rejects a review. */
export async function moderateReview(id: string, approved: boolean): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { approved });
}

/** Saves an owner reply. Pass an empty string to clear it. */
export async function replyToReview(id: string, reply: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { reply: reply.trim() || null });
}

/** Toggles a review's featured status. Only approved reviews should be featured. */
export async function toggleFeatured(id: string, featured: boolean): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { featured });
}

/** Permanently deletes a review. */
export async function deleteReview(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
