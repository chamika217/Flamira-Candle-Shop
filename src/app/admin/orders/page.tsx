"use client";

import React, { useEffect, useState, useMemo } from "react";
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

// Linear forward progression (excluding terminal states)
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
  pending:           "bg-gray-100 text-gray-600",
  confirmed:         "bg-blue-100 text-blue-700",
  processing:        "bg-blue-100 text-blue-700",
  ready_to_dispatch: "bg-blue-100 text-blue-700",
  dispatched:        "bg-purple-100 text-purple-700",
  delivered:         "bg-teal-100 text-teal-700",
  completed:         "bg-emerald-100 text-emerald-700",
  cancelled:         "bg-red-100 text-red-600",
  failed_delivery:   "bg-red-100 text-red-600",
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
    day: "numeric", month: "short", year: "numeric",
  });
}

/** Returns the statuses a user is allowed to transition to from `current`. */
function allowedTransitions(current: OrderStatus, isStaffOnly: boolean): OrderStatus[] {
  const forward: OrderStatus[] = [];
  const idx = STATUS_ORDER.indexOf(current);
  if (idx !== -1 && idx < STATUS_ORDER.length - 1) {
    // All statuses ahead in the linear chain
    forward.push(...STATUS_ORDER.slice(idx + 1));
  }
  // Always allow cancellation / failed delivery (from non-terminal states)
  if (!TERMINAL.includes(current)) {
    forward.push(...TERMINAL);
  }
  if (!isStaffOnly) {
    // Owner can move backwards too — add everything not already included
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
      onUpdated({ ...order, orderStatus: selected,
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
    <div className="bg-gray-50 border-t border-gray-100 px-5 py-5 flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Items</p>
          <ul className="flex flex-col gap-1.5">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between gap-4 text-sm">
                <span className="text-gray-700 leading-snug">
                  {item.title}
                  <span className="text-gray-400 ml-1">× {item.qty}</span>
                </span>
                <span className="text-gray-700 shrink-0 font-medium">
                  {formatPrice(item.price * item.qty)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 pt-3 border-t border-gray-200 flex flex-col gap-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Delivery</span><span>{formatPrice(order.deliveryFee)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span><span>− {formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-gray-800 border-t border-gray-200 pt-1 mt-1">
              <span>Total</span><span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery address */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Delivery Address</p>
          <address className="not-italic text-sm text-gray-700 leading-relaxed">
            <p className="font-medium">{order.customer.name}</p>
            <p>{order.customer.phone}</p>
            {order.customer.whatsapp && order.customer.whatsapp !== order.customer.phone && (
              <p className="text-gray-500">WA: {order.customer.whatsapp}</p>
            )}
            {order.customer.email && <p className="text-gray-500">{order.customer.email}</p>}
            <p className="mt-1">{order.address.line1}</p>
            <p>
              {order.address.city}, {order.address.district}
              {order.address.postalCode ? ` ${order.address.postalCode}` : ""}
            </p>
          </address>

          {order.notes && (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Gift Note</p>
              <p className="text-sm text-gray-600 italic">"{order.notes}"</p>
            </div>
          )}
        </div>

        {/* Courier */}
        {order.courier && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Courier</p>
            <p className="text-sm text-gray-700 font-medium">{order.courier.name}</p>
            <p className="text-sm font-mono text-gray-600">{order.courier.trackingNo}</p>
          </div>
        )}
      </div>

      {/* Status updater */}
      <div className="border-t border-gray-200 pt-4">
        <StatusUpdater order={order} isStaffOnly={isStaffOnly} onUpdated={onUpdated} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminOrdersPage() {
  const { isStaffOnly } = useAdminAuth();

  const [orders, setOrders]       = useState<Order[]>([]);
  const [loading, setLoading]     = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [search, setSearch]             = useState("");

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  // Patch a single order in the local array after a status update
  function handleOrderUpdated(updated: Order) {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.orderStatus !== statusFilter) return false;
      if (q && !o.orderNumber.toLowerCase().includes(q) && !o.customer.phone.includes(q)) return false;
      return true;
    });
  }, [orders, search, statusFilter]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-400 mt-0.5">{orders.length} total</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search by order # or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-brand-terracotta transition-colors"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | OrderStatus)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-brand-terracotta transition-colors cursor-pointer"
        >
          <option value="all">All Statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center">
            <div className="w-7 h-7 rounded-full border-4 border-brand-terracotta border-t-transparent animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">No orders yet</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">
            No orders match your search / filter
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Order #</th>
                  <th className="text-left px-4 py-3 font-semibold">Customer</th>
                  <th className="text-center px-4 py-3 font-semibold">Items</th>
                  <th className="text-left px-4 py-3 font-semibold">Total</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const isExpanded = expandedId === order.id;
                  return (
                    <React.Fragment key={order.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : order.id)}
                        className="border-t border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3.5 font-mono font-semibold text-gray-800">
                          {order.orderNumber}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-gray-800 leading-snug">{order.customer.name}</p>
                          <p className="text-xs text-gray-400">{order.customer.phone}</p>
                        </td>
                        <td className="px-4 py-3.5 text-center text-gray-600">
                          {order.items.reduce((s, i) => s + i.qty, 0)}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-gray-700">
                          {formatPrice(order.total)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[order.orderStatus]}`}>
                            {STATUS_LABELS[order.orderStatus]}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-gray-500 text-xs">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-4 py-3.5 text-gray-400 text-center">
                          <span className={`inline-block transition-transform duration-150 ${isExpanded ? "rotate-180" : ""}`}>
                            ▾
                          </span>
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
