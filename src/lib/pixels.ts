/**
 * pixels.ts
 * Safe wrappers for Meta Pixel (fbq), TikTok Pixel (ttq), and Google Analytics 4 (gtag).
 *
 * Every function:
 *  - Is a no-op when the corresponding env var is empty/undefined.
 *  - Guards against SSR by checking typeof window !== 'undefined'.
 *  - Guards against missing pixel scripts with typeof window.fbq / window.ttq / window.gtag.
 *  - Wraps every call in try/catch so a broken or blocked pixel script never
 *    throws an uncaught error and never breaks the user-facing app.
 *
 * These are inert (do nothing) until real IDs are added to .env.local:
 *   NEXT_PUBLIC_META_PIXEL_ID
 *   NEXT_PUBLIC_TIKTOK_PIXEL_ID
 *   NEXT_PUBLIC_GA4_ID
 */

// ---------------------------------------------------------------------------
// Window type augmentation — fbq, ttq, gtag are injected by third-party scripts
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    ttq?: {
      track: (event: string, params?: Record<string, unknown>) => void;
      page: () => void;
    };
    gtag?: (...args: unknown[]) => void;
  }
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

const hasMeta    = () => typeof window !== "undefined" && typeof window.fbq === "function" && !!process.env.NEXT_PUBLIC_META_PIXEL_ID;
const hasTikTok  = () => typeof window !== "undefined" && typeof window.ttq?.track === "function" && !!process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
const hasGA4     = () => typeof window !== "undefined" && typeof window.gtag === "function" && !!process.env.NEXT_PUBLIC_GA4_ID;

// ---------------------------------------------------------------------------
// trackPageView
// ---------------------------------------------------------------------------

export function trackPageView(): void {
  try {
    if (hasMeta())   window.fbq!("track", "PageView");
  } catch { /* silent */ }

  try {
    if (hasTikTok()) window.ttq!.page();
  } catch { /* silent */ }

  try {
    if (hasGA4())    window.gtag!("event", "page_view");
  } catch { /* silent */ }
}

// ---------------------------------------------------------------------------
// trackViewContent
// ---------------------------------------------------------------------------

export function trackViewContent(product: {
  id: string;
  title: string;
  price: number;
}): void {
  try {
    if (hasMeta()) {
      window.fbq!("track", "ViewContent", {
        content_ids:  [product.id],
        content_type: "product",
        content_name: product.title,
        value:        product.price,
        currency:     "LKR",
      });
    }
  } catch { /* silent */ }

  try {
    if (hasTikTok()) {
      window.ttq!.track("ViewContent", {
        content_id:   product.id,
        content_name: product.title,
        value:        product.price,
        currency:     "LKR",
      });
    }
  } catch { /* silent */ }

  try {
    if (hasGA4()) {
      window.gtag!("event", "view_item", {
        currency: "LKR",
        value:    product.price,
        items:    [{ item_id: product.id, item_name: product.title, price: product.price }],
      });
    }
  } catch { /* silent */ }
}

// ---------------------------------------------------------------------------
// trackAddToCart
// ---------------------------------------------------------------------------

export function trackAddToCart(
  product: { id: string; title: string; price: number },
  qty: number
): void {
  const value = product.price * qty;

  try {
    if (hasMeta()) {
      window.fbq!("track", "AddToCart", {
        content_ids:  [product.id],
        content_type: "product",
        content_name: product.title,
        value,
        currency:     "LKR",
      });
    }
  } catch { /* silent */ }

  try {
    if (hasTikTok()) {
      window.ttq!.track("AddToCart", {
        content_id:   product.id,
        content_name: product.title,
        quantity:     qty,
        value,
        currency:     "LKR",
      });
    }
  } catch { /* silent */ }

  try {
    if (hasGA4()) {
      window.gtag!("event", "add_to_cart", {
        currency: "LKR",
        value,
        items:    [{ item_id: product.id, item_name: product.title, price: product.price, quantity: qty }],
      });
    }
  } catch { /* silent */ }
}

// ---------------------------------------------------------------------------
// trackInitiateCheckout
// ---------------------------------------------------------------------------

export function trackInitiateCheckout(subtotal: number, itemCount: number): void {
  try {
    if (hasMeta()) {
      window.fbq!("track", "InitiateCheckout", {
        value:      subtotal,
        currency:   "LKR",
        num_items:  itemCount,
      });
    }
  } catch { /* silent */ }

  try {
    if (hasTikTok()) {
      window.ttq!.track("InitiateCheckout", {
        value:    subtotal,
        currency: "LKR",
      });
    }
  } catch { /* silent */ }

  try {
    if (hasGA4()) {
      window.gtag!("event", "begin_checkout", {
        currency: "LKR",
        value:    subtotal,
      });
    }
  } catch { /* silent */ }
}

// ---------------------------------------------------------------------------
// trackPurchase
// ---------------------------------------------------------------------------

export function trackPurchase(order: {
  orderNumber: string;
  total: number;
  items: { productId: string; qty: number }[];
}): void {
  try {
    if (hasMeta()) {
      window.fbq!("track", "Purchase", {
        content_ids:  order.items.map((i) => i.productId),
        content_type: "product",
        value:        order.total,
        currency:     "LKR",
      });
    }
  } catch { /* silent */ }

  try {
    if (hasTikTok()) {
      window.ttq!.track("CompletePayment", {
        order_id: order.orderNumber,
        value:    order.total,
        currency: "LKR",
      });
    }
  } catch { /* silent */ }

  try {
    if (hasGA4()) {
      window.gtag!("event", "purchase", {
        transaction_id: order.orderNumber,
        value:          order.total,
        currency:       "LKR",
        items:          order.items.map((i) => ({ item_id: i.productId, quantity: i.qty })),
      });
    }
  } catch { /* silent */ }
}
