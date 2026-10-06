"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, AlertCircle, ArrowRight, Package, DollarSign, Sparkles, ExternalLink, ShoppingBag } from "lucide-react";
import { getProducts } from "@/lib/productService";
import { getOrders } from "@/lib/orderService";
import type { Product, Order, OrderStatus } from "@/lib/types";
import { Timestamp } from "firebase/firestore";

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

function isToday(ts: Timestamp | undefined): boolean {
  if (!ts) return false;
  const d = ts.toDate();
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isThisMonth(ts: Timestamp | undefined): boolean {
  if (!ts) return false;
  const d = ts.toDate();
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:          "Pending",
  confirmed:        "Confirmed",
  processing:       "Processing",
  ready_to_dispatch:"Ready",
  dispatched:       "Dispatched",
  delivered:        "Delivered",
  completed:        "Completed",
  cancelled:        "Cancelled",
  failed_delivery:  "Failed Delivery",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:          "bg-amber-100 text-amber-800 border border-amber-200",
  confirmed:        "bg-blue-100 text-blue-800 border border-blue-200",
  processing:       "bg-indigo-100 text-indigo-800 border border-indigo-200",
  ready_to_dispatch:"bg-purple-100 text-purple-800 border border-purple-200",
  dispatched:        "bg-sky-100 text-sky-800 border border-sky-200",
  delivered:         "bg-teal-100 text-teal-800 border border-teal-200",
  completed:         "bg-emerald-100 text-emerald-800 border border-emerald-200",
  cancelled:         "bg-red-100 text-red-700 border border-red-200",
  failed_delivery:   "bg-rose-100 text-rose-700 border border-rose-200",
};

// ---------------------------------------------------------------------------
// Stat card component
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  sub,
  loading,
  href,
  highlight,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  loading: boolean;
  href?: string;
  highlight?: boolean;
  icon?: React.ReactNode;
}) {
  const content = (
    <div
      className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 ${
        highlight
          ? "bg-amber-500/10 border-amber-300 hover:border-amber-400 hover:bg-amber-500/15 shadow-xs"
          : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-xs"
      } ${href ? "cursor-pointer group" : ""}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">{label}</p>
        {icon && <span className="text-gray-400 group-hover:text-brand-terracotta transition-colors">{icon}</span>}
      </div>

      <div className="my-2">
        {loading ? (
          <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
        ) : (
          <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        {sub ? (
          <span className="text-gray-400">{sub}</span>
        ) : <span />}
        {href && (
          <span className="text-brand-terracotta font-semibold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            View <ArrowRight className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }

  return content;
}

// ---------------------------------------------------------------------------
// Main Dashboard Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    Promise.all([
      getProducts({ status: "active" }).catch(() => [] as Product[]),
      getOrders().catch(() => [] as Order[]),
    ]).then(([p, o]) => {
      setProducts(p);
      setOrders(o);
      setLoadingData(false);
    });
  }, []);

  // Derived stats
  const todayOrders = orders.filter((o) => isToday(o.createdAt)).length;

  const monthRevenue = orders
    .filter((o) => o.orderStatus === "completed" && isThisMonth(o.createdAt))
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrdersList = orders.filter((o) => o.orderStatus === "pending");
  const pendingOrdersCount = pendingOrdersList.length;

  const lowStock = products.filter(
    (p) => p.stockQty > 0 && p.stockQty <= p.lowStockThreshold
  ).length;

  const recentOrders = orders.slice(0, 6);

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Welcome Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Welcome back to Flamira Candle & Décor Studio Admin.</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/orders"
            className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-xs transition-colors"
          >
            All Orders
          </Link>
          <Link
            href="/admin/products"
            className="px-4 py-2 rounded-xl bg-brand-terracotta text-white text-sm font-semibold hover:bg-brand-terracotta-dark shadow-xs transition-colors"
          >
            + New Product
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Orders"
          value={todayOrders}
          sub="Received today"
          loading={loadingData}
          href="/admin/orders"
          icon={<Clock className="w-4 h-4" />}
        />
        <StatCard
          label="This Month's Revenue"
          value={formatPrice(monthRevenue)}
          sub="Completed orders only"
          loading={loadingData}
          href="/admin/reports"
          icon={<DollarSign className="w-4 h-4" />}
        />
        <StatCard
          label="Pending Orders"
          value={pendingOrdersCount}
          sub="Awaiting verification"
          loading={loadingData}
          href="/admin/orders?status=pending"
          highlight={pendingOrdersCount > 0}
          icon={<AlertCircle className="w-4 h-4" />}
        />
        <StatCard
          label="Low Stock Items"
          value={lowStock}
          sub="Needs restocking"
          loading={loadingData}
          href="/admin/inventory"
          icon={<Package className="w-4 h-4" />}
        />
      </div>

      {/* Pending Orders Action Section */}
      {pendingOrdersCount > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
              <h2 className="text-base font-bold text-amber-950">
                Action Required: Pending Orders ({pendingOrdersCount})
              </h2>
            </div>
            <Link
              href="/admin/orders?status=pending"
              className="text-xs font-bold text-amber-800 hover:text-amber-950 inline-flex items-center gap-1 underline underline-offset-4"
            >
              View all {pendingOrdersCount} pending orders <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {pendingOrdersList.slice(0, 6).map((order) => (
              <div
                key={order.id}
                onClick={() => router.push(`/admin/orders/${order.id}`)}
                className="bg-white rounded-2xl border border-amber-200/90 p-4 shadow-xs hover:shadow-md hover:border-brand-terracotta cursor-pointer transition-all flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-gray-900 text-sm group-hover:text-brand-terracotta transition-colors">
                      {order.orderNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      Pending
                    </span>
                  </div>

                  <p className="font-semibold text-gray-800 text-sm">{order.customer.name}</p>
                  <p className="text-xs text-gray-500 font-mono">{order.customer.phone}</p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                    {order.items.map((i) => `${i.qty}× ${i.title}`).join(", ")}
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="font-bold text-brand-terracotta text-sm">{formatPrice(order.total)}</span>
                  <span className="text-xs font-semibold text-gray-700 group-hover:text-brand-terracotta inline-flex items-center gap-1">
                    Open Details <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Recent Customer Orders</h2>
          <Link
            href="/admin/orders"
            className="text-xs font-semibold text-brand-terracotta hover:underline inline-flex items-center gap-1"
          >
            View all orders <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingData ? (
          <div className="p-12 flex justify-center">
            <div className="w-7 h-7 rounded-full border-4 border-brand-terracotta border-t-transparent animate-spin" />
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">
            No orders placed yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[650px]">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Order #</th>
                  <th className="text-left px-5 py-3 font-semibold">Customer</th>
                  <th className="text-left px-5 py-3 font-semibold">Total</th>
                  <th className="text-left px-5 py-3 font-semibold">Status</th>
                  <th className="text-left px-5 py-3 font-semibold">Date</th>
                  <th className="text-right px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                    className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-3.5 font-mono font-bold text-gray-900 group-hover:text-brand-terracotta transition-colors">
                      {order.orderNumber}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800 leading-snug">{order.customer.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{order.customer.phone}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-900 font-bold">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[order.orderStatus]}`}
                      >
                        {STATUS_LABELS[order.orderStatus]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-terracotta group-hover:underline">
                        Details <ArrowRight className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
