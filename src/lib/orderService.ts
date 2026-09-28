/**
 * orderService.ts
 * Firestore operations for the `orders` collection.
 *
 * NOTE: Order creation currently runs from the client using the modular SDK.
 * The original architecture plan calls for moving this to a server-side
 * Route Handler with the Firebase Admin SDK, which would let us lock
 * Firestore rules down further (no client write access needed at all).
 * The pragmatic client-side approach is used here to ship guest checkout
 * quickly — revisit before going to production at scale.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp,
  Timestamp,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toOrder(id: string, data: DocumentData): Order {
  return { id, ...data } as Order;
}

// ---------------------------------------------------------------------------
// Order number generator
// ---------------------------------------------------------------------------

const COUNTER_DOC = "counters/orders";

/**
 * Atomically increments a counter document and returns a formatted order
 * number like "FLM-00001". Creates the counter with { current: 0 } if it
 * doesn't exist yet — safe to call on a fresh Firestore database.
 */
export async function generateOrderNumber(): Promise<string> {
  const counterRef = doc(db, COUNTER_DOC);

  const newCount = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const current: number = snap.exists()
      ? (snap.data().current as number)
      : 0;
    const next = current + 1;
    if (snap.exists()) {
      tx.update(counterRef, { current: next });
    } else {
      tx.set(counterRef, { current: next });
    }
    return next;
  });

  return `FLM-${String(newCount).padStart(5, "0")}`;
}

// ---------------------------------------------------------------------------
// Create order
// ---------------------------------------------------------------------------

/**
 * Creates a new order document in Firestore.
 *
 * Inside a single transaction it:
 *  1. Re-reads each product to get live stockQty and validates stock.
 *  2. If `couponCode` is provided, re-fetches the coupon fresh inside the
 *     transaction and re-validates it (active, not expired, under limit,
 *     minOrderValue met). Throws a clear error if it fails so the user
 *     can remove the coupon and retry without losing their form data.
 *  3. Decrements stockQty for each eligible product.
 *  4. Increments the coupon's usedCount (if a coupon was applied).
 *  5. Writes the order document with the final computed discount/total.
 *
 * Returns the full Order including its generated orderNumber and Firestore id.
 */
export async function createOrder(
  data: Omit<Order, "id" | "orderNumber" | "createdAt"> & { couponCode?: string }
): Promise<Order> {
  const orderNumber = await generateOrderNumber();

  const productsCol = collection(db, "products");
  const couponsCol  = collection(db, "coupons");
  const ordersCol   = collection(db, "orders");

  const productRefs = data.items.map((item) =>
    doc(productsCol, item.productId)
  );

  let createdId: string;

  await runTransaction(db, async (tx) => {
    // ---- 1. Read products ----
    const productSnaps = await Promise.all(productRefs.map((ref) => tx.get(ref)));

    type ProductData = {
      allowBackorder: boolean;
      isMadeToOrder: boolean;
      stockQty: number;
    };
    const productDataList: ProductData[] = [];

    for (let i = 0; i < data.items.length; i++) {
      const item: OrderItem = data.items[i];
      const snap = productSnaps[i];

      if (!snap.exists()) {
        throw new Error(
          `Product "${item.title}" (${item.productId}) no longer exists.`
        );
      }

      const raw = snap.data();
      const productData: ProductData = {
        allowBackorder: raw.allowBackorder as boolean,
        isMadeToOrder:  raw.isMadeToOrder  as boolean,
        stockQty:       raw.stockQty       as number,
      };
      productDataList.push(productData);

      if (!productData.allowBackorder && !productData.isMadeToOrder) {
        if (productData.stockQty < item.qty) {
          throw new Error(
            `"${item.title}" has only ${productData.stockQty} unit${productData.stockQty !== 1 ? "s" : ""} left — ` +
              `you requested ${item.qty}. Please update your cart.`
          );
        }
      }
    }

    // ---- 2. Re-validate coupon inside the transaction ----
    let finalDiscount    = data.discount ?? 0;
    let finalDeliveryFee = data.deliveryFee;
    let couponRef: ReturnType<typeof doc> | null = null;
    let couponUsedCount  = 0;

    const couponCode = data.couponCode?.toUpperCase().trim();
    if (couponCode) {
      const couponQuery = query(couponsCol, where("code", "==", couponCode));
      const couponSnap  = await getDocs(couponQuery);

      // Prefix the error so the Checkout page can detect it and clear the coupon
      const COUPON_ERROR_PREFIX = "COUPON_INVALID:";

      if (couponSnap.empty) {
        throw new Error(`${COUPON_ERROR_PREFIX} Coupon "${couponCode}" no longer exists.`);
      }

      const couponDoc  = couponSnap.docs[0];
      const couponData = couponDoc.data();
      const now        = Timestamp.now();

      if (!couponData.active) {
        throw new Error(`${COUPON_ERROR_PREFIX} Coupon "${couponCode}" is no longer active.`);
      }
      if ((couponData.validTo as Timestamp).toMillis() < now.toMillis()) {
        throw new Error(`${COUPON_ERROR_PREFIX} Coupon "${couponCode}" has expired.`);
      }
      const usedCount   = couponData.usedCount as number;
      const usageLimit  = couponData.usageLimit as number | undefined;
      if (usageLimit !== undefined && usedCount >= usageLimit) {
        throw new Error(`${COUPON_ERROR_PREFIX} Coupon "${couponCode}" has reached its usage limit.`);
      }
      const minOrderValue = couponData.minOrderValue as number | undefined;
      if (minOrderValue !== undefined && data.subtotal < minOrderValue) {
        throw new Error(
          `${COUPON_ERROR_PREFIX} Coupon "${couponCode}" requires a minimum order of Rs. ${minOrderValue.toLocaleString("en-LK")}.`
        );
      }

      // Compute discount
      const couponType  = couponData.type as string;
      const couponValue = couponData.value as number;
      if (couponType === "percentage") {
        finalDiscount = Math.min(data.subtotal, (data.subtotal * couponValue) / 100);
      } else {
        finalDiscount = Math.min(data.subtotal, couponValue);
      }

      // Apply free delivery if the coupon grants it
      if (couponData.freeDelivery) {
        finalDeliveryFee = 0;
      }

      couponRef       = couponDoc.ref;
      couponUsedCount = usedCount;
    }

    // ---- 3. Decrement stock ----
    for (let i = 0; i < data.items.length; i++) {
      const item        = data.items[i];
      const productData = productDataList[i];
      if (!productData.allowBackorder && !productData.isMadeToOrder) {
        tx.update(productRefs[i], {
          stockQty:  productData.stockQty - item.qty,
          updatedAt: serverTimestamp(),
        });
      }
    }

    // ---- 4. Increment coupon usedCount ----
    if (couponRef) {
      tx.update(couponRef, { usedCount: couponUsedCount + 1 });
    }

    // ---- 5. Write order ----
    const finalTotal = data.subtotal + finalDeliveryFee - finalDiscount;

    const orderRef = doc(ordersCol);
    createdId = orderRef.id;

    // Deep-strip undefined values before writing to Firestore.
    // Firestore rejects any field (including nested) set to undefined.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function deepStripUndefined(obj: any): any {
      if (Array.isArray(obj)) return obj.map(deepStripUndefined);
      if (obj !== null && typeof obj === "object" && !(obj.constructor?.name === "Timestamp")) {
        return Object.fromEntries(
          Object.entries(obj)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, deepStripUndefined(v)])
        );
      }
      return obj;
    }

    const cleanData = deepStripUndefined(data);

    tx.set(orderRef, {
      ...cleanData,
      discount:     finalDiscount,
      deliveryFee:  finalDeliveryFee,
      total:        finalTotal,
      orderNumber,
      orderStatus:  "pending",
      paymentMethod:"cod",
      createdAt:    serverTimestamp(),
      ...(couponCode ? { couponCode } : {}),
    });
  });

  const orderSnap = await getDoc(doc(ordersCol, createdId!));
  return { id: createdId!, ...orderSnap.data()! } as Order;
}

