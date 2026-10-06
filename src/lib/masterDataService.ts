/**
 * masterDataService.ts
 * Manages Master Data configurations stored in `settings/master_data`:
 * - Product Sizes & Dimensions
 * - Product Colors & Scent Variants
 * - Order Statuses & Workflow
 * - User Roles & Permission Matrices
 * - System Global Configuration
 */

import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  MasterData,
  ProductSizeOption,
  ProductColorVariantOption,
  OrderStatusConfig,
  UserRoleDefinition,
  SystemConfig,
} from "@/lib/types";

const MASTER_DATA_DOC = "settings/master_data";

// ---------------------------------------------------------------------------
// Default Seed Values
// ---------------------------------------------------------------------------

export const DEFAULT_SIZES: ProductSizeOption[] = [
  { id: "sz-1", name: "Petite Jar (100g)", code: "100G", weightGrams: 100, description: "Single cotton wick, ~20 hrs burn time", sortOrder: 1, active: true },
  { id: "sz-2", name: "Classic Amber Jar (200g)", code: "200G", weightGrams: 200, description: "Single cotton wick, ~40 hrs burn time", sortOrder: 2, active: true },
  { id: "sz-3", name: "Grand Signature (350g)", code: "350G", weightGrams: 350, description: "Dual wooden wick, ~65 hrs burn time", sortOrder: 3, active: true },
  { id: "sz-4", name: "3-Wick Centerpiece (500g)", code: "500G", weightGrams: 500, description: "Triple wooden wick, luxury centerpiece", sortOrder: 4, active: true },
  { id: "sz-5", name: "Artisan Wax Tablet (120g)", code: "TAB-120", weightGrams: 120, description: "Botanical closet & drawer freshener", sortOrder: 5, active: true },
  { id: "sz-6", name: "Resin Trinket Tray (Medium)", code: "TR-M", weightGrams: 280, description: "Standard 18cm oval resin tray", sortOrder: 6, active: true },
];

export const DEFAULT_COLORS_VARIANTS: ProductColorVariantOption[] = [
  { id: "cv-1", name: "Madagascar Vanilla & Sandalwood", colorHex: "#F5E6CA", scentFamily: "Warm Gourmand", description: "Creamy vanilla infused with royal Ceylon sandalwood", sortOrder: 1, active: true },
  { id: "cv-2", name: "French Lavender & Wild Chamomile", colorHex: "#D8BFD8", scentFamily: "Floral & Calming", description: "Soothing pure essential oils for restful sleep", sortOrder: 2, active: true },
  { id: "cv-3", name: "Velvet Rose & Smoked Oud", colorHex: "#C08081", scentFamily: "Exotic Woody Floral", description: "Deep damask rose with rich smoky agarwood notes", sortOrder: 3, active: true },
  { id: "cv-4", name: "Ceylon Cinnamon & Clove", colorHex: "#C86D51", scentFamily: "Spicy Amber", description: "Warm holiday spice blend hand-poured in terracotta", sortOrder: 4, active: true },
  { id: "cv-5", name: "Fresh Lemongrass & Green Tea", colorHex: "#C5E1A5", scentFamily: "Fresh Citrus", description: "Crisp uplifting herbal garden aroma", sortOrder: 5, active: true },
  { id: "cv-6", name: "Artisan Gold Leaf Clear Resin", colorHex: "#FFD700", scentFamily: "Resin Finish", description: "Crystal clear epoxy with floating 24K gold foil flakes", sortOrder: 6, active: true },
  { id: "cv-7", name: "Terracotta Earth Natural", colorHex: "#B85D3D", scentFamily: "Clay Material", description: "Matte unglazed rustic clay container", sortOrder: 7, active: true },
];

export const DEFAULT_ORDER_STATUSES: OrderStatusConfig[] = [
  { key: "pending", label: "Pending", badgeBg: "bg-amber-100", badgeText: "text-amber-800", description: "New order placed by customer, awaiting admin confirmation", sortOrder: 1 },
  { key: "confirmed", label: "Confirmed", badgeBg: "bg-blue-100", badgeText: "text-blue-800", description: "Order verified, inventory reserved, payment acknowledged", sortOrder: 2 },
  { key: "processing", label: "Processing", badgeBg: "bg-indigo-100", badgeText: "text-indigo-800", description: "Items being hand-poured, prepared or packaged", sortOrder: 3 },
  { key: "ready_to_dispatch", label: "Ready to Dispatch", badgeBg: "bg-purple-100", badgeText: "text-purple-800", description: "Packed in shipping box and labeled for courier pickup", sortOrder: 4 },
  { key: "dispatched", label: "Dispatched", badgeBg: "bg-sky-100", badgeText: "text-sky-800", description: "Handed over to courier with tracking number assigned", sortOrder: 5 },
  { key: "delivered", label: "Delivered", badgeBg: "bg-teal-100", badgeText: "text-teal-800", description: "Delivered to customer address by courier partner", sortOrder: 6 },
  { key: "completed", label: "Completed", badgeBg: "bg-emerald-100", badgeText: "text-emerald-800", description: "Order finalized, payment received, review eligible", sortOrder: 7 },
  { key: "cancelled", label: "Cancelled", badgeBg: "bg-red-100", badgeText: "text-red-700", description: "Order cancelled before dispatch. Stock is automatically restored", sortOrder: 8, isTerminal: true },
  { key: "failed_delivery", label: "Failed Delivery", badgeBg: "bg-rose-100", badgeText: "text-rose-700", description: "Courier returned parcel. Stock is automatically restored", sortOrder: 9, isTerminal: true },
];

