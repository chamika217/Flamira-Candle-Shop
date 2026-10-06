"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Phone, Mail, MapPin, Truck, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { getOrderById, updateOrderStatus } from "@/lib/orderService";
import { useAdminAuth } from "@/context/AdminAuthContext";
import type { Order, OrderStatus } from "@/lib/types";
import type { Timestamp } from "firebase/firestore";

const ALL_STATUSES: OrderStatus[] = [
  "pending", "confirmed", "processing", "ready_to_dispatch",
  "dispatched", "delivered", "completed", "cancelled", "failed_delivery",
];

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
  pending:           "bg-amber-100 text-amber-800 border-amber-200",
  confirmed:         "bg-blue-100 text-blue-800 border-blue-200",
  processing:        "bg-indigo-100 text-indigo-800 border-indigo-200",
  ready_to_dispatch: "bg-purple-100 text-purple-800 border-purple-200",
  dispatched:        "bg-sky-100 text-sky-800 border-sky-200",
  delivered:         "bg-teal-100 text-teal-800 border-teal-200",
  completed:         "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled:         "bg-red-100 text-red-700 border-red-200",
  failed_delivery:   "bg-rose-100 text-rose-700 border-rose-200",
};

function formatPrice(n: number) {
  return `Rs. ${n.toLocaleString("en-LK")}`;
}

