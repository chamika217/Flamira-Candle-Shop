import { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------------------------
// Category
// ---------------------------------------------------------------------------

export interface Category {
  id: string;
  name: string;
  slug: string;
  /** null for top-level categories */
  parentId: string | null;
  image?: string;
  sortOrder: number;
}

// ---------------------------------------------------------------------------
// Product
// ---------------------------------------------------------------------------

export type ProductStatus = "draft" | "active" | "archived";

export interface ProductSeo {
  title: string;
  description: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  sku: string;
  categoryId: string;
  subCategoryId?: string;
  price: number;
  salePrice?: number;
  stockQty: number;
  lowStockThreshold: number;
  /** If true, orders are accepted even when stockQty reaches 0 */
  allowBackorder: boolean;
  /** If true, item is crafted on demand rather than held in stock */
  isMadeToOrder: boolean;
  /** Production/sourcing lead time in days (relevant when isMadeToOrder is true) */
  leadTimeDays?: number;
  weightGrams: number;
  /** Ordered array of Cloudinary URLs — first element is used as the thumbnail */
  images: string[];
  videoUrl?: string;
  shortDesc: string;
  longDesc: string;
  occasionTags: string[];
  isFeatured: boolean;
  status: ProductStatus;
  seo: ProductSeo;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Order
// ---------------------------------------------------------------------------

/**
 * A point-in-time snapshot of a product at the moment the order was placed.
 * These fields must never be re-fetched from the live Product document.
 */
export interface OrderItem {
  productId: string;
  sku: string;
  title: string;
  price: number;
  qty: number;
}

export type PaymentMethod = "cod" | "bank_transfer";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "ready_to_dispatch"
  | "dispatched"
  | "delivered"
  | "completed"
  | "cancelled"
  | "failed_delivery";

export interface OrderCustomer {
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
}

export interface OrderAddress {
  line1: string;
  city: string;
  district: string;
  postalCode?: string;
}

export interface OrderCourier {
  name: string;
  trackingNo: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  customer: OrderCustomer;
  address: OrderAddress;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  orderStatus: OrderStatus;
  courier?: OrderCourier;
  /** Coupon code that was applied at checkout, stored for reference */
  couponCode?: string;
  notes?: string;
  createdAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Admin & User Control
// ---------------------------------------------------------------------------

export type AccountStatus = "active" | "inactive" | "suspended";

export type AdminRole = "owner" | "manager" | "staff" | "content_editor";

export interface AdminUser {
  uid: string;
  name: string;
  email: string;
  /** owner = full access; manager = store ops; staff = Orders + Inventory; content_editor = CMS & Media */
  role: AdminRole;
  status?: AccountStatus;
  statusReason?: string;
  permissions?: string[];
  phone?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// ---------------------------------------------------------------------------
// Customer (storefront account)
// ---------------------------------------------------------------------------

export interface CustomerAddress {
  line1: string;
  city: string;
  district: string;
  postalCode?: string;
  label?: string; // e.g. "Home", "Office"
}

export interface CustomerProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  status?: AccountStatus;
  statusReason?: string;
  addresses: CustomerAddress[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// Unified representation for User Management
export interface UnifiedUser {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone?: string;
  userType: "customer" | "admin" | "guest";
  role: string;
  status: AccountStatus;
  statusReason?: string;
  permissions?: string[];
  orderCount: number;
  totalSpent: number;
  addresses?: CustomerAddress[];
  createdAt?: Timestamp;
  lastActive?: Timestamp;
}

// ---------------------------------------------------------------------------
// Master Data
// ---------------------------------------------------------------------------

export interface ProductSizeOption {
  id: string;
  name: string;
  code: string;
  weightGrams?: number;
  description?: string;
  sortOrder: number;
  active: boolean;
}

export interface ProductColorVariantOption {
  id: string;
  name: string;
  colorHex?: string;
  scentFamily?: string;
  description?: string;
  sortOrder: number;
  active: boolean;
}

export interface OrderStatusConfig {
  key: OrderStatus;
  label: string;
  badgeBg: string;
  badgeText: string;
  description: string;
  sortOrder: number;
  isTerminal?: boolean;
}

export interface UserRoleDefinition {
  id: string;
  key: AdminRole | "customer";
  title: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
}

export interface SystemConfig {
  storeName: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  currency: string;
  orderPrefix: string;
  standardDeliveryFee: number;
  freeDeliveryThreshold: number;
  lowStockThreshold: number;
  allowBackordersDefault: boolean;
  maintenanceMode: boolean;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface DeliveryRate {
  district: string;
  fee: number;
  estimatedDays: number;
}

export interface Settings {
  deliveryRates: DeliveryRate[];
  freeDeliveryThreshold?: number;
  deliveryPaused?: boolean;
  /** URL of the home-page hero banner image (Cloudinary) */
  bannerImageUrl?: string;
  /** Hero headline text — falls back to hardcoded copy if unset */
  bannerHeadline?: string;
  /** Hero subtext — falls back to hardcoded copy if unset */
  bannerSubtext?: string;
  /** Ordered list of product IDs shown in Best Sellers — overrides isFeatured when set */
  featuredProductIds?: string[];
  /** Store display name shown in emails and admin */
  storeName?: string;
  /** Primary contact phone shown on storefront / emails */
  contactPhone?: string;
  /** Primary contact email shown on storefront / emails */
  contactEmail?: string;
}

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------

export type CouponType = "percentage" | "fixed";

export interface Coupon {
  id: string;
  code: string;             // always stored UPPERCASE
  type: CouponType;
  value: number;            // percentage (0-100) or fixed Rs. amount
  minOrderValue?: number;
  usageLimit?: number;      // undefined = unlimited
  usedCount: number;
  validFrom: Timestamp;
  validTo: Timestamp;
  freeDelivery?: boolean;
  active: boolean;
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export interface Review {
  id: string;
  productId: string;
  orderNumber: string;
  customerName: string;
  rating: number;        // 1–5
  comment: string;
  photos?: string[];     // Cloudinary URLs
  approved: boolean;
  reply?: string;        // Owner reply shown on storefront
  featured: boolean;
  createdAt: Timestamp;
}

export interface MasterData {
  sizes: ProductSizeOption[];
  colorVariants: ProductColorVariantOption[];
  orderStatuses: OrderStatusConfig[];
  roles: UserRoleDefinition[];
  systemConfig: SystemConfig;
  updatedAt?: Timestamp;
}