export const DEFAULT_ROLES: UserRoleDefinition[] = [
  {
    id: "role-owner",
    key: "owner",
    title: "Store Owner",
    description: "Full system administration, financials, staff management, settings & master data.",
    permissions: [
      "manage_products",
      "manage_categories",
      "manage_orders",
      "manage_inventory",
      "manage_users",
      "manage_master_data",
      "view_reports",
      "manage_settings",
      "manage_content",
      "manage_reviews"
    ],
    isSystem: true,
  },
  {
    id: "role-manager",
    key: "manager",
    title: "Store Operations Manager",
    description: "Day-to-day operations: Products, orders, inventory restocking, content, customer reviews.",
    permissions: [
      "manage_products",
      "manage_categories",
      "manage_orders",
      "manage_inventory",
      "view_reports",
      "manage_content",
      "manage_reviews"
    ],
    isSystem: true,
  },
  {
    id: "role-staff",
    key: "staff",
    title: "Fulfillment & Inventory Staff",
    description: "Process daily orders, print packing slips, update delivery tracking & update stock counts.",
    permissions: [
      "manage_orders",
      "manage_inventory",
      "view_reviews"
    ],
    isSystem: true,
  },
  {
    id: "role-editor",
    key: "content_editor",
    title: "Content & Marketing Editor",
    description: "Hero banners, featured best seller curation, customer reviews moderation & coupons.",
    permissions: [
      "manage_content",
      "manage_reviews",
      "manage_coupons",
      "view_products"
    ],
    isSystem: true,
  },
  {
    id: "role-customer",
    key: "customer",
    title: "Customer Account",
    description: "Browse products, place orders, save delivery addresses, view order history.",
    permissions: [
      "storefront_shopping",
      "save_addresses",
      "view_own_orders",
      "submit_reviews"
    ],
    isSystem: true,
  },
];

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  storeName: "Flamira Candle & Décor Studio",
  tagline: "Handcrafted Luxury Candles & Botanical Décor",
  contactEmail: "candlesflamira@gmail.com",
  contactPhone: "+94 71 116 8590",
  whatsappNumber: "+94 71 116 8590",
  currency: "Rs.",
  orderPrefix: "FLM-",
  standardDeliveryFee: 350,
  freeDeliveryThreshold: 7500,
  lowStockThreshold: 5,
  allowBackordersDefault: true,
  maintenanceMode: false,
};

export const DEFAULT_MASTER_DATA: MasterData = {
  sizes: DEFAULT_SIZES,
  colorVariants: DEFAULT_COLORS_VARIANTS,
  orderStatuses: DEFAULT_ORDER_STATUSES,
  roles: DEFAULT_ROLES,
  systemConfig: DEFAULT_SYSTEM_CONFIG,
};

// ---------------------------------------------------------------------------
// Master Data Fetch & Save
// ---------------------------------------------------------------------------

/**
 * Reads Master Data from `settings/master_data`.
 * Returns default values merged with saved data.
 */
export async function getMasterData(): Promise<MasterData> {
  try {
    const snap = await getDoc(doc(db, MASTER_DATA_DOC));
    if (!snap.exists()) {
      return DEFAULT_MASTER_DATA;
    }

    const data = snap.data() as Partial<MasterData>;

    return {
      sizes: data.sizes && data.sizes.length > 0 ? data.sizes : DEFAULT_SIZES,
      colorVariants: data.colorVariants && data.colorVariants.length > 0 ? data.colorVariants : DEFAULT_COLORS_VARIANTS,
      orderStatuses: data.orderStatuses && data.orderStatuses.length > 0 ? data.orderStatuses : DEFAULT_ORDER_STATUSES,
      roles: data.roles && data.roles.length > 0 ? data.roles : DEFAULT_ROLES,
      systemConfig: { ...DEFAULT_SYSTEM_CONFIG, ...(data.systemConfig || {}) },
      updatedAt: data.updatedAt,
    };
  } catch (err) {
    console.warn("[getMasterData] Falling back to default master data:", err);
    return DEFAULT_MASTER_DATA;
  }
}

/**
 * Saves or updates Master Data document.
 */
export async function saveMasterData(data: Partial<MasterData>): Promise<void> {
  await setDoc(
    doc(db, MASTER_DATA_DOC),
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Seeds or resets all Master Data to default values.
 */
export async function seedMasterData(): Promise<MasterData> {
  await setDoc(doc(db, MASTER_DATA_DOC), {
    ...DEFAULT_MASTER_DATA,
    updatedAt: serverTimestamp(),
  });
  return DEFAULT_MASTER_DATA;
}
