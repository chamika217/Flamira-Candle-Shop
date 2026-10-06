"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles, Star, ArrowUp, ArrowDown, Trash2, Eye,
  CheckCircle2, Plus, Search, RefreshCw, LayoutGrid,
  Smartphone, Monitor, ShoppingBag, ArrowRight, Check, AlertCircle
} from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { getFeaturedProductsList, saveFeaturedProductsOrder, type FeaturedItem } from "@/lib/featuredService";
import type { Product } from "@/lib/types";

function formatPrice(n: number) {
  return `Rs. ${n.toLocaleString("en-LK")}`;
}

export default function FeaturedProductsControlPage() {
  const { isStaffOnly } = useAdminAuth();

  const [featuredItems, setFeaturedItems] = useState<FeaturedItem[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Product Selection Modal
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerCategory, setPickerCategory] = useState("all");

  // Preview Mode
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [activePreviewTab, setActivePreviewTab] = useState<string>("all");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getFeaturedProductsList();
      setFeaturedItems(data.featured);
      setAllProducts(data.allProducts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save changes
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = featuredItems.map((item) => ({
        productId: item.product.id,
        active: item.active,
      }));
      await saveFeaturedProductsOrder(payload);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save featured products.");
    } finally {
      setSaving(false);
    }
  };

  // Reordering
  const moveItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= featuredItems.length) return;

    const updated = [...featuredItems];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // re-assign order numbers
    const reordered = updated.map((it, idx) => ({ ...it, order: idx + 1 }));
    setFeaturedItems(reordered);
  };

  // Toggle active status
  const toggleActive = (productId: string) => {
    setFeaturedItems((prev) =>
      prev.map((it) => (it.product.id === productId ? { ...it, active: !it.active } : it))
    );
  };

  // Remove from featured
  const removeItem = (productId: string) => {
    setFeaturedItems((prev) =>
      prev.filter((it) => it.product.id !== productId).map((it, idx) => ({ ...it, order: idx + 1 }))
    );
  };

  // Add product from picker
  const addProductToFeatured = (prod: Product) => {
    if (featuredItems.some((it) => it.product.id === prod.id)) return;
    setFeaturedItems((prev) => [
      ...prev,
      {
        product: prod,
        order: prev.length + 1,
        active: true,
      },
    ]);
  };

  // Filter available products for picker
  const featuredIdsSet = useMemo(() => new Set(featuredItems.map((it) => it.product.id)), [featuredItems]);

  const availableProducts = useMemo(() => {
    const q = pickerSearch.toLowerCase().trim();
    return allProducts.filter((p) => {
      if (featuredIdsSet.has(p.id)) return false;
      if (pickerCategory !== "all" && p.categoryId !== pickerCategory) return false;
      if (q && !p.title.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allProducts, featuredIdsSet, pickerSearch, pickerCategory]);

  const activeFeaturedForPreview = useMemo(() => {
    return featuredItems.filter((it) => it.active).map((it) => it.product);
  }, [featuredItems]);

  if (isStaffOnly) return null;

  return (
    <div className="flex flex-col gap-8 pb-16 max-w-7xl mx-auto">
      {/* Top Banner & Action Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 text-brand-terracotta text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Storefront Showcase</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Featured Products Control</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Select, prioritize, and live-preview products featured on the Flamira Home Page Best Sellers showcase.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPickerModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-800 text-sm font-semibold hover:bg-gray-50 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 text-brand-terracotta" />
            <span>Add Products ({allProducts.length - featuredItems.length} available)</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all ${
              savedSuccess
                ? "bg-emerald-600 shadow-emerald-600/30"
                : "bg-brand-terracotta hover:bg-brand-terracotta-dark active:scale-95 disabled:opacity-50"
            }`}
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving…</span>
              </>
            ) : savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Saved & Live!</span>
              </>
            ) : (
              <span>Publish Changes</span>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* =========================================================================
            LEFT COLUMN (7 cols): Reorder & Enable/Disable List
        ========================================================================== */}
        <div className="xl:col-span-7 flex flex-col gap-4">
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">Featured Order & Priority</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Items at the top appear first on the Home Page. Use arrows to re-order.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-brand-terracotta/10 text-brand-terracotta font-bold text-xs">
                {featuredItems.filter((i) => i.active).length} Active on Home
              </span>
            </div>

            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-brand-terracotta border-t-transparent animate-spin" />
                <p className="text-sm text-gray-400">Loading featured products…</p>
              </div>
            ) : featuredItems.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-3">
                <AlertCircle className="w-10 h-10 text-amber-500" />
                <p className="text-sm text-gray-600 font-semibold">No featured products currently assigned.</p>
                <p className="text-xs text-gray-400 max-w-sm">
                  Click the button below to pick candles, wax tablets, or gift hampers from your catalog.
                </p>
                <button
                  type="button"
                  onClick={() => setShowPickerModal(true)}
                  className="mt-2 px-4 py-2 rounded-xl bg-brand-terracotta text-white text-xs font-bold"
                >
                  + Add Products to Featured
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {featuredItems.map((item, index) => {
                  const p = item.product;
                  const thumb = p.images[0] || "/Animation1.png";
                  const displayPrice = p.salePrice ?? p.price;
                  const hasSale = p.salePrice !== undefined && p.salePrice < p.price;

                  return (
                    <div
                      key={p.id}
                      className={`p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors ${
                        item.active ? "bg-white hover:bg-gray-50/60" : "bg-gray-50/60 opacity-60"
                      }`}
                    >
                      {/* Priority Badge & Drag Handlers */}
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveItem(index, "up")}
                            disabled={index === 0}
                            className="p-1 rounded-md text-gray-400 hover:text-brand-terracotta hover:bg-gray-100 disabled:opacity-20 transition-colors"
                            title="Move Up"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <span className="w-6 h-6 rounded-lg bg-gray-100 font-bold text-xs text-gray-700 flex items-center justify-center">
                            {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => moveItem(index, "down")}
                            disabled={index === featuredItems.length - 1}
                            className="p-1 rounded-md text-gray-400 hover:text-brand-terracotta hover:bg-gray-100 disabled:opacity-20 transition-colors"
                            title="Move Down"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Product Thumbnail */}
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-brand-ivory border border-gray-200 shrink-0">
                          <Image src={thumb} alt={p.title} fill className="object-cover" sizes="56px" />
                        </div>

                        {/* Product Title & Info */}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-1">{p.title}</h3>
                            {hasSale && (
                              <span className="px-1.5 py-0.5 rounded bg-brand-terracotta text-white text-[9px] font-extrabold uppercase">
                                Sale
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400 font-mono mt-0.5">
                            <span>{p.sku}</span>
                            <span>•</span>
                            <span className="capitalize">{p.categoryId}</span>
                          </div>
                          <p className="text-xs font-bold text-brand-terracotta mt-1">
                            {formatPrice(displayPrice)}
                            {hasSale && (
                              <span className="text-[11px] text-gray-400 line-through ml-1.5 font-normal">
                                {formatPrice(p.price)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Right Toggle & Delete Actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        {/* Enable/Disable Toggle */}
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <span className="text-xs font-semibold text-gray-500 hidden sm:inline">
                            {item.active ? "Visible" : "Hidden"}
                          </span>
                          <input
                            type="checkbox"
                            checked={item.active}
                            onChange={() => toggleActive(p.id)}
                            className="w-5 h-5 accent-brand-terracotta rounded cursor-pointer"
                          />
                        </label>

                        {/* Remove Action */}
                        <button
                          type="button"
                          onClick={() => removeItem(p.id)}
                          className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Remove from Featured"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN (5 cols): Interactive Live Storefront Preview
        ========================================================================== */}
        <div className="xl:col-span-5 flex flex-col gap-4 sticky top-6">
          <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-brand-terracotta" />
                <h2 className="text-sm font-bold text-gray-900">Live Home Page Preview</h2>
              </div>

              {/* Device Mode Switcher */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    previewDevice === "desktop" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-700"
                  }`}
                  title="Desktop Preview"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden sm:inline">Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    previewDevice === "mobile" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-700"
                  }`}
                  title="Mobile Preview"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden sm:inline">Mobile</span>
                </button>
              </div>
            </div>

            {/* Simulated Storefront Container */}
            <div
              className={`bg-brand-ivory/80 rounded-2xl border border-brand-border p-4 transition-all duration-300 mx-auto w-full ${
                previewDevice === "mobile" ? "max-w-[340px] shadow-lg" : "max-w-full"
              }`}
            >
              {/* Mini Section Header */}
              <div className="text-center mb-4">
                <span className="text-[10px] font-bold text-brand-terracotta uppercase tracking-wider">
                  Customer Favorites
                </span>
                <h3 className="font-serif text-base font-bold text-brand-brown">Best Selling Creations</h3>
                <p className="text-[10px] text-brand-stone mt-0.5">Handcrafted with patient artistry</p>
              </div>

              {/* Mini Product Cards Grid */}
              {activeFeaturedForPreview.length === 0 ? (
                <div className="py-10 text-center text-xs text-gray-400">
                  No active items to display in preview.
                </div>
              ) : (
                <div
                  className={`grid gap-3 ${
                    previewDevice === "mobile" ? "grid-cols-1" : "grid-cols-2"
                  }`}
                >
                  {activeFeaturedForPreview.slice(0, 4).map((product) => {
                    const thumb = product.images[0] || "/Animation1.png";
                    const displayPrice = product.salePrice ?? product.price;
                    const hasSale = product.salePrice !== undefined && product.salePrice < product.price;

                    return (
                      <div
                        key={product.id}
                        className="bg-white rounded-2xl border border-brand-border/70 overflow-hidden shadow-2xs flex flex-col justify-between group"
                      >
                        <div className="relative aspect-square w-full bg-brand-ivory">
                          <Image src={thumb} alt={product.title} fill className="object-cover" sizes="200px" />
                          {hasSale && (
                            <span className="absolute top-2 left-2 bg-brand-terracotta text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                              Sale
                            </span>
                          )}
                        </div>

                        <div className="p-3">
                          <div className="flex items-center gap-1 text-amber-500 mb-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                            ))}
                            <span className="text-[9px] text-gray-500 font-bold ml-1">5.0</span>
                          </div>

                          <p className="font-serif text-xs font-bold text-brand-brown leading-snug line-clamp-1">
                            {product.title}
                          </p>

                          <div className="mt-2 pt-2 border-t border-brand-border/50 flex items-center justify-between text-xs">
                            <span className="font-bold text-brand-terracotta text-xs">
                              {formatPrice(displayPrice)}
                            </span>
                            <span className="text-[10px] font-semibold text-brand-brown flex items-center gap-0.5">
                              Details <ArrowRight className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeFeaturedForPreview.length > 4 && (
                <p className="text-center text-[10px] text-gray-400 mt-3">
                  + {activeFeaturedForPreview.length - 4} more featured products displayed on the full homepage
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL: Product Catalog Picker
      ========================================================================== */}
      {showPickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowPickerModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col gap-5 z-10 animate-scale-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Add Products to Featured Showcase</h3>
                <p className="text-xs text-gray-400 mt-0.5">Select candles and décor to showcase on the home page.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPickerModal(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {/* Search and Category Filter */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  placeholder="Search products by title or SKU…"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-terracotta"
                />
              </div>

              <select
                value={pickerCategory}
                onChange={(e) => setPickerCategory(e.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-brand-terracotta"
              >
                <option value="all">All Categories</option>
                <option value="candles">Candles</option>
                <option value="decor">Décor & Sachets</option>
                <option value="gifts">Gift Sets & Hampers</option>
              </select>
            </div>

            {/* Catalog Grid */}
            {availableProducts.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-400">
                No matching available products found.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                {availableProducts.map((p) => {
                  const thumb = p.images[0] || "/Animation1.png";
                  return (
                    <div
                      key={p.id}
                      className="p-3 rounded-2xl border border-gray-200 hover:border-brand-terracotta hover:bg-brand-ivory/20 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                          <Image src={thumb} alt={p.title} fill className="object-cover" sizes="48px" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-xs line-clamp-1">{p.title}</p>
                          <p className="text-[11px] text-gray-400 font-mono">{p.sku}</p>
                          <p className="text-xs font-bold text-brand-terracotta mt-0.5">
                            {formatPrice(p.salePrice ?? p.price)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => addProductToFeatured(p)}
                        className="px-3 py-1.5 rounded-xl bg-brand-terracotta text-white text-xs font-bold hover:bg-brand-terracotta-dark shrink-0 shadow-xs"
                      >
                        + Add
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400 font-medium">{featuredItems.length} products currently selected</span>
              <button
                type="button"
                onClick={() => setShowPickerModal(false)}
                className="px-5 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-black"
              >
                Done Selecting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
