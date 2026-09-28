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
// Admin
// ---------------------------------------------------------------------------

export type AdminRole = "owner" | "staff";

export interface AdminUser {
  uid: string;
  name: string;
  email: string;
  /** owner = full access; staff = Orders + Inventory only */
  role: AdminRole;
  createdAt: Timestamp;
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
  addresses: CustomerAddress[];
  createdAt: Timestamp;
}
