/**
 * userManagementService.ts
 * Unified management for:
 * - Registered Customers (Firestore `customers`)
 * - Admin & Staff Accounts (Firestore `admins` + Firebase Auth)
 * - Guest Order Summaries (Firestore `orders`)
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import {
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { createAdminUser, getAdminUsers } from "@/lib/adminUsersService";
import type {
  AdminUser,
  AdminRole,
  CustomerProfile,
  AccountStatus,
  UnifiedUser,
  Order,
} from "@/lib/types";

const CUSTOMERS_COLLECTION = "customers";
const ADMINS_COLLECTION    = "admins";
const ORDERS_COLLECTION    = "orders";

// ---------------------------------------------------------------------------
// Unified User Fetching
// ---------------------------------------------------------------------------

/**
 * Fetches all users from both `customers` and `admins` collections,
 * and links order counts and lifetime spend from `orders`.
 */
export async function getAllUnifiedUsers(): Promise<UnifiedUser[]> {
  try {
    // 1. Fetch Customers, Admins, and Orders in parallel
    const [customerSnap, adminSnap, orderSnap] = await Promise.all([
      getDocs(collection(db, CUSTOMERS_COLLECTION)).catch(() => ({ docs: [] })),
      getDocs(collection(db, ADMINS_COLLECTION)).catch(() => ({ docs: [] })),
      getDocs(collection(db, ORDERS_COLLECTION)).catch(() => ({ docs: [] })),
    ]);

    // Build order aggregations by phone and email
    const phoneOrderMap = new Map<string, { count: number; spend: number; lastDate?: Timestamp }>();
    const emailOrderMap = new Map<string, { count: number; spend: number; lastDate?: Timestamp }>();

    orderSnap.docs.forEach((docSnap) => {
      const order = docSnap.data() as Order;
      const total = order.total ?? 0;
      const status = order.orderStatus;
      const isValid = status !== "cancelled" && status !== "failed_delivery";
      const createdAt = order.createdAt;

      if (order.customer?.phone) {
        const ph = order.customer.phone.trim();
        const cur = phoneOrderMap.get(ph) ?? { count: 0, spend: 0 };
        phoneOrderMap.set(ph, {
          count: cur.count + 1,
          spend: cur.spend + (isValid ? total : 0),
          lastDate: cur.lastDate && cur.lastDate.toMillis() > (createdAt?.toMillis?.() ?? 0) ? cur.lastDate : createdAt,
        });
      }

      if (order.customer?.email) {
        const em = order.customer.email.trim().toLowerCase();
        const cur = emailOrderMap.get(em) ?? { count: 0, spend: 0 };
        emailOrderMap.set(em, {
          count: cur.count + 1,
          spend: cur.spend + (isValid ? total : 0),
          lastDate: cur.lastDate && cur.lastDate.toMillis() > (createdAt?.toMillis?.() ?? 0) ? cur.lastDate : createdAt,
        });
      }
    });

    const unifiedList: UnifiedUser[] = [];
    const seenUids = new Set<string>();

    // 2. Map Admins
    adminSnap.docs.forEach((d) => {
      const data = d.data() as AdminUser;
      const uid = data.uid || d.id;
      seenUids.add(uid);

      const emailKey = data.email?.toLowerCase().trim();
      const orderStats = emailKey ? emailOrderMap.get(emailKey) : undefined;

      unifiedList.push({
        id: `admin-${uid}`,
        uid,
        name: data.name || "Admin User",
        email: data.email || "—",
        phone: data.phone,
        userType: "admin",
        role: data.role || "staff",
        status: data.status || "active",
        statusReason: data.statusReason,
        permissions: data.permissions || (data.role === "owner" ? ["all"] : ["orders", "inventory"]),
        orderCount: orderStats?.count ?? 0,
        totalSpent: orderStats?.spend ?? 0,
        createdAt: data.createdAt,
        lastActive: orderStats?.lastDate ?? data.createdAt,
      });
    });

    // 3. Map Registered Customers
    customerSnap.docs.forEach((d) => {
      const data = d.data() as CustomerProfile;
      const uid = data.uid || d.id;
      if (seenUids.has(uid)) return; // Avoid duplicate if someone is in both

      const phoneKey = data.phone?.trim();
      const emailKey = data.email?.toLowerCase().trim();
      const orderStats = (phoneKey ? phoneOrderMap.get(phoneKey) : undefined) ??
                         (emailKey ? emailOrderMap.get(emailKey) : undefined);

      unifiedList.push({
        id: `customer-${uid}`,
        uid,
        name: data.name || "Customer",
        email: data.email || "—",
        phone: data.phone,
        userType: "customer",
        role: "customer",
        status: data.status || "active",
        statusReason: data.statusReason,
        permissions: ["storefront_access"],
        orderCount: orderStats?.count ?? 0,
        totalSpent: orderStats?.spend ?? 0,
        addresses: data.addresses || [],
        createdAt: data.createdAt,
        lastActive: orderStats?.lastDate ?? data.createdAt,
      });
    });

    // Sort by createdAt desc
    return unifiedList.sort((a, b) => {
      const at = a.createdAt?.toMillis?.() ?? 0;
      const bt = b.createdAt?.toMillis?.() ?? 0;
      return bt - at;
    });
  } catch (err) {
    console.error("[getAllUnifiedUsers] Failed to fetch users:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Account Status & Permissions Operations
// ---------------------------------------------------------------------------

/** Updates the status of a customer account or admin user (active / inactive / suspended) */
export async function updateUserStatus(
  uid: string,
  userType: "customer" | "admin",
  status: AccountStatus,
  statusReason?: string
): Promise<void> {
  const collectionName = userType === "admin" ? ADMINS_COLLECTION : CUSTOMERS_COLLECTION;
  const userRef = doc(db, collectionName, uid);

  await updateDoc(userRef, {
    status,
    statusReason: statusReason ?? "",
    updatedAt: serverTimestamp(),
  });
}

/** Updates user role and custom granular permissions */
export async function updateUserRoleAndPermissions(
  uid: string,
  userType: "customer" | "admin",
  role: string,
  permissions?: string[]
): Promise<void> {
  if (userType === "admin") {
    const adminRef = doc(db, ADMINS_COLLECTION, uid);
    await updateDoc(adminRef, {
      role: role as AdminRole,
      ...(permissions ? { permissions } : {}),
      updatedAt: serverTimestamp(),
    });
  } else {
    // If upgrading customer to admin
    if (role !== "customer") {
      const custDoc = await getDoc(doc(db, CUSTOMERS_COLLECTION, uid));
      const custData = custDoc.exists() ? (custDoc.data() as CustomerProfile) : null;

      await setDoc(doc(db, ADMINS_COLLECTION, uid), {
        uid,
        name: custData?.name ?? "Promoted User",
        email: custData?.email ?? "",
        phone: custData?.phone ?? "",
        role: role as AdminRole,
        status: custData?.status ?? "active",
        permissions: permissions || ["orders", "inventory"],
        createdAt: custData?.createdAt ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const custRef = doc(db, CUSTOMERS_COLLECTION, uid);
      await updateDoc(custRef, {
        updatedAt: serverTimestamp(),
      });
    }
  }
}

/** Updates basic details for a user (name, phone, notes) */
export async function updateUserDetails(
  uid: string,
  userType: "customer" | "admin",
  details: { name?: string; phone?: string; statusReason?: string }
): Promise<void> {
  const collectionName = userType === "admin" ? ADMINS_COLLECTION : CUSTOMERS_COLLECTION;
  const userRef = doc(db, collectionName, uid);

  const cleanData: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (details.name !== undefined) cleanData.name = details.name.trim();
  if (details.phone !== undefined) cleanData.phone = details.phone.trim();
  if (details.statusReason !== undefined) cleanData.statusReason = details.statusReason.trim();

  await updateDoc(userRef, cleanData);
}

/** Triggers a Firebase password reset email to the user */
export async function sendUserPasswordReset(email: string): Promise<void> {
  if (!email || !email.includes("@")) throw new Error("Invalid email address.");
  await sendPasswordResetEmail(auth, email.trim().toLowerCase());
}

/** Fetches full order history for a customer by phone and email */
export async function getCustomerOrderHistory(phone?: string, email?: string): Promise<Order[]> {
  const orders: Order[] = [];
  const seenIds = new Set<string>();

  if (phone) {
    const qPhone = query(collection(db, ORDERS_COLLECTION), where("customer.phone", "==", phone.trim()));
    const snap = await getDocs(qPhone);
    snap.docs.forEach((d) => {
      if (!seenIds.has(d.id)) {
        seenIds.add(d.id);
        orders.push({ id: d.id, ...d.data() } as Order);
      }
    });
  }

  if (email) {
    const qEmail = query(collection(db, ORDERS_COLLECTION), where("customer.email", "==", email.trim().toLowerCase()));
    const snap = await getDocs(qEmail);
    snap.docs.forEach((d) => {
      if (!seenIds.has(d.id)) {
        seenIds.add(d.id);
        orders.push({ id: d.id, ...d.data() } as Order);
      }
    });
  }

  return orders.sort((a, b) => {
    const at = a.createdAt?.toMillis?.() ?? 0;
    const bt = b.createdAt?.toMillis?.() ?? 0;
    return bt - at;
  });
}
