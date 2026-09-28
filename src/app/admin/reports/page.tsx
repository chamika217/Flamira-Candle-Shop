"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getOrders } from "@/lib/orderService";
import { getAllProductsAdmin } from "@/lib/productService";
import { useAdminAuth } from "@/context/AdminAuthContext";
import type { Order, Product, OrderStatus } from "@/lib/types";
import type { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DateRange = "7d" | "30d" | "month" | "all";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(n: number) {
  return `Rs. ${Math.round(n).toLocaleString("en-LK")}`;
}

function formatDate(ts: Timestamp | undefined): string {
  if (!ts) return "—";
  return ts.toDate().toLocaleDateString("en-LK", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function getRangeStart(range: DateRange): Date | null {
  const now = new Date();
  switch (range) {
    case "7d":    { const d = new Date(now); d.setDate(d.getDate() - 7);  d.setHours(0,0,0,0); return d; }
    case "30d":   { const d = new Date(now); d.setDate(d.getDate() - 30); d.setHours(0,0,0,0); return d; }
    case "month": { return new Date(now.getFullYear(), now.getMonth(), 1); }
    case "all":   return null;
  }
}

function inRange(ts: Timestamp | undefined, start: Date | null): boolean {
  if (!ts) return false;
  if (!start) return true;
  return ts.toDate() >= start;
}

const FAILED_STATUSES: OrderStatus[]    = ["cancelled", "failed_delivery"];
const COMPLETED_STATUS: OrderStatus     = "completed";
const EXCLUDE_FOR_SALES: OrderStatus[]  = ["cancelled", "failed_delivery"];

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

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------

function exportCSV(orders: Order[]) {
  const header = ["Order #", "Date", "Customer", "Total (Rs.)", "Status"];
  const rows = orders.map((o) => [
    o.orderNumber,
    formatDate(o.createdAt),
    `"${o.customer.name.replace(/"/g, '""')}"`,
    o.total,
    STATUS_LABELS[o.orderStatus],
  ]);
  const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `flamira-report-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CSS bar chart
// ---------------------------------------------------------------------------

interface ChartBar { label: string; value: number; }

function BarChart({ bars, currency = true }: { bars: ChartBar[]; currency?: boolean }) {
  if (bars.length === 0) {
    return <p className="text-sm text-gray-400 py-4">No data in this range.</p>;
  }
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-2 min-w-0 h-40 pt-2" role="img" aria-label="Sales bar chart">
        {bars.map((bar) => (
          <div key={bar.label} className="flex flex-col items-center gap-1 flex-1 min-w-[28px]">
            <div
              className="w-full bg-brand-terracotta/80 hover:bg-brand-terracotta rounded-t transition-colors cursor-default"
              style={{ height: `${Math.max(4, (bar.value / max) * 128)}px` }}
              title={currency ? formatPrice(bar.value) : String(bar.value)}
            />
            <span className="text-[9px] text-gray-400 text-center leading-tight truncate w-full">
              {bar.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Horizontal bar row (status breakdown)
// ---------------------------------------------------------------------------

function HBar({ label, count, max, color = "bg-brand-terracotta/70" }: {
  label: string; count: number; max: number; color?: string;
}) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-36 shrink-0 text-gray-600 text-xs">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-xs font-semibold text-gray-700 shrink-0">{count}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminReportsPage() {
  const { isStaffOnly } = useAdminAuth();
  const router = useRouter();

  const [orders, setOrders]     = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [range, setRange]       = useState<DateRange>("30d");

  useEffect(() => {
    if (isStaffOnly) router.replace("/admin/dashboard");
  }, [isStaffOnly, router]);

  useEffect(() => {
    Promise.all([
      getOrders().catch(() => [] as Order[]),
      getAllProductsAdmin().catch(() => [] as Product[]),
    ]).then(([o, p]) => {
      setOrders(o);
      setProducts(p);
      setLoading(false);
    });
  }, []);

  if (isStaffOnly) return null;

  // Product maps
  const productMap = useMemo(() => {
    const m: Record<string, Product> = {};
    products.forEach((p) => (m[p.id] = p));
    return m;
  }, [products]);

  // ---- Date-filtered orders ----
  const rangeStart = getRangeStart(range);
  const filteredOrders = useMemo(
    () => orders.filter((o) => inRange(o.createdAt, rangeStart)),
    [orders, rangeStart]
  );

  // ---- Stats ----
  const completedOrders = filteredOrders.filter((o) => o.orderStatus === COMPLETED_STATUS);
  const totalRevenue    = completedOrders.reduce((s, o) => s + o.total, 0);
  const totalOrders     = filteredOrders.length;
  const avgOrderValue   = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
  const pendingOrders   = orders.filter((o) => o.orderStatus === "pending").length; // all-time

  // ---- Sales-over-time chart ----
  const chartBars = useMemo<ChartBar[]>(() => {
    const useWeeks = range === "30d" || range === "month" || range === "all";
    const buckets: Record<string, number> = {};

    completedOrders.forEach((o) => {
      if (!o.createdAt) return;
      const d = o.createdAt.toDate();
      let key: string;
      if (useWeeks) {
        // ISO week label: "W{n} MMM"
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay());
        key = startOfWeek.toLocaleDateString("en-LK", { day: "numeric", month: "short" });
      } else {
        // Day label: "D Mon"
        key = d.toLocaleDateString("en-LK", { weekday: "short", day: "numeric" });
      }
      buckets[key] = (buckets[key] ?? 0) + o.total;
    });

    // Sort by chronological appearance — map insertion order preserves it
    return Object.entries(buckets).map(([label, value]) => ({ label, value }));
  }, [completedOrders, range]);

  // ---- Best-selling products ----
  const bestSellers = useMemo(() => {
    const qtyMap: Record<string, number>     = {};
    const revenueMap: Record<string, number> = {};

    filteredOrders
      .filter((o) => !EXCLUDE_FOR_SALES.includes(o.orderStatus))
      .forEach((o) => {
        o.items.forEach((item) => {
          qtyMap[item.productId]     = (qtyMap[item.productId] ?? 0) + item.qty;
          revenueMap[item.productId] = (revenueMap[item.productId] ?? 0) + item.price * item.qty;
        });
      });

    return Object.entries(qtyMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([productId, qty]) => ({
        productId,
        title:   productMap[productId]?.title ?? productId,
        image:   productMap[productId]?.images?.[0] ?? null,
        qty,
        revenue: revenueMap[productId] ?? 0,
      }));
  }, [filteredOrders, productMap]);

  // ---- Order status breakdown ----
  const statusCounts = useMemo(() => {
    const counts: Partial<Record<OrderStatus, number>> = {};
    filteredOrders.forEach((o) => {
      counts[o.orderStatus] = (counts[o.orderStatus] ?? 0) + 1;
    });
    return counts;
  }, [filteredOrders]);

  const failureRate = totalOrders > 0
    ? (((statusCounts.cancelled ?? 0) + (statusCounts.failed_delivery ?? 0)) / totalOrders) * 100
    : 0;
  const statusMax = Math.max(...Object.values(statusCounts).map((v) => v ?? 0), 1);

  // ---- Low-stock alert ----
  const lowStockProducts = useMemo(() => {
    return [...products]
      .filter((p) => p.stockQty <= p.lowStockThreshold || p.stockQty === 0)
      .sort((a, b) => a.stockQty - b.stockQty)
      .slice(0, 16);
  }, [products]);
  const lowStockCapped  = lowStockProducts.slice(0, 15);
  const lowStockOverflow = lowStockProducts.length > 15 ? lowStockProducts.length - 15 : 0;

  return (
    <div className="flex flex-col gap-8">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-400 mt-0.5">All data computed from live orders and products</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as DateRange)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-brand-terracotta transition-colors cursor-pointer"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
          <button
            type="button"
            onClick={() => exportCSV(filteredOrders)}
            disabled={filteredOrders.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-7 h-7 rounded-full border-4 border-brand-terracotta border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          {/* ---- 3. Summary cards ---- */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Revenue"     value={formatPrice(totalRevenue)}  sub="Completed orders only" />
            <StatCard label="Total Orders"      value={totalOrders}                sub="All statuses in range" />
            <StatCard label="Avg. Order Value"  value={formatPrice(avgOrderValue)} sub="Completed orders" />
            <StatCard label="Pending Orders"    value={pendingOrders}              sub="Current — all time" />
          </div>

          {/* ---- 4. Sales-over-time chart ---- */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-800">Revenue Over Time</h2>
              <span className="text-xs text-gray-400">Completed orders · {range === "7d" ? "daily" : "weekly"} buckets</span>
            </div>
            <BarChart bars={chartBars} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ---- 5. Best-selling products ---- */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">Best-Selling Products</h2>
              {bestSellers.length === 0 ? (
                <p className="text-sm text-gray-400">No sales data in this range.</p>
              ) : (
                <ol className="flex flex-col gap-3">
                  {bestSellers.map((item, i) => (
                    <li key={item.productId} className="flex items-center gap-3">
                      <span className="w-5 text-xs font-bold text-gray-400 shrink-0 text-right">
                        {i + 1}
                      </span>
                      {item.image ? (
                        <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                          <Image src={item.image} alt={item.title} fill className="object-cover" sizes="36px" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 font-medium line-clamp-1">{item.title}</p>
                        <p className="text-xs text-gray-400">{item.qty} units sold</p>
                      </div>
                      <span className="text-xs font-semibold text-gray-700 shrink-0">
                        {formatPrice(item.revenue)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* ---- 6. Order status breakdown ---- */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">Order Status Breakdown</h2>
              {totalOrders === 0 ? (
                <p className="text-sm text-gray-400">No orders in this range.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {ALL_STATUSES.map((s) => {
                    const count = statusCounts[s] ?? 0;
                    if (count === 0) return null;
                    const isFailed = FAILED_STATUSES.includes(s);
                    return (
                      <HBar
                        key={s}
                        label={STATUS_LABELS[s]}
                        count={count}
                        max={statusMax}
                        color={
                          s === "completed"     ? "bg-emerald-400"    :
                          s === "delivered"     ? "bg-teal-400"       :
                          isFailed              ? "bg-red-400"        :
                          s === "pending"       ? "bg-gray-400"       :
                          "bg-brand-terracotta/70"
                        }
                      />
                    );
                  })}

                  {/* COD failure rate */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-600">COD Failure Rate</p>
                      <p className={[
                        "text-sm font-bold",
                        failureRate > 10 ? "text-red-600" : failureRate > 5 ? "text-amber-600" : "text-emerald-600",
                      ].join(" ")}>
                        {failureRate.toFixed(1)}%
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      (cancelled + failed_delivery) ÷ total orders in range
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ---- 7. Low-stock alert ---- */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-800">Low-Stock Alert</h2>
              <span className="text-xs text-gray-400">Current stock · ignores date filter</span>
            </div>
            {lowStockCapped.length === 0 ? (
              <p className="text-sm text-gray-400">All products are well-stocked 🎉</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[400px]">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-semibold">Product</th>
                        <th className="text-center px-4 py-2.5 font-semibold">Stock</th>
                        <th className="text-center px-4 py-2.5 font-semibold">Threshold</th>
                        <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {lowStockCapped.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2.5 font-medium text-gray-800 max-w-[200px]">
                            <span className="line-clamp-1">{p.title}</span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`font-bold text-sm ${p.stockQty === 0 ? "text-red-600" : "text-amber-600"}`}>
                              {p.stockQty}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center text-gray-500 text-xs">
                            {p.lowStockThreshold}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              p.stockQty === 0
                                ? "bg-red-100 text-red-600"
                                : "bg-amber-100 text-amber-700"
                            }`}>
                              {p.stockQty === 0 ? "Out of Stock" : "Low Stock"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {lowStockOverflow > 0 && (
                  <p className="text-xs text-gray-400 mt-3 px-4">
                    +{lowStockOverflow} more low-stock item{lowStockOverflow !== 1 ? "s" : ""} — visit the Inventory page for the full list.
                  </p>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
