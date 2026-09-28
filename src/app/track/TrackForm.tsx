"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { getOrderByNumber } from "@/lib/orderService";
import type { Order, OrderStatus } from "@/lib/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending — awaiting confirmation",
  confirmed: "Confirmed",
  processing: "Processing",
  ready_to_dispatch: "Ready to Dispatch",
  dispatched: "Out for Delivery",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  failed_delivery: "Failed Delivery",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: "text-amber-600 bg-amber-50 border-amber-200",
  confirmed: "text-blue-600 bg-blue-50 border-blue-200",
  processing: "text-blue-600 bg-blue-50 border-blue-200",
  ready_to_dispatch: "text-purple-600 bg-purple-50 border-purple-200",
  dispatched: "text-purple-600 bg-purple-50 border-purple-200",
  delivered: "text-teal-600 bg-teal-50 border-teal-200",
  completed: "text-emerald-600 bg-emerald-50 border-emerald-200",
  cancelled: "text-red-600 bg-red-50 border-red-200",
  failed_delivery: "text-red-600 bg-red-50 border-red-200",
};

export default function TrackForm() {
  const [input, setInput]   = useState("");
  const [order, setOrder]   = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading]   = useState(false);

  const inputCls = "w-full rounded-lg border border-brand-border bg-brand-white px-3 py-2.5 text-sm text-brand-brown placeholder:text-brand-muted focus:outline-none focus:border-brand-terracotta transition-colors";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const code = input.trim().toUpperCase();
    if (!code) return;
    setLoading(true);
    setNotFound(false);
    setOrder(null);
    try {
      const found = await getOrderByNumber(code);
      if (!found) { setNotFound(true); }
      else { setOrder(found); }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          placeholder="FLM-00001"
          className={`${inputCls} flex-1 font-mono`}
        />
        <button type="submit" disabled={loading || !input.trim()}
          className="px-5 py-2.5 rounded-full bg-brand-terracotta text-brand-white font-medium text-sm hover:bg-brand-terracotta-dark disabled:opacity-60 disabled:cursor-not-allowed transition-colors whitespace-nowrap">
          {loading ? "Searching…" : "Track"}
        </button>
      </form>

      {notFound && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          No order found with that number. Check your confirmation message and try again.
        </div>
      )}

      {order && (
        <div className="bg-brand-white rounded-2xl border border-brand-border p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="font-mono font-semibold text-brand-brown text-lg">{order.orderNumber}</p>
              <p className="text-xs text-brand-muted mt-0.5">
                {order.createdAt?.toDate?.().toLocaleDateString("en-LK", {
                  day: "numeric", month: "long", year: "numeric"
                })}
              </p>
            </div>
            <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold border ${STATUS_COLOR[order.orderStatus]}`}>
              {STATUS_LABELS[order.orderStatus]}
            </span>
          </div>

          {order.courier && (
            <div className="bg-brand-ivory rounded-xl px-4 py-3 text-sm">
              <p className="font-medium text-brand-brown">Courier: {order.courier.name}</p>
              <p className="text-brand-stone font-mono mt-0.5">Tracking: {order.courier.trackingNo}</p>
            </div>
          )}

          <div className="border-t border-brand-border pt-4">
            <p className="text-xs text-brand-muted mb-2">Items ordered</p>
            <ul className="flex flex-col gap-1">
              {order.items.map((item, i) => (
                <li key={i} className="text-sm text-brand-stone">
                  {item.title} <span className="text-brand-muted">× {item.qty}</span>
                </li>
              ))}
            </ul>
          </div>

          <Link href={`/order/${order.orderNumber}`}
            className="text-sm text-brand-terracotta hover:text-brand-terracotta-dark underline underline-offset-2 transition-colors self-start">
            View full order details →
          </Link>
        </div>
      )}

      <p className="text-xs text-brand-muted text-center">
        Your order number is in your confirmation email or SMS.
        Need help? <a href="https://wa.me/94711168590" target="_blank" rel="noopener noreferrer"
          className="text-brand-terracotta underline underline-offset-2">WhatsApp us</a>.
      </p>
    </div>
  );
}
