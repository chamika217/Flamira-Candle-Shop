"use client";

import {
  useEffect,
  useState,
  useMemo,
  type FormEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAllProductsAdmin, adjustStock } from "@/lib/productService";
import { getCategories } from "@/lib/categoryService";
import type { Product, Category } from "@/lib/types";
import type { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StockHistoryEntry {
  id: string;
  previousQty: number;
  newQty: number;
  change: number;
  reason: string;
  source: string;
  timestamp: Timestamp;
}

type StockFilter = "all" | "low" | "out";

// ---------------------------------------------------------------------------
// Stock status helper
// ---------------------------------------------------------------------------

type StockStatus =
  | { kind: "made_to_order" }
  | { kind: "in_stock" }
  | { kind: "low_stock" }
  | { kind: "out_of_stock" };

function getStockStatus(p: Product): StockStatus {
  if (p.isMadeToOrder)                             return { kind: "made_to_order" };
  if (p.stockQty === 0)                            return { kind: "out_of_stock" };
  if (p.stockQty <= p.lowStockThreshold)           return { kind: "low_stock" };
  return { kind: "in_stock" };
}

const STOCK_BADGE: Record<StockStatus["kind"], string> = {
  in_stock:     "bg-emerald-100 text-emerald-700",
  low_stock:    "bg-amber-100 text-amber-700",
  out_of_stock: "bg-red-100 text-red-600",
  made_to_order:"bg-blue-100 text-blue-700",
};
const STOCK_LABEL: Record<StockStatus["kind"], string> = {
  in_stock:     "In Stock",
  low_stock:    "Low Stock",
  out_of_stock: "Out of Stock",
  made_to_order:"Made to Order",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(ts: Timestamp | undefined): string {
  if (!ts) return "—";
  return ts.toDate().toLocaleString("en-LK", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Quick-adjust modal
// ---------------------------------------------------------------------------

function AdjustModal({
  product,
  onSave,
  onClose,
}: {
  product: Product;
  onSave: (newQty: number, reason: string) => Promise<void>;
  onClose: () => void;
}) {
  const [qty, setQty]       = useState(String(product.stockQty));
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-brand-terracotta transition-colors";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const newQty = parseInt(qty);
    if (isNaN(newQty) || newQty < 0) { setError("Enter a valid non-negative quantity."); return; }
    if (!reason.trim())              { setError("Reason is required."); return; }
    setError(null);
    setSaving(true);
    try {
      await onSave(newQty, reason);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
      setSaving(false);
    }
  }

  const change = parseInt(qty) - product.stockQty;
  const changeLabel = isNaN(change) ? "" : change > 0 ? `+${change}` : String(change);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Quick Adjust Stock</h2>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{product.title}</p>
        </div>

        {error && (
          <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              New Stock Quantity
            </label>
            <input
              type="number"
              min={0}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className={inputCls}
              autoFocus
            />
            {qty !== "" && !isNaN(parseInt(qty)) && parseInt(qty) !== product.stockQty && (
              <p className={`text-xs mt-1 font-medium ${change > 0 ? "text-emerald-600" : "text-red-500"}`}>
                Change: {changeLabel} (was {product.stockQty})
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Reason *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={inputCls}
              placeholder="e.g. Restock, Damaged, Recount"
            />
          </div>

          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose} disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-terracotta hover:bg-brand-terracotta-dark disabled:opacity-50 transition-colors">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stock history panel
// ---------------------------------------------------------------------------

function HistoryPanel({ productId }: { productId: string }) {
  const [entries, setEntries]   = useState<StockHistoryEntry[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "products", productId, "stockHistory"),
      orderBy("timestamp", "desc"),
      limit(10)
    );
    getDocs(q)
      .then((snap) => {
        setEntries(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as StockHistoryEntry))
        );
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [productId]);

  return (
    <div className="bg-gray-50 border-t border-gray-100 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
        Stock History (last 10)
      </p>
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 rounded-full border-4 border-brand-terracotta border-t-transparent animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-gray-400">No stock changes recorded yet.</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 uppercase tracking-wider">
              <th className="text-left pb-2 font-semibold">Date</th>
              <th className="text-left pb-2 font-semibold">Before</th>
              <th className="text-left pb-2 font-semibold">After</th>
              <th className="text-left pb-2 font-semibold">Change</th>
              <th className="text-left pb-2 font-semibold">Reason</th>
              <th className="text-left pb-2 font-semibold">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.map((e) => (
              <tr key={e.id} className="text-gray-600">
                <td className="py-2 pr-4 whitespace-nowrap">{formatDate(e.timestamp)}</td>
                <td className="py-2 pr-4">{e.previousQty}</td>
                <td className="py-2 pr-4">{e.newQty}</td>
                <td className={`py-2 pr-4 font-semibold ${e.change > 0 ? "text-emerald-600" : e.change < 0 ? "text-red-500" : "text-gray-400"}`}>
                  {e.change > 0 ? `+${e.change}` : e.change}
                </td>
                <td className="py-2 pr-4">{e.reason}</td>
                <td className="py-2 capitalize">{e.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminInventoryPage() {
  const [products, setProducts]   = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]     = useState(true);

  const [filter, setFilter]       = useState<StockFilter>("all");
  const [search, setSearch]       = useState("");

  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null);
  const [historyOpenId, setHistoryOpenId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getAllProductsAdmin().catch(() => [] as Product[]),
      getCategories().catch(() => [] as Category[]),
    ]).then(([p, c]) => {
      setProducts(p);
      setCategories(c);
      setLoading(false);
    });
  }, []);

  const categoryMap = useMemo(() => {
    const m: Record<string, string> = {};
    categories.forEach((c) => (m[c.id] = c.name));
    return m;
  }, [categories]);

  // ---- Derived stats ----
  const activeProducts  = products.filter((p) => p.status === "active").length;
  const lowStockCount   = products.filter((p) => !p.isMadeToOrder && p.stockQty > 0 && p.stockQty <= p.lowStockThreshold).length;
  const outOfStockCount = products.filter((p) => !p.isMadeToOrder && p.stockQty === 0).length;

  // ---- Filtered list ----
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      if (q && !p.title.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
      if (filter === "low") return !p.isMadeToOrder && p.stockQty > 0 && p.stockQty <= p.lowStockThreshold;
      if (filter === "out") return !p.isMadeToOrder && p.stockQty === 0;
      return true;
    });
  }, [products, filter, search]);

  // ---- Handle adjust save ----
  async function handleAdjustSave(newQty: number, reason: string) {
    if (!adjustTarget) return;
    await adjustStock(adjustTarget.id, newQty, reason);
    // Update local state so the row refreshes immediately
    setProducts((prev) =>
      prev.map((p) => p.id === adjustTarget.id ? { ...p, stockQty: newQty } : p)
    );
    setAdjustTarget(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-7 h-7 rounded-full border-4 border-brand-terracotta border-t-transparent animate-spin" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-gray-400 text-sm">No products yet</p>
        <Link href="/admin/products/new"
          className="px-4 py-2.5 rounded-lg bg-brand-terracotta text-white text-sm font-medium hover:bg-brand-terracotta-dark transition-colors">
          Add your first product
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <p className="text-sm text-gray-400 mt-0.5">Stock levels and manual adjustments</p>
      </div>

      {/* ---- Summary cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Active Products", value: activeProducts, color: "text-gray-900" },
          { label: "Low Stock",       value: lowStockCount,  color: "text-amber-600" },
          { label: "Out of Stock",    value: outOfStockCount, color: "text-red-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ---- Filters ---- */}
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search by title or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-brand-terracotta transition-colors"
        />
        <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
          {([ ["all", "All"], ["low", "Low Stock"], ["out", "Out of Stock"] ] as [StockFilter, string][]).map(([val, label]) => (
            <button key={val} type="button" onClick={() => setFilter(val)}
              className={[
                "px-4 py-2 text-sm font-medium transition-colors",
                filter === val
                  ? "bg-brand-terracotta text-white"
                  : "text-gray-600 hover:bg-gray-50",
              ].join(" ")}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ---- Table ---- */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">
            No products match your search / filter
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[750px]">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold w-14">Image</th>
                  <th className="text-left px-4 py-3 font-semibold">Product</th>
                  <th className="text-left px-4 py-3 font-semibold">Category</th>
                  <th className="text-center px-4 py-3 font-semibold">Stock</th>
                  <th className="text-center px-4 py-3 font-semibold">Threshold</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const isHistoryOpen = historyOpenId === product.id;

                  return (
                    <>
                      <tr
                        key={product.id}
                        className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                            {product.images[0] ? (
                              <Image
                                src={product.images[0]}
                                alt={product.title}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-400">
                                No img
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800 leading-snug line-clamp-1">{product.title}</p>
                          <p className="text-xs font-mono text-gray-400 mt-0.5">{product.sku}</p>
                        </td>

                        <td className="px-4 py-3 text-gray-600 text-sm">
                          {categoryMap[product.categoryId] ?? "—"}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm font-bold ${
                            product.stockQty === 0 ? "text-red-600" :
                            product.stockQty <= product.lowStockThreshold ? "text-amber-600" :
                            "text-gray-800"
                          }`}>
                            {product.isMadeToOrder ? "—" : product.stockQty}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center text-sm text-gray-500">
                          {product.isMadeToOrder ? "—" : product.lowStockThreshold}
                        </td>

                        <td className="px-4 py-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STOCK_BADGE[stockStatus.kind]}`}>
                            {STOCK_LABEL[stockStatus.kind]}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setAdjustTarget(product)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                              Adjust
                            </button>
                            <button
                              type="button"
                              onClick={() => setHistoryOpenId(isHistoryOpen ? null : product.id)}
                              className={[
                                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                isHistoryOpen
                                  ? "bg-brand-terracotta/10 text-brand-terracotta"
                                  : "text-gray-500 bg-gray-50 hover:bg-gray-100",
                              ].join(" ")}
                              aria-expanded={isHistoryOpen}
                            >
                              History
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isHistoryOpen && (
                        <tr key={`${product.id}-history`}>
                          <td colSpan={7} className="p-0">
                            <HistoryPanel productId={product.id} />
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

      {/* Adjust modal */}
      {adjustTarget && (
        <AdjustModal
          product={adjustTarget}
          onSave={handleAdjustSave}
          onClose={() => setAdjustTarget(null)}
        />
      )}
    </div>
  );
}
