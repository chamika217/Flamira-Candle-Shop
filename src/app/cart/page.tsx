"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Package, Shield, Truck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import type { CartItem } from "@/context/CartContext";

const DELIVERY_FEE = 350;

function formatPrice(n: number) {
  return `Rs. ${n.toLocaleString("en-LK")}`;
}

function QtyStepper({ item, onUpdate }: { item: CartItem; onUpdate: (id: string, qty: number) => void }) {
  return (
    <div className="inline-flex items-center border border-brand-border rounded-xl overflow-hidden bg-brand-ivory">
      <button type="button"
        onClick={() => onUpdate(item.productId, item.qty - 1)}
        disabled={item.qty <= 1}
        className="w-9 h-9 flex items-center justify-center text-brand-stone hover:bg-brand-border disabled:opacity-30 transition-colors"
        aria-label={`Decrease quantity of ${item.title}`}>
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span className="w-9 text-center text-sm font-bold text-brand-brown select-none">{item.qty}</span>
      <button type="button"
        onClick={() => onUpdate(item.productId, item.qty + 1)}
        className="w-9 h-9 flex items-center justify-center text-brand-stone hover:bg-brand-border transition-colors"
        aria-label={`Increase quantity of ${item.title}`}>
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function CartRow({ item, onUpdate, onRemove }: {
  item: CartItem;
  onUpdate: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <li className="flex gap-4 sm:gap-6 py-5 sm:py-6 border-b border-brand-border last:border-b-0 group">
      {/* Thumbnail */}
      <Link href={`/product/${item.slug}`} className="shrink-0">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-brand-ivory border border-brand-border group-hover:border-brand-terracotta/40 transition-colors shadow-sm">
          {item.image ? (
            <Image src={item.image} alt={item.title} fill sizes="96px" className="object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Package className="w-6 h-6 text-brand-muted" />
            </div>
          )}
        </div>
      </Link>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/product/${item.slug}`}
            className="font-serif text-sm sm:text-base font-semibold text-brand-brown hover:text-brand-terracotta transition-colors line-clamp-2 leading-snug">
            {item.title}
          </Link>
          <button type="button" onClick={() => onRemove(item.productId)}
            className="shrink-0 p-1.5 rounded-lg text-brand-muted hover:text-red-500 hover:bg-red-50 transition-colors"
            aria-label={`Remove ${item.title} from cart`}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <QtyStepper item={item} onUpdate={onUpdate} />
          <div className="text-right">
            <p className="text-base font-bold text-brand-terracotta">{formatPrice(item.price * item.qty)}</p>
            {item.qty > 1 && (
              <p className="text-xs text-brand-muted">{formatPrice(item.price)} each</p>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

export default function CartPage() {
  const { items, subtotal, updateQty, removeItem, cartHydrated } = useCart();
  const total = subtotal + DELIVERY_FEE;

  if (!cartHydrated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-4 border-brand-terracotta border-t-transparent animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] bg-brand-cream flex flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-brand-ivory border-2 border-brand-border flex items-center justify-center">
          <ShoppingBag className="w-9 h-9 text-brand-muted" />
        </div>
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-brand-brown mb-2">Your cart is empty</h1>
          <p className="text-brand-stone text-sm max-w-sm">
            Looks like you haven&apos;t added anything yet. Discover our handmade candles and gifts!
          </p>
        </div>
        <Link href="/shop"
          className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-brand-terracotta text-white font-semibold text-sm hover:bg-brand-terracotta-dark transition-colors">
          <ShoppingBag className="w-4 h-4" />
          Browse the Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Header */}
      <div className="bg-brand-ivory border-b border-brand-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-brown">Your Cart</h1>
              <p className="text-brand-stone text-sm mt-0.5">{items.reduce((s, i) => s + i.qty, 0)} item{items.reduce((s, i) => s + i.qty, 0) !== 1 ? "s" : ""}</p>
            </div>
            <Link href="/shop" className="text-sm text-brand-terracotta hover:text-brand-terracotta-dark font-medium underline underline-offset-2 transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ---- Cart items ---- */}
          <div className="flex-1 min-w-0">
            <div className="bg-brand-white rounded-3xl border border-brand-border shadow-sm overflow-hidden">
              <ul className="px-5 sm:px-7 divide-y divide-brand-border">
                {items.map((item) => (
                  <CartRow key={item.productId} item={item} onUpdate={updateQty} onRemove={removeItem} />
                ))}
              </ul>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              {[
                { icon: <Truck className="w-4 h-4 text-brand-terracotta" />, text: "Island-wide Delivery" },
                { icon: <Shield className="w-4 h-4 text-brand-terracotta" />, text: "Cash on Delivery" },
                { icon: <Package className="w-4 h-4 text-brand-terracotta" />, text: "Handmade & Authentic" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex flex-col items-center gap-1.5 bg-brand-white rounded-2xl border border-brand-border p-3 text-center">
                  {icon}
                  <p className="text-[10px] font-medium text-brand-stone leading-tight">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ---- Order Summary ---- */}
          <div className="w-full lg:w-80 shrink-0 sticky top-20">
            <div className="bg-brand-white rounded-3xl border border-brand-border shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-brand-border">
                <h2 className="font-serif text-lg font-bold text-brand-brown">Order Summary</h2>
              </div>

              <div className="px-6 py-5 flex flex-col gap-3 text-sm">
                <div className="flex justify-between text-brand-stone">
                  <span>Subtotal ({items.reduce((s, i) => s + i.qty, 0)} items)</span>
                  <span className="font-medium text-brand-brown">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-brand-stone">
                  <span>Est. Delivery</span>
                  <span className="font-medium text-brand-brown">{formatPrice(DELIVERY_FEE)}</span>
                </div>
                <p className="text-xs text-brand-muted bg-brand-ivory rounded-lg px-3 py-2">
                  💡 Exact delivery fee calculated at checkout based on your district.
                </p>
                <div className="flex justify-between font-bold text-brand-brown border-t border-brand-border pt-3 mt-1 text-base">
                  <span>Estimated Total</span>
                  <span className="text-brand-terracotta">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="px-6 pb-6 flex flex-col gap-3">
                <Link href="/checkout"
                  className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-full bg-brand-terracotta text-white font-bold text-sm hover:bg-brand-terracotta-dark active:scale-95 transition-all shadow-md shadow-brand-terracotta/20">
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-center text-xs text-brand-muted">
                  🔒 Secure checkout · Cash on Delivery
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
