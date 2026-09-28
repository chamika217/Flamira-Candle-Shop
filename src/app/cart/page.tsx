"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import type { CartItem } from "@/context/CartContext";

// ---------------------------------------------------------------------------
// Delivery fee
// TODO: Make this district-based per the project spec — look up the customer's
// district at checkout time and apply the appropriate rate from a config/table.
// ---------------------------------------------------------------------------
const DELIVERY_FEE = 350;

function formatPrice(n: number) {
  return `Rs. ${n.toLocaleString("en-LK")}`;
}

// ---------------------------------------------------------------------------
// Quantity stepper
// ---------------------------------------------------------------------------
function QtyStepper({
  item,
  onUpdate,
}: {
  item: CartItem;
  onUpdate: (id: string, qty: number) => void;
}) {
  return (
    <div className="inline-flex items-center border border-brand-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => onUpdate(item.productId, item.qty - 1)}
        className="px-2.5 py-1.5 text-brand-brown hover:bg-brand-ivory disabled:opacity-40 transition-colors text-base leading-none"
        aria-label={`Decrease quantity of ${item.title}`}
        disabled={item.qty <= 1}
      >
        −
      </button>
      <span className="px-3 py-1.5 text-sm font-semibold text-brand-brown min-w-[2rem] text-center select-none">
        {item.qty}
      </span>
      <button
        type="button"
        onClick={() => onUpdate(item.productId, item.qty + 1)}
        className="px-2.5 py-1.5 text-brand-brown hover:bg-brand-ivory transition-colors text-base leading-none"
        aria-label={`Increase quantity of ${item.title}`}
      >
        +
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cart row
// ---------------------------------------------------------------------------
function CartRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: CartItem;
  onUpdate: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <li className="flex gap-4 py-5 border-b border-brand-border last:border-b-0">
      {/* Thumbnail */}
      <Link href={`/product/${item.slug}`} className="shrink-0" tabIndex={-1} aria-hidden="true">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-brand-ivory border border-brand-border">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.title}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-[10px] text-brand-muted">No image</span>
            </div>
          )}
        </div>
      </Link>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-2 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/product/${item.slug}`}
            className="font-serif text-sm sm:text-base font-semibold text-brand-brown hover:text-brand-terracotta transition-colors line-clamp-2 leading-snug"
          >
            {item.title}
          </Link>
          <button
            type="button"
            onClick={() => onRemove(item.productId)}
            className="shrink-0 text-brand-muted hover:text-red-500 transition-colors text-xs underline underline-offset-2"
            aria-label={`Remove ${item.title} from cart`}
          >
            Remove
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 mt-auto flex-wrap">
          <QtyStepper item={item} onUpdate={onUpdate} />
          <span className="text-sm font-semibold text-brand-terracotta">
            {formatPrice(item.price * item.qty)}
          </span>
        </div>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function CartPage() {
  const { items, subtotal, updateQty, removeItem, cartHydrated } = useCart();
  const total = subtotal + DELIVERY_FEE;

  // Show loading until localStorage cart is read — prevents flash of empty state
  if (!cartHydrated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-4 border-brand-terracotta border-t-transparent animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 px-4 text-center">
        <p className="font-serif text-2xl text-brand-stone">Your cart is empty</p>
        <p className="text-sm text-brand-muted">Add something beautiful to get started.</p>
        <Link
          href="/shop"
          className="inline-block px-7 py-2.5 rounded-full bg-brand-terracotta text-brand-white text-sm font-medium hover:bg-brand-terracotta-dark transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-brand-brown mb-8">
          Your Cart
        </h1>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* ---- Item list ---- */}
          <div className="flex-1 min-w-0 bg-brand-white rounded-2xl border border-brand-border px-5 sm:px-6">
            <ul>
              {items.map((item) => (
                <CartRow
                  key={item.productId}
                  item={item}
                  onUpdate={updateQty}
                  onRemove={removeItem}
                />
              ))}
            </ul>
          </div>

          {/* ---- Order summary ---- */}
          <div className="w-full lg:w-72 shrink-0 bg-brand-white rounded-2xl border border-brand-border p-5 sm:p-6 sticky top-20">
            <h2 className="font-serif text-lg font-semibold text-brand-brown mb-4">
              Order Summary
            </h2>

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between text-brand-stone">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-brand-stone">
                <span>Estimated Delivery</span>
                <span>{formatPrice(DELIVERY_FEE)}</span>
              </div>
              <p className="text-xs text-brand-muted">
                Exact delivery fee calculated at checkout based on your district.
              </p>
              <div className="flex justify-between font-semibold text-brand-brown border-t border-brand-border pt-3 mt-1 text-base">
                <span>Total</span>
                <span className="text-brand-terracotta">{formatPrice(total)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="mt-5 block w-full text-center px-6 py-3 rounded-full bg-brand-terracotta text-brand-white font-medium text-sm hover:bg-brand-terracotta-dark active:scale-95 transition-all"
            >
              Proceed to Checkout
            </Link>

            <Link
              href="/shop"
              className="mt-3 block w-full text-center text-xs text-brand-muted hover:text-brand-stone transition-colors"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
