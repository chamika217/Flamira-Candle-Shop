/**
 * productService.ts
 * All Firestore operations for the `products` collection.
 * Uses the Firebase modular SDK (v9+) throughout.
 */

import {
  collection,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  serverTimestamp,
  QueryConstraint,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product } from "@/lib/types";

const COLLECTION = "products";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Casts a raw Firestore document snapshot to our Product interface. */
function toProduct(id: string, data: DocumentData): Product {
  return { id, ...data } as Product;
}

/**
 * Recursively removes undefined values from an object before writing to
 * Firestore. Firestore rejects any field — including nested — set to undefined.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stripUndef(obj: any): any {
  if (Array.isArray(obj)) return obj.map(stripUndef);
  if (obj !== null && typeof obj === "object" && typeof obj.toMillis !== "function") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndef(v)])
    );
  }
  return obj;
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export interface ProductFilters {
  categoryId?: string;
  status?: string;
  featured?: boolean;
}

/**
 * Returns products ordered newest-first.
 * Defaults to status='active' unless a different status is provided via filters.
 * Optionally filters by categoryId and/or isFeatured.
 */
export async function getProducts(
  filters: ProductFilters = {}
): Promise<Product[]> {
  const constraints: QueryConstraint[] = [];

  const status = filters.status ?? "active";
  constraints.push(where("status", "==", status));

  if (filters.categoryId) {
    constraints.push(where("categoryId", "==", filters.categoryId));
  }

  if (filters.featured !== undefined) {
    constraints.push(where("isFeatured", "==", filters.featured));
  }

  // No orderBy here — combining where() + orderBy() requires a composite
  // Firestore index. Sort newest-first client-side instead.
  const q = query(collection(db, COLLECTION), ...constraints);
  const snapshot = await getDocs(q);

  const products = snapshot.docs.map((docSnap) => toProduct(docSnap.id, docSnap.data()));

  // Sort newest-first client-side
  return products.sort((a, b) => {
    const at = a.createdAt?.toMillis?.() ?? 0;
    const bt = b.createdAt?.toMillis?.() ?? 0;
    return bt - at;
  });
}

/**
 * Fetches a single product by its URL slug.
 * Returns null if no matching product is found.
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const q = query(collection(db, COLLECTION), where("slug", "==", slug));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const docSnap = snapshot.docs[0];
  return toProduct(docSnap.id, docSnap.data());
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

/**
 * Adds a new product document to Firestore.
 * `createdAt` and `updatedAt` are set to the server timestamp automatically.
 * Returns the newly created document's ID.
 */
export async function createProduct(
  data: Omit<Product, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...stripUndef(data),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Partially updates an existing product document.
 * Always bumps `updatedAt` to the server timestamp.
 */
export async function updateProduct(
  id: string,
  data: Partial<Omit<Product, "id" | "createdAt">>
): Promise<void> {
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    ...stripUndef(data),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Permanently deletes a product document by ID.
 * Consider archiving (status = 'archived') instead to preserve order history.
 */
export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

/**
 * Atomically decrements a product's `stockQty` by `qty` inside a transaction.
 *
 * Rules:
 * - If the product does not exist, throws an error.
 * - If the resulting stock would be negative AND `allowBackorder` is false,
 *   throws an error — the transaction is rolled back automatically.
 * - If `allowBackorder` is true, stock is allowed to go negative (backorder).
 */
export async function decrementStock(
  productId: string,
  qty: number
): Promise<void> {
  const docRef = doc(db, COLLECTION, productId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(docRef);

    if (!snapshot.exists()) {
      throw new Error(`Product not found: ${productId}`);
    }

    const product = snapshot.data() as Omit<Product, "id">;
    const newStock = product.stockQty - qty;

    if (newStock < 0 && !product.allowBackorder) {
      throw new Error(
        `Insufficient stock for product "${product.title}". ` +
          `Requested: ${qty}, available: ${product.stockQty}.`
      );
    }

    transaction.update(docRef, {
      stockQty: newStock,
      updatedAt: serverTimestamp(),
    });
  });
}

/**
 * Returns ALL products regardless of status, newest first.
 * Admin-only — never call this from storefront code.
 */
export async function getAllProductsAdmin(): Promise<Product[]> {
  const q = query(
    collection(db, COLLECTION),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => toProduct(docSnap.id, docSnap.data()));
}

/**
 * Fetches a single product by its Firestore document id.
 * Returns null if not found.
 */
export async function getProductById(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return toProduct(snap.id, snap.data());
}

// ---------------------------------------------------------------------------
// Stock adjustment (manual / admin)
// ---------------------------------------------------------------------------

/**
 * Manually sets a product's `stockQty` to `newStockQty` and appends an entry
 * to the `products/{productId}/stockHistory` subcollection recording the
 * change, the reason, and a timestamp.
 *
 * This function runs inside a Firestore transaction so the read of the
 * previous qty and the subsequent writes are atomic.
 *
 * TODO (future pass): order-driven stock changes (decrementStock, and the
 * stock-restore path in updateOrderStatus) should also write stockHistory
 * entries so the full audit trail is complete. Those functions are not
 * modified here to avoid scope creep.
 */
export async function adjustStock(
  productId: string,
  newStockQty: number,
  reason: string
): Promise<void> {
  const productRef  = doc(db, "products", productId);
  const historyCol  = collection(db, "products", productId, "stockHistory");

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(productRef);
    if (!snap.exists()) throw new Error(`Product ${productId} not found.`);

    const previousQty = snap.data().stockQty as number;
    const change      = newStockQty - previousQty;

    // Update the product's stock
    tx.update(productRef, {
      stockQty:  newStockQty,
      updatedAt: serverTimestamp(),
    });

    // Append a history entry (addDoc inside a transaction requires a pre-built ref)
    const historyRef = doc(historyCol);
    tx.set(historyRef, {
      previousQty,
      newQty:    newStockQty,
      change,
      reason:    reason.trim(),
      source:    "manual",
      timestamp: serverTimestamp(),
    });
  });
}
