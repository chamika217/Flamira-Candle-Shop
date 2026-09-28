/**
 * categoryService.ts
 * Firestore read/write operations for the `categories` collection.
 */

import {
  collection,
  doc,
  query,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Category } from "@/lib/types";

const COLLECTION = "categories";

/** Casts a raw Firestore document snapshot to our Category interface. */
function toCategory(id: string, data: DocumentData): Category {
  return { id, ...data } as Category;
}

/**
 * Returns all categories ordered by `sortOrder` ascending.
 * Top-level categories have parentId === null; subcategories carry a parentId.
 */
export async function getCategories(): Promise<Category[]> {
  const q = query(collection(db, COLLECTION), orderBy("sortOrder", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => toCategory(docSnap.id, docSnap.data()));
}

/**
 * Creates a new category document. Returns the new document's id.
 */
export async function createCategory(
  data: Omit<Category, "id">
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), data);
  return docRef.id;
}

/**
 * Partially updates an existing category document.
 */
export async function updateCategory(
  id: string,
  data: Partial<Omit<Category, "id">>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), data);
}

/**
 * Permanently deletes a category document.
 * Note: products in this category are NOT deleted — callers should warn
 * the user to re-categorize affected products.
 */
export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