function formatDate(ts: Timestamp | undefined): string {
  if (!ts) return "—";
  return ts.toDate().toLocaleDateString("en-LK", {
    weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  const router = useRouter();
  const { isStaffOnly } = useAdminAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status updating state
  const [newStatus, setNewStatus] = useState<OrderStatus>("pending");
  const [courierName, setCourierName] = useState("");
  const [trackingNo, setTrackingNo] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    getOrderById(orderId)
      .then((data) => {
        if (data) {
          setOrder(data);
          setNewStatus(data.orderStatus);
          setCourierName(data.courier?.name ?? "");
          setTrackingNo(data.courier?.trackingNo ?? "");
          setAdminNotes(data.notes ?? "");
        } else {
          setError("Order not found.");
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load order.");
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  async function handleUpdateStatus() {
    if (!order) return;
    if (newStatus === "dispatched" && (!courierName.trim() || !trackingNo.trim())) {
      alert("Courier name and tracking number are required for Dispatched status.");
      return;
    }

    setSavingStatus(true);
    try {
      await updateOrderStatus(order.id, newStatus, {
        courier: newStatus === "dispatched" || courierName.trim()
          ? { name: courierName.trim(), trackingNo: trackingNo.trim() }
          : undefined,
        notes: adminNotes.trim() || undefined,
      });

      setOrder({
        ...order,
        orderStatus: newStatus,
        courier: newStatus === "dispatched" || courierName.trim()
          ? { name: courierName.trim(), trackingNo: trackingNo.trim() }
          : order.courier,
        notes: adminNotes.trim() || order.notes,
      });

      setStatusSuccess(true);
      setTimeout(() => setStatusSuccess(false), 2500);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update order status.");
    } finally {
      setSavingStatus(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-brand-terracotta border-t-transparent animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Loading order details…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 p-8 text-center flex flex-col items-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900">Order Not Found</h2>
        <p className="text-sm text-gray-500">{error || "The requested order does not exist or has been removed."}</p>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-terracotta text-white font-medium text-sm hover:bg-brand-terracotta-dark transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors shadow-sm"
            aria-label="Back to orders"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">{order.orderNumber}</h1>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${STATUS_BADGE[order.orderStatus]}`}>
                {STATUS_LABELS[order.orderStatus]}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Placed on {formatDate(order.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4 text-gray-500" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Order Items & Financials */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Order Items Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 text-sm">Ordered Items ({order.items.reduce((s, i) => s + i.qty, 0)})</h2>
              <span className="text-xs font-mono text-gray-400">ID: {order.id}</span>
            </div>

            <div className="divide-y divide-gray-100">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-ivory border border-gray-200 flex items-center justify-center font-bold text-brand-terracotta text-sm shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 leading-snug">{item.title}</h3>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">SKU: {item.sku || "N/A"}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatPrice(item.price)} × <span className="font-semibold text-gray-800">{item.qty}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatPrice(item.price * item.qty)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Totals Calculation */}
            <div className="bg-gray-50/80 p-6 border-t border-gray-100 flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal</span>
                <span className="font-medium text-gray-900">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Island-wide Delivery</span>
                <span className="font-medium text-gray-900">
                  {order.deliveryFee === 0 ? <span className="text-emerald-600 font-semibold">FREE</span> : formatPrice(order.deliveryFee)}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Coupon Discount {order.couponCode ? `(${order.couponCode})` : ""}</span>
                  <span>− {formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-3 border-t border-gray-200 text-base font-bold text-gray-900">
                <span>Total Amount</span>
                <span className="text-xl text-brand-terracotta">{formatPrice(order.total)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                <span>Payment Method: <span className="uppercase font-semibold text-gray-600">{order.paymentMethod === "cod" ? "Cash on Delivery" : "Bank Transfer"}</span></span>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-medium border border-amber-200">Payment Pending on Delivery</span>
              </div>
            </div>
          </div>

          {/* Status & Courier Workflow Updater */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col gap-4">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="font-semibold text-gray-900 text-sm">Fulfillment & Status Update</h2>
              <p className="text-xs text-gray-400 mt-0.5">Manage the live progression of this order.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Order Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 font-medium focus:outline-none focus:border-brand-terracotta"
                >
                  {ALL_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {STATUS_LABELS[st]} {st === order.orderStatus ? "(Current)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Courier Partner
                </label>
                <input
                  type="text"
                  placeholder="e.g. Domex, PromptX, Kapruka"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-brand-terracotta"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Tracking Number / Airway Bill
                </label>
                <input
                  type="text"
                  placeholder="e.g. DMX-88902144"
                  value={trackingNo}
                  onChange={(e) => setTrackingNo(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-mono text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-brand-terracotta"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Admin Internal Notes / Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Add packaging notes or special delivery instructions…"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-brand-terracotta resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {newStatus === "cancelled" || newStatus === "failed_delivery" ? (
                <p className="text-xs text-amber-600 font-medium">⚠ Saving this status will automatically restore stock for all items.</p>
              ) : <div />}

              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={savingStatus}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-md ${
                  statusSuccess
                    ? "bg-emerald-600"
                    : "bg-brand-terracotta hover:bg-brand-terracotta-dark active:scale-95 disabled:opacity-50"
                }`}
              >
                {savingStatus ? "Updating…" : statusSuccess ? "Status Saved ✓" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Customer Details & Shipping */}
        <div className="flex flex-col gap-6">
          {/* Customer Profile Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col gap-4">
            <h2 className="font-semibold text-gray-900 text-sm border-b border-gray-100 pb-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-brand-terracotta" />
              Customer Information
            </h2>

            <div className="flex flex-col gap-3 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Name</p>
                <p className="font-bold text-gray-900 mt-0.5 text-base">{order.customer.name}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Phone</p>
                <a
                  href={`tel:${order.customer.phone}`}
                  className="font-medium text-brand-terracotta hover:underline mt-0.5 block"
                >
                  {order.customer.phone}
                </a>
              </div>

              {order.customer.whatsapp && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">WhatsApp</p>
                  <a
                    href={`https://wa.me/${order.customer.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-emerald-600 hover:underline mt-0.5 block"
                  >
                    {order.customer.whatsapp}
                  </a>
                </div>
              )}

              {order.customer.email && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Email</p>
                  <a
                    href={`mailto:${order.customer.email}`}
                    className="text-gray-700 hover:underline mt-0.5 block truncate"
                  >
                    {order.customer.email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col gap-4">
            <h2 className="font-semibold text-gray-900 text-sm border-b border-gray-100 pb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-terracotta" />
              Delivery Destination
            </h2>

            <address className="not-italic text-sm text-gray-700 leading-relaxed flex flex-col gap-1">
              <p className="font-medium text-gray-900">{order.address.line1}</p>
              <p className="text-gray-800">{order.address.city}, {order.address.district}</p>
              {order.address.postalCode && (
                <p className="text-xs font-mono text-gray-500">Postal Code: {order.address.postalCode}</p>
              )}
            </address>

            {order.notes && (
              <div className="mt-2 pt-3 border-t border-gray-100 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Customer Note / Gift Card</p>
                <p className="text-xs text-amber-900 italic">&ldquo;{order.notes}&rdquo;</p>
              </div>
            )}
          </div>

          {/* Courier Details Card (if dispatched) */}
          {order.courier && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col gap-3">
              <h2 className="font-semibold text-gray-900 text-sm border-b border-gray-100 pb-3 flex items-center gap-2">
                <Truck className="w-4 h-4 text-sky-600" />
                Courier Tracking
              </h2>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Provider</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{order.courier.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Tracking Number</p>
                <p className="text-sm font-mono font-bold text-sky-700 mt-0.5">{order.courier.trackingNo}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