// ---------------------------------------------------------------------------
// Read order
// ---------------------------------------------------------------------------

/**
 * Looks up a single order by its human-readable order number.
 * Returns null if not found — callers should call notFound() on null.
 */
export async function getOrderByNumber(
  orderNumber: string
): Promise<Order | null> {
  const q = query(
    collection(db, "orders"),
    where("orderNumber", "==", orderNumber)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return toOrder(docSnap.id, docSnap.data());
}

/**
 * Returns all orders, newest first. Used by the admin dashboard.
 */
export async function getOrders(): Promise<Order[]> {
  const q = query(
    collection(db, "orders"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toOrder(d.id, d.data()));
}

/**
 * Fetches a single order by its Firestore document id.
 * Returns null if not found.
 */
export async function getOrderById(id: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, "orders", id));
  if (!snap.exists()) return null;
  return toOrder(snap.id, snap.data());
}

/**
 * Updates an order's status (and optionally courier info / notes).
 *
 * Stock-restore behaviour:
 *   When newStatus is "cancelled" or "failed_delivery", this function runs a
 *   Firestore transaction that increments each product's stockQty back up by
 *   the ordered qty — effectively reversing the decrement done at checkout.
 *   If a product document has since been deleted, it is silently skipped so
 *   that a missing product never blocks a status update.
 *
 * All other status transitions simply update the order document; no stock
 * changes are made.
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  options?: { courier?: { name: string; trackingNo: string }; notes?: string }
): Promise<void> {
  const orderRef = doc(db, "orders", orderId);
  const restoreStock = newStatus === "cancelled" || newStatus === "failed_delivery";

  if (restoreStock) {
    // Run everything inside a transaction so stock and status update atomically
    await runTransaction(db, async (tx) => {
      const orderSnap = await tx.get(orderRef);
      if (!orderSnap.exists()) throw new Error(`Order ${orderId} not found.`);

      const order = orderSnap.data() as Omit<Order, "id">;
      const items = order.items as OrderItem[];

      // Read all product docs inside the transaction
      const productRefs = items.map((item) => doc(db, "products", item.productId));
      const productSnaps = await Promise.all(productRefs.map((ref) => tx.get(ref)));

      // Restore stock for each item whose product still exists
      for (let i = 0; i < items.length; i++) {
        const snap = productSnaps[i];
        if (!snap.exists()) continue; // product deleted — skip silently
        const currentQty = snap.data().stockQty as number;
        tx.update(productRefs[i], {
          stockQty: currentQty + items[i].qty,
          updatedAt: serverTimestamp(),
        });
      }

      // Update the order
      const orderUpdate: Record<string, unknown> = { orderStatus: newStatus };
      if (options?.courier) orderUpdate.courier = options.courier;
      if (options?.notes !== undefined) orderUpdate.notes = options.notes;
      tx.update(orderRef, orderUpdate);
    });
  } else {
    // Simple update — no stock changes needed
    const update: Record<string, unknown> = { orderStatus: newStatus };
    if (options?.courier) update.courier = options.courier;
    if (options?.notes !== undefined) update.notes = options.notes;
    await updateDoc(orderRef, update);
  }
}
