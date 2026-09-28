"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getOrders } from "@/lib/orderService";
import { useAdminAuth } from "@/context/AdminAuthContext";
import type { Order, OrderStatus } from "@/lib/types";
import type { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DerivedCustomer {
  phone: string;
  name: string;
  email: string | undefined;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: Timestamp | undefined;
  city: string;
  district: string;
  orders: Order[]; // all orders for this customer, newest first
}

type SortField = "orderCount" | "totalSpent" | "lastOrderDate";
type SortDir   = "asc" | "desc";

// ---------------------------------------------------------------------------
// Status badge (consistent with Orders page colour scheme)
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:           "Pending",
  confirmed:         "Confirmed",
  processing:        "Processing",
  ready_to_dispatch: "Ready",
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

const EXCLUDED_STATUSES: OrderStatus[] = ["cancelled", "failed_delivery"];

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

/**
 * Derives a deduplicated customer list from a flat array of orders.
 * Customers are keyed by phone number. All per-customer calculations happen
 * here so the component only needs to sort/filter the result.
 */
function deriveCustomers(orders: Order[]): DerivedCustomer[] {
  const map = new Map<string, Order[]>();

  for (const order of orders) {
    const phone = order.customer.phone;
    if (!map.has(phone)) map.set(phone, []);
    map.get(phone)!.push(order);
  }

  const customers: DerivedCustomer[] = [];

  map.forEach((customerOrders, phone) => {
    // Sort this customer's orders newest-first
    const sorted = [...customerOrders].sort((a, b) => {
      const at = a.createdAt?.toDate().getTime() ?? 0;
      const bt = b.createdAt?.toDate().getTime() ?? 0;
      return bt - at;
    });

    const mostRecent = sorted[0];
    const totalSpent = sorted
      .filter((o) => !EXCLUDED_STATUSES.includes(o.orderStatus))
      .reduce((sum, o) => sum + o.total, 0);

    customers.push({
      phone,
      name:          mostRecent.customer.name,
      email:         mostRecent.customer.email,
      orderCount:    sorted.length,
      totalSpent,
      lastOrderDate: mostRecent.createdAt,
      city:          mostRecent.address.city,
      district:      mostRecent.address.district,
      orders:        sorted,
    });
  });

  return customers;
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------

function exportCSV(customers: DerivedCustomer[]) {
  const header = ["Name", "Phone", "Email", "Order Count", "Total Spent (Rs.)", "Last Order Date"];
  const rows = customers.map((c) => [
    `"${c.name.replace(/"/g, '""')}"`,
    c.phone,
    c.email ?? "",
    c.orderCount,
    c.totalSpent,
    formatDate(c.lastOrderDate),
  ]);

  const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `flamira-customers-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Sort icon
// ---------------------------------------------------------------------------

function SortIcon({ field, current, dir }: { field: SortField; current: SortField; dir: SortDir }) {
  if (field !== current) return <span className="text-gray-300 ml-1">⇅</span>;
  return <span className="text-brand-terracotta ml-1">{dir === "asc" ? "↑" : "↓"}</span>;
}

// ---------------------------------------------------------------------------
// Expanded customer orders
// ---------------------------------------------------------------------------

function CustomerOrders({ customer }: { customer: DerivedCustomer }) {
  return (
    <div className="bg-gray-50 border-t border-gray-100 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
        Order History ({customer.orderCount})
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[500px]">
          <thead>
            <tr className="text-gray-400 uppercase tracking-wider">
              <th className="text-left pb-2 font-semibold">Order #</th>
              <th className="text-left pb-2 font-semibold">Date</th>
              <th className="text-center pb-2 font-semibold">Items</th>
              <th className="text-left pb-2 font-semibold">Total</th>
              <th className="text-left pb-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customer.orders.map((order) => (
              <tr key={order.id} className="text-gray-600">
                <td className="py-2 pr-4 font-mono font-semibold text-gray-800">
                  {order.orderNumber}
                </td>
                <td className="py-2 pr-4 whitespace-nowrap">
                  {formatDate(order.createdAt)}
                </td>
                <td className="py-2 pr-4 text-center">
                  {order.items.reduce((s, i) => s + i.qty, 0)}
                </td>
                <td className="py-2 pr-4 font-medium">
                  {formatPrice(order.total)}
                </td>
                <td className="py-2">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_BADGE[order.orderStatus]}`}>
                    {STATUS_LABELS[order.orderStatus]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminCustomersPage() {
  const { isStaffOnly } = useAdminAuth();
  const router = useRouter();

  const [orders, setOrders]     = useState<Order[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [sortField, setSortField] = useState<SortField>("lastOrderDate");
  const [sortDir, setSortDir]   = useState<SortDir>("desc");
  const [expandedPhone, setExpandedPhone] = useState<string | null>(null);

  // Staff guard
  useEffect(() => {
    if (isStaffOnly) router.replace("/admin/dashboard");
  }, [isStaffOnly, router]);

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (isStaffOnly) return null;

  // ---- Derive customers ----
  const allCustomers = useMemo(() => deriveCustomers(orders), [orders]);

  // ---- Summary stats ----
  const totalCustomers  = allCustomers.length;
  const totalOrders     = orders.length;
  const repeatCustomers = allCustomers.filter((c) => c.orderCount >= 2).length;
  const avgOrderValue   = totalOrders > 0
    ? orders.reduce((s, o) => s + o.total, 0) / totalOrders
    : 0;

  // ---- Filter + sort ----
  const displayed = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = allCustomers.filter((c) =>
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );

    list = [...list].sort((a, b) => {
      let diff = 0;
      if (sortField === "orderCount") {
        diff = a.orderCount - b.orderCount;
      } else if (sortField === "totalSpent") {
        diff = a.totalSpent - b.totalSpent;
      } else {
        const at = a.lastOrderDate?.toDate().getTime() ?? 0;
        const bt = b.lastOrderDate?.toDate().getTime() ?? 0;
        diff = at - bt;
      }
      return sortDir === "asc" ? diff : -diff;
    });

    return list;
  }, [allCustomers, search, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  // ---- Render ----
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-400 mt-0.5">Derived from order history — no separate collection</p>
        </div>
        {allCustomers.length > 0 && (
          <button
            type="button"
            onClick={() => exportCSV(displayed)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 rounded-full border-4 border-brand-terracotta border-t-transparent animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="p-10 text-center text-sm text-gray-400">No customers yet</div>
      ) : (
        <>
          {/* ---- Summary cards ---- */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Unique Customers",  value: totalCustomers },
              { label: "Total Orders",      value: totalOrders },
              { label: "Repeat Customers",  value: repeatCustomers },
              { label: "Avg. Order Value",  value: formatPrice(Math.round(avgOrderValue)) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          {/* ---- Search ---- */}
          <input
            type="search"
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-brand-terracotta transition-colors"
          />

          {/* ---- Table ---- */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {displayed.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-400">
                No customers match your search
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">Name</th>
                      <th className="text-left px-4 py-3 font-semibold">Phone</th>
                      <th
                        className="text-center px-4 py-3 font-semibold cursor-pointer select-none hover:text-gray-700 transition-colors"
                        onClick={() => toggleSort("orderCount")}
                      >
                        Orders
                        <SortIcon field="orderCount" current={sortField} dir={sortDir} />
                      </th>
                      <th
                        className="text-left px-4 py-3 font-semibold cursor-pointer select-none hover:text-gray-700 transition-colors"
                        onClick={() => toggleSort("totalSpent")}
                      >
                        Total Spent
                        <SortIcon field="totalSpent" current={sortField} dir={sortDir} />
                      </th>
                      <th
                        className="text-left px-4 py-3 font-semibold cursor-pointer select-none hover:text-gray-700 transition-colors"
                        onClick={() => toggleSort("lastOrderDate")}
                      >
                        Last Order
                        <SortIcon field="lastOrderDate" current={sortField} dir={sortDir} />
                      </th>
                      <th className="text-left px-4 py-3 font-semibold">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map((customer) => {
                      const isExpanded = expandedPhone === customer.phone;
                      return (
                        <>
                          <tr
                            key={customer.phone}
                            onClick={() => setExpandedPhone(isExpanded ? null : customer.phone)}
                            className="border-t border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800">{customer.name}</span>
                                {customer.orderCount >= 2 && (
                                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-terracotta/10 text-brand-terracotta">
                                    Repeat
                                  </span>
                                )}
                              </div>
                              {customer.email && (
                                <p className="text-xs text-gray-400 mt-0.5">{customer.email}</p>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-gray-600">{customer.phone}</td>
                            <td className="px-4 py-3.5 text-center text-gray-700 font-semibold">
                              {customer.orderCount}
                            </td>
                            <td className="px-4 py-3.5 font-medium text-gray-700">
                              {formatPrice(customer.totalSpent)}
                            </td>
                            <td className="px-4 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                              {formatDate(customer.lastOrderDate)}
                            </td>
                            <td className="px-4 py-3.5 text-gray-600 text-xs">
                              {customer.city}, {customer.district}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${customer.phone}-detail`}>
                              <td colSpan={6} className="p-0">
                                <CustomerOrders customer={customer} />
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
