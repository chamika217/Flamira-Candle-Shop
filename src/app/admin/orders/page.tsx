"use client";

import React, { useEffect, useState, useMemo, Suspense, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search, Filter, ExternalLink, RefreshCw, Eye, Check, ChevronDown, Phone, MapPin, Truck, AlertCircle
} from "lucide-react";
import { getOrders, updateOrderStatus } from "@/lib/orderService";
import { useAdminAuth } from "@/context/AdminAuthContext";
import type { Order, OrderStatus } from "@/lib/types";
import type { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_STATUSES: OrderStatus[] = [
  "pending", "confirmed", "processing", "ready_to_dispatch",
  "dispatched", "delivered", "completed", "cancelled", "failed_delivery",
];

const STATUS_ORDER: OrderStatus[] = [
  "pending", "confirmed", "processing", "ready_to_dispatch",
  "dispatched", "delivered", "completed",
];
const TERMINAL: OrderStatus[] = ["cancelled", "failed_delivery"];

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:           "Pending",
  confirmed:         "Confirmed",
  processing:        "Processing",
  ready_to_dispatch: "Ready to Dispatch",
  dispatched:        "Dispatched",
  delivered:         "Delivered",
  completed:         "Completed",
  cancelled:         "Cancelled",
  failed_delivery:   "Failed Delivery",
};

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending:           "bg-amber-100 text-amber-800 border border-amber-200",
  confirmed:         "bg-blue-100 text-blue-800 border border-blue-200",
  processing:        "bg-indigo-100 text-indigo-800 border border-indigo-200",
  ready_to_dispatch: "bg-purple-100 text-purple-800 border border-purple-200",
  dispatched:        "bg-sky-100 text-sky-800 border border-sky-200",
  delivered:         "bg-teal-100 text-teal-800 border border-teal-200",
  completed:         "bg-emerald-100 text-emerald-800 border border-emerald-200",
  cancelled:         "bg-red-100 text-red-700 border border-red-200",
  failed_delivery:   "bg-rose-100 text-rose-700 border border-rose-200",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(n: number) {
  return `Rs. ${n.toLocaleString("en-LK")}`;
}

