"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product, Review } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import { trackViewContent, trackAddToCart } from "@/lib/pixels";
import { getApprovedReviews } from "@/lib/reviewService";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-LK")}`;
}

// ---------------------------------------------------------------------------
// Stock status
// ---------------------------------------------------------------------------

type StockState =
  | { kind: "in_stock" }
  | { kind: "low_stock"; qty: number }
  | { kind: "made_to_order"; leadTimeDays: number }
  | { kind: "out_of_stock" };

function getStockState(p: Product): StockState {
  if (p.isMadeToOrder) {
    return { kind: "made_to_order", leadTimeDays: p.leadTimeDays ?? 0 };
  }
  if (p.stockQty <= 0 && !p.allowBackorder) {
    return { kind: "out_of_stock" };
  }
  if (p.stockQty > 0 && p.stockQty <= p.lowStockThreshold) {
    return { kind: "low_stock", qty: p.stockQty };
  }
  return { kind: "in_stock" };
}

function StockBadge({ state }: { state: StockState }) {
  switch (state.kind) {
    case "in_stock":
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
          In Stock
        </span>
      );
    case "low_stock":
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700">
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
          Low Stock — only {state.qty} left
        </span>
      );
    case "made_to_order":
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-stone">
          <span className="w-2 h-2 rounded-full bg-brand-stone shrink-0" aria-hidden="true" />
          Made to Order — ships in {state.leadTimeDays} day{state.leadTimeDays !== 1 ? "s" : ""}
        </span>
      );
    case "out_of_stock":
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600">
          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" aria-hidden="true" />
          Out of Stock
        </span>
      );
  }
}

// ---------------------------------------------------------------------------
// Quantity stepper
// ---------------------------------------------------------------------------

