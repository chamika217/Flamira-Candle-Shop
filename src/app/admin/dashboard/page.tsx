"use client";

import { useEffect, useState } from "react";
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
    day: "numeric", month: "short", year: "numeric",
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
  pending:          "bg-amber-100 text-amber-700",
  confirmed:        "bg-blue-100 text-blue-700",
  processing:       "bg-blue-100 text-blue-700",
  ready_to_dispatch:"bg-purple-100 text-purple-700",
  dispatched:       "bg-indigo-100 text-indigo-700",
  delivered:        "bg-green-100 text-green-700",
  completed:        "bg-emerald-100 text-emerald-700",
  cancelled:        "bg-red-100 text-red-600",
  failed_delivery:  "bg-red-100 text-red-600",
};

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  sub,
  loading,
}: {
  label: string;
  value: string | number;
  sub?: string;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      {loading ? (
        <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
      ) : (
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      )}
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
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

  // ---- Derived stats ----
  const todayOrders = orders.filter((o) => isToday(o.createdAt)).length;

  const monthRevenue = orders
    .filter((o) => o.orderStatus === "completed" && isThisMonth(o.createdAt))
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = orders.filter((o) => o.orderStatus === "pending").length;

  const lowStock = products.filter(
    (p) => p.stockQty > 0 && p.stockQty <= p.lowStockThreshold
  ).length;

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Welcome back to Flamira Admin.</p>
      </div>

      {/* ---- Stat cards ---- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Orders"
          value={todayOrders}
          loading={loadingData}
        />
        <StatCard
          label="This Month's Revenue"
          value={formatPrice(monthRevenue)}
          sub="Completed orders only"
          loading={loadingData}
        />
        <StatCard
          label="Pending Orders"
          value={pendingOrders}
          loading={loadingData}
        />
        <StatCard
          label="Low Stock Items"
          value={lowStock}
          sub="At or below threshold"
          loading={loadingData}
        />
      </div>

      {/* ---- Recent orders table ---- */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Recent Orders</h2>
        </div>

        {loadingData ? (
          <div className="p-8 flex justify-center">
            <div className="w-6 h-6 rounded-full border-4 border-brand-terracotta border-t-transparent animate-spin" />
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            No orders yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Order #</th>
                  <th className="text-left px-5 py-3 font-semibold">Customer</th>
                  <th className="text-left px-5 py-3 font-semibold">Total</th>
                  <th className="text-left px-5 py-3 font-semibold">Status</th>
                  <th className="text-left px-5 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-medium text-gray-800">
                      {order.orderNumber}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">
                      {order.customer.name}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[order.orderStatus]}`}
                      >
                        {STATUS_LABELS[order.orderStatus]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {formatDate(order.createdAt)}
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