function formatDate(ts: Timestamp | undefined): string {
  if (!ts) return "—";
  return ts.toDate().toLocaleDateString("en-LK", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

function allowedTransitions(current: OrderStatus, isStaffOnly: boolean): OrderStatus[] {
  const forward: OrderStatus[] = [];
  const idx = STATUS_ORDER.indexOf(current);
  if (idx !== -1 && idx < STATUS_ORDER.length - 1) {
    forward.push(...STATUS_ORDER.slice(idx + 1));
  }
  if (!TERMINAL.includes(current)) {
    forward.push(...TERMINAL);
  }
  if (!isStaffOnly) {
    ALL_STATUSES.forEach((s) => {
      if (!forward.includes(s) && s !== current) forward.push(s);
    });
  }
  return forward;
}

// ---------------------------------------------------------------------------
// Status-update control
// ---------------------------------------------------------------------------

function StatusUpdater({
  order,
  isStaffOnly,
  onUpdated,
}: {
  order: Order;
  isStaffOnly: boolean;
  onUpdated: (updated: Order) => void;
}) {
  const allowed = allowedTransitions(order.orderStatus, isStaffOnly);
  const [selected, setSelected] = useState<OrderStatus>(order.orderStatus);
  const [courierName, setCourierName]   = useState(order.courier?.name ?? "");
  const [trackingNo, setTrackingNo]     = useState(order.courier?.trackingNo ?? "");
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const needsCourier = selected === "dispatched";
  const isRestoring  = selected === "cancelled" || selected === "failed_delivery";
  const unchanged    = selected === order.orderStatus;

  async function handleSave() {
    if (unchanged) return;
    if (needsCourier && (!courierName.trim() || !trackingNo.trim())) {
      setError("Courier name and tracking number are required for Dispatched status.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await updateOrderStatus(order.id, selected, {
        courier: needsCourier
          ? { name: courierName.trim(), trackingNo: trackingNo.trim() }
          : undefined,
      });
      setSaved(true);
      onUpdated({
        ...order,
        orderStatus: selected,
        courier: needsCourier ? { name: courierName.trim(), trackingNo: trackingNo.trim() } : order.courier,
      });
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-brand-terracotta transition-colors";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Update Status
          </label>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value as OrderStatus)}
            className={inputCls}
          >
            <option value={order.orderStatus} disabled>
              {STATUS_LABELS[order.orderStatus]} (current)
            </option>
            {allowed.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        {needsCourier && (
          <>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Courier Name *
              </label>
              <input type="text" value={courierName} onChange={(e) => setCourierName(e.target.value)}
                placeholder="e.g. Kapruka, Domex" className={`${inputCls} w-48`} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Tracking No *
              </label>
              <input type="text" value={trackingNo} onChange={(e) => setTrackingNo(e.target.value)}
                placeholder="TRK123456" className={`${inputCls} w-40`} />
            </div>
          </>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || unchanged}
          className={[
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            saved
              ? "bg-emerald-600 text-white"
              : "bg-brand-terracotta text-white hover:bg-brand-terracotta-dark disabled:opacity-50 disabled:cursor-not-allowed",
          ].join(" ")}
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save Status"}
        </button>
      </div>

      {isRestoring && !unchanged && (
        <p className="text-xs text-amber-600">
          ⚠ This will restore stock for all items in this order.
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Expanded order detail panel
// ---------------------------------------------------------------------------

function OrderDetail({
  order,
  isStaffOnly,
  onUpdated,
}: {
  order: Order;
  isStaffOnly: boolean;
  onUpdated: (updated: Order) => void;
}) {
  return (
    <div className="bg-amber-50/20 border-t border-gray-100 px-5 py-6 flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-gray-200/70 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="font-semibold text-gray-700">Order ID:</span> {order.id}
          <span>•</span>
          <span>Placed: {formatDate(order.createdAt)}</span>
        </div>

        <Link
          href={`/admin/orders/${order.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-terracotta text-white text-xs font-semibold hover:bg-brand-terracotta-dark transition-colors shadow-sm"
        >
          <span>Open Full Order Page</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Items Ordered</p>
          <ul className="flex flex-col gap-2">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between gap-4 text-sm bg-white p-2.5 rounded-xl border border-gray-200/60 shadow-xs">
                <span className="text-gray-800 leading-snug">
                  {item.title}
                  <span className="text-brand-terracotta font-semibold ml-1">× {item.qty}</span>
                </span>
                <span className="text-gray-900 shrink-0 font-bold">
                  {formatPrice(item.price * item.qty)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 pt-3 border-t border-gray-200 flex flex-col gap-1 text-sm bg-white p-3 rounded-xl border border-gray-200/60">
            <div className="flex justify-between text-gray-500 text-xs">
              <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500 text-xs">
              <span>Delivery</span><span>{formatPrice(order.deliveryFee)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600 text-xs">
                <span>Discount</span><span>− {formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-2 mt-1 text-base">
              <span>Total</span><span className="text-brand-terracotta">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery address */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Delivery & Customer Info</p>
          <div className="bg-white p-3.5 rounded-xl border border-gray-200/60 text-sm flex flex-col gap-1.5">
            <p className="font-bold text-gray-900 text-base">{order.customer.name}</p>
            <p className="text-brand-terracotta font-medium flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              {order.customer.phone}
            </p>
            {order.customer.whatsapp && order.customer.whatsapp !== order.customer.phone && (
              <p className="text-emerald-600 text-xs">WhatsApp: {order.customer.whatsapp}</p>
            )}
            {order.customer.email && <p className="text-gray-500 text-xs">{order.customer.email}</p>}
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-gray-700 font-medium">{order.address.line1}</p>
              <p className="text-gray-600 text-xs">
                {order.address.city}, {order.address.district}
                {order.address.postalCode ? ` ${order.address.postalCode}` : ""}
              </p>
            </div>
          </div>

          {order.notes && (
            <div className="mt-3 bg-amber-50 p-3 rounded-xl border border-amber-200">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-1">Customer / Gift Note</p>
              <p className="text-xs text-amber-900 italic">&ldquo;{order.notes}&rdquo;</p>
            </div>
          )}
        </div>

        {/* Courier & Payment */}
        <div className="flex flex-col gap-4">
          <div className="bg-white p-3.5 rounded-xl border border-gray-200/60">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Payment Method</p>
            <p className="text-sm font-bold text-gray-800 uppercase">
              {order.paymentMethod === "cod" ? "Cash on Delivery" : "Bank Transfer"}
            </p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800">
              Payment Pending on Delivery
            </span>
          </div>

          {order.courier ? (
            <div className="bg-white p-3.5 rounded-xl border border-gray-200/60">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Courier Partner</p>
              <p className="text-sm text-gray-900 font-bold">{order.courier.name}</p>
              <p className="text-xs font-mono text-sky-700 mt-1 font-semibold">{order.courier.trackingNo}</p>
            </div>
          ) : (
            <div className="bg-gray-50 p-3.5 rounded-xl border border-dashed border-gray-200 text-xs text-gray-400">
              No courier assigned yet.
            </div>
          )}
        </div>
      </div>

      {/* Status updater */}
      <div className="border-t border-gray-200 pt-4">
        <StatusUpdater order={order} isStaffOnly={isStaffOnly} onUpdated={onUpdated} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Orders Page Content
// ---------------------------------------------------------------------------

function AdminOrdersContent() {
  const { isStaffOnly } = useAdminAuth();
  const searchParams = useSearchParams();

  const [orders, setOrders]         = useState<Order[]>([]);
  const [loading, setLoading]       = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const initialStatus = (searchParams.get("status") as OrderStatus) || "all";
  const initialOrderId = searchParams.get("orderId");
  const initialSearch = searchParams.get("search") || "";

  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>(
    ALL_STATUSES.includes(initialStatus as OrderStatus) ? (initialStatus as OrderStatus) : "all"
  );
  const [search, setSearch]             = useState(initialSearch);

  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getOrders()
      .then((data) => {
        setOrders(data);
        if (initialOrderId) {
          setExpandedId(initialOrderId);
          // Highlight and scroll to specific order
          setTimeout(() => {
            const el = document.getElementById(`order-row-${initialOrderId}`);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }, 300);
        }
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [initialOrderId]);

  // If URL changes, react to status parameter
  useEffect(() => {
    const s = searchParams.get("status");
    if (s && ALL_STATUSES.includes(s as OrderStatus)) {
      setStatusFilter(s as OrderStatus);
    }
  }, [searchParams]);

  function handleOrderUpdated(updated: Order) {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.orderStatus !== statusFilter) return false;
      if (
        q &&
        !o.orderNumber.toLowerCase().includes(q) &&
        !o.customer.phone.includes(q) &&
        !o.customer.name.toLowerCase().includes(q) &&
        !o.id.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [orders, search, statusFilter]);

  const pendingCount = orders.filter((o) => o.orderStatus === "pending").length;

  return (
    <div className="flex flex-col gap-6" ref={tableRef}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {orders.length} total orders ({pendingCount} pending confirmation)
          </p>
        </div>

        {pendingCount > 0 && (
          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-800 border border-amber-300 text-xs font-bold hover:bg-amber-500/20 transition-colors"
          >
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>{pendingCount} Pending Orders Need Attention</span>
          </button>
        )}
      </div>

      {/* Quick Status Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            statusFilter === "all"
              ? "bg-brand-brown text-white shadow-sm"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          All ({orders.length})
        </button>

        {ALL_STATUSES.map((st) => {
          const count = orders.filter((o) => o.orderStatus === st).length;
          const active = statusFilter === st;
          return (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                active
                  ? "bg-brand-terracotta text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <span>{STATUS_LABELS[st]}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            placeholder="Search by order #, customer name, phone, or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-brand-terracotta shadow-xs transition-colors"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | OrderStatus)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 font-medium focus:outline-none focus:border-brand-terracotta transition-colors cursor-pointer shadow-xs"
        >
          <option value="all">All Statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-brand-terracotta border-t-transparent animate-spin" />
            <p className="text-sm text-gray-400">Loading orders data…</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">No orders recorded yet.</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400 flex flex-col items-center gap-2">
            <p>No orders match your filter criteria.</p>
            <button
              type="button"
              onClick={() => { setStatusFilter("all"); setSearch(""); }}
              className="text-xs text-brand-terracotta font-semibold underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[750px]">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold">Order #</th>
                  <th className="text-left px-5 py-3.5 font-semibold">Customer</th>
                  <th className="text-center px-5 py-3.5 font-semibold">Items</th>
                  <th className="text-left px-5 py-3.5 font-semibold">Total</th>
                  <th className="text-left px-5 py-3.5 font-semibold">Status</th>
                  <th className="text-left px-5 py-3.5 font-semibold">Date</th>
                  <th className="text-right px-5 py-3.5 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const isExpanded = expandedId === order.id;
                  const isHighlighted = initialOrderId === order.id;

                  return (
                    <React.Fragment key={order.id}>
                      <tr
                        id={`order-row-${order.id}`}
                        onClick={() => setExpandedId(isExpanded ? null : order.id)}
                        className={`border-t border-gray-100 hover:bg-gray-50/80 transition-colors cursor-pointer ${
                          isHighlighted ? "bg-brand-terracotta/5 ring-1 ring-brand-terracotta/20" : ""
                        } ${isExpanded ? "bg-amber-50/10" : ""}`}
                      >
                        <td className="px-5 py-4 font-mono font-bold text-gray-900">
                          {order.orderNumber}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900 leading-snug">{order.customer.name}</p>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">{order.customer.phone}</p>
                        </td>
                        <td className="px-5 py-4 text-center font-medium text-gray-700">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-xs font-semibold">
                            {order.items.reduce((s, i) => s + i.qty, 0)}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-bold text-gray-900">
                          {formatPrice(order.total)}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${STATUS_BADGE[order.orderStatus]}`}>
                            {STATUS_LABELS[order.orderStatus]}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-brand-terracotta hover:bg-brand-terracotta/10 transition-colors"
                              title="Open Full Order Details"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : order.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                              aria-label="Toggle details"
                            >
                              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${order.id}-detail`}>
                          <td colSpan={7} className="p-0">
                            <OrderDetail
                              order={order}
                              isStaffOnly={isStaffOnly}
                              onUpdated={handleOrderUpdated}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-20">
        <div className="w-8 h-8 rounded-full border-4 border-brand-terracotta border-t-transparent animate-spin" />
      </div>
    }>
      <AdminOrdersContent />
    </Suspense>
  );
}