function QtyStepper({
  qty,
  onChange,
  max,
}: {
  qty: number;
  onChange: (n: number) => void;
  max: number | null; // null = unlimited (backorder / made-to-order)
}) {
  return (
    <div className="inline-flex items-center border border-brand-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, qty - 1))}
        disabled={qty <= 1}
        className="px-3 py-2 text-brand-brown hover:bg-brand-ivory disabled:opacity-40 transition-colors text-base leading-none"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="px-4 py-2 text-sm font-semibold text-brand-brown min-w-[2.5rem] text-center select-none">
        {qty}
      </span>
      <button
        type="button"
        onClick={() => onChange(max !== null ? Math.min(max, qty + 1) : qty + 1)}
        disabled={max !== null && qty >= max}
        className="px-3 py-2 text-brand-brown hover:bg-brand-ivory disabled:opacity-40 transition-colors text-base leading-none"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Star display (read-only)
// ---------------------------------------------------------------------------

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "text-lg" : "text-sm";
  return (
    <span className={cls} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}>
          ★
        </span>
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Reviews section (client-side fetch inside the already-client component)
// ---------------------------------------------------------------------------

function ReviewsSection({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loaded, setLoaded]   = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    getApprovedReviews(productId)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoaded(true));
  }, [productId]);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="mt-10 border-t border-brand-border pt-8">
      <h2 className="font-serif text-2xl font-semibold text-brand-brown mb-4">
        Reviews
      </h2>

      {!loaded ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 rounded-full border-4 border-brand-terracotta border-t-transparent animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-brand-stone text-sm">
          No reviews yet — be the first to review this product after your order is delivered!
        </p>
      ) : (
        <>
          {/* Summary */}
          <div className="flex items-center gap-3 mb-6">
            <StarDisplay rating={avgRating} size="md" />
            <span className="text-brand-stone text-sm">
              {avgRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
            </span>
          </div>

          {/* Individual reviews */}
          <ul className="flex flex-col gap-6">
            {reviews.map((review) => (
              <li key={review.id} className="flex flex-col gap-2 border-b border-brand-border pb-6 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <StarDisplay rating={review.rating} />
                  <span className="text-sm font-semibold text-brand-brown">{review.customerName || "Customer"}</span>
                  <span className="text-xs text-brand-muted">
                    {review.createdAt?.toDate?.().toLocaleDateString("en-LK", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </span>
                </div>

                <p className="text-brand-stone text-sm leading-relaxed">{review.comment}</p>

                {/* Photos */}
                {review.photos && review.photos.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-1">
                    {review.photos.map((url) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setLightbox(url)}
                        className="relative w-16 h-16 rounded-lg overflow-hidden border border-brand-border hover:border-brand-terracotta transition-colors"
                        aria-label="View photo"
                      >
                        <Image src={url} alt="Review photo" fill className="object-cover" sizes="64px" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Owner reply */}
                {review.reply && (
                  <div className="ml-4 pl-3 border-l-2 border-brand-terracotta/40">
                    <p className="text-xs font-semibold text-brand-terracotta mb-0.5">Flamira</p>
                    <p className="text-sm text-brand-stone leading-relaxed">{review.reply}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-2xl w-full aspect-square">
            <Image
              src={lightbox}
              alt="Review photo"
              fill
              className="object-contain rounded-2xl"
              sizes="(max-width: 768px) 100vw, 672px"
            />
          </div>
          <button
            type="button"
            className="absolute top-4 right-4 text-white text-2xl font-bold hover:text-gray-300"
            aria-label="Close photo"
            onClick={() => setLightbox(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ProductDetailView({ product }: { product: Product }) {
  const { addItem } = useCart();

  // Fire ViewContent once when the component mounts
  useEffect(() => {
    trackViewContent({
      id:    product.id,
      title: product.title,
      price: product.salePrice ?? product.price,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  // Gallery state
  const [activeIndex, setActiveIndex] = useState(0);

  // Quantity state
  const stockState = getStockState(product);
  const isDisabled = stockState.kind === "out_of_stock";
  const qtyMax =
    stockState.kind === "in_stock" || stockState.kind === "low_stock"
      ? product.stockQty
      : null; // made-to-order or backorder — no upper cap

  const [qty, setQty] = useState(1);

  // Add-to-cart confirmation state
  const [added, setAdded] = useState(false);

  const handleAddToCart = useCallback(() => {
    if (isDisabled) return;
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        title: product.title,
        price: product.salePrice ?? product.price,
        image: product.images[0] ?? "",
      },
      qty
    );
    trackAddToCart(
      { id: product.id, title: product.title, price: product.salePrice ?? product.price },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }, [addItem, isDisabled, product, qty]);

  const hasSale =
    product.salePrice !== undefined && product.salePrice < product.price;
  const displayPrice = hasSale ? product.salePrice! : product.price;

  const hasImages = product.images.length > 0;
  const activeImage = hasImages ? product.images[activeIndex] : null;

  // Long description — split on literal "\n" or actual newlines
  const descParagraphs = product.longDesc
    .split(/\\n|\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="bg-brand-cream min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Breadcrumb */}
        <nav className="mb-6 text-xs text-brand-muted flex items-center gap-1.5" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-brand-terracotta transition-colors">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/shop" className="hover:text-brand-terracotta transition-colors">Shop</Link>
          <span aria-hidden="true">/</span>
          <span className="text-brand-stone line-clamp-1">{product.title}</span>
        </nav>

        {/* ---- Main layout: gallery | details ---- */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 items-start">

          {/* ================================================================
              IMAGE GALLERY
              ================================================================ */}
          <div className="w-full lg:w-1/2 flex flex-col gap-3">
            {/* Main image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-brand-ivory border border-brand-border">
              {activeImage ? (
                <Image
                  src={activeImage}
                  alt={product.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-sm text-brand-muted">No image</span>
                </div>
              )}
            </div>

            {/* Thumbnail strip — only if more than one image */}
            {product.images.length > 1 && (
              <div
                className="flex gap-2 overflow-x-auto pb-1"
                role="listbox"
                aria-label="Product images"
              >
                {product.images.map((src, idx) => (
                  <button
                    key={src}
                    type="button"
                    role="option"
                    aria-selected={idx === activeIndex}
                    onClick={() => setActiveIndex(idx)}
                    className={[
                      "relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors",
                      idx === activeIndex
                        ? "border-brand-terracotta"
                        : "border-brand-border hover:border-brand-terracotta/60",
                    ].join(" ")}
                  >
                    <Image
                      src={src}
                      alt={`${product.title} — image ${idx + 1}`}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ================================================================
              PRODUCT DETAILS
              ================================================================ */}
          <div className="w-full lg:w-1/2 flex flex-col gap-5">
            {/* Title */}
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-brand-brown leading-tight">
              {product.title}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-semibold text-brand-terracotta">
                {formatPrice(displayPrice)}
              </span>
              {hasSale && (
                <span className="text-base text-brand-muted line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            {/* Stock badge */}
            <StockBadge state={stockState} />

            {/* Short description */}
            {product.shortDesc && (
              <p className="text-brand-stone text-sm sm:text-base leading-relaxed">
                {product.shortDesc}
              </p>
            )}

            {/* Occasion tags */}
            {product.occasionTags.length > 0 && (
              <div className="flex flex-wrap gap-2" aria-label="Occasion tags">
                {product.occasionTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-brand-ivory border border-brand-border text-brand-stone"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Quantity + Add to Cart */}
            <div className="flex flex-col gap-4 pt-2">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-brand-brown">Qty</span>
                <QtyStepper
                  qty={qty}
                  onChange={setQty}
                  max={qtyMax}
                />
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isDisabled}
                className={[
                  "w-full sm:w-auto px-8 py-3 rounded-full font-medium text-sm transition-all",
                  isDisabled
                    ? "bg-brand-border text-brand-muted cursor-not-allowed"
                    : added
                    ? "bg-emerald-600 text-white scale-95"
                    : "bg-brand-terracotta text-brand-white hover:bg-brand-terracotta-dark active:scale-95",
                ].join(" ")}
                aria-live="polite"
              >
                {isDisabled ? "Out of Stock" : added ? "Added to Cart ✓" : "Add to Cart"}
              </button>
            </div>

            {/* Divider */}
            <hr className="border-brand-border" />

            {/* Long description */}
            {descParagraphs.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="font-serif text-lg font-semibold text-brand-brown">
                  Product Details
                </h2>
                {descParagraphs.map((para, i) => (
                  <p key={i} className="text-brand-stone text-sm leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reviews section — full width below the two columns */}
        <ReviewsSection productId={product.id} />
      </div>
    </div>
  );
}
