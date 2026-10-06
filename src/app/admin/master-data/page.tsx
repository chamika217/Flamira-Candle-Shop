"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Database, Tag, Layers, Palette, ListOrdered, ShieldCheck,
  Settings as SettingsIcon, Plus, Edit2, Trash2, CheckCircle2,
  RefreshCw, RotateCcw, Check, Sparkles, AlertCircle, Eye, ArrowRight
} from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getMasterData,
  saveMasterData,
  seedMasterData,
  DEFAULT_MASTER_DATA,
} from "@/lib/masterDataService";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/categoryService";
import type {
  MasterData,
  ProductSizeOption,
  ProductColorVariantOption,
  OrderStatusConfig,
  UserRoleDefinition,
  SystemConfig,
  Category,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Tabs Definition
// ---------------------------------------------------------------------------

type MasterTab = "categories" | "sizes" | "colors" | "statuses" | "roles" | "system";

export default function MasterDataPage() {
  const { isStaffOnly } = useAdminAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<MasterTab>("categories");
  const [masterData, setMasterData] = useState<MasterData>(DEFAULT_MASTER_DATA);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modal States for Add / Edit
  const [sizeModal, setSizeModal] = useState<{ open: boolean; item?: ProductSizeOption }>({ open: false });
  const [colorModal, setColorModal] = useState<{ open: boolean; item?: ProductColorVariantOption }>({ open: false });
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; item?: Category }>({ open: false });

  // System config state
  const [sysConfig, setSysConfig] = useState<SystemConfig>(DEFAULT_MASTER_DATA.systemConfig);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  // Guard: Staff members cannot access master data
  useEffect(() => {
    if (isStaffOnly) router.replace("/admin/dashboard");
  }, [isStaffOnly, router]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [md, cats] = await Promise.all([
        getMasterData(),
        getCategories().catch(() => [] as Category[]),
      ]);
      setMasterData(md);
      setSysConfig(md.systemConfig);
      setCategories(cats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Save System Config
  const handleSaveSystemConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveMasterData({ systemConfig: sysConfig });
      showToast("System configuration values saved successfully!");
      loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save system config.");
    } finally {
      setSaving(false);
    }
  };

  // Seed / Reset Master Data
  const handleSeedDefaults = async () => {
    if (!confirm("This will reset all master data configurations (sizes, colors, statuses, roles) to standard default templates. Proceed?")) {
      return;
    }
    setSaving(true);
    try {
      const seeded = await seedMasterData();
      setMasterData(seeded);
      setSysConfig(seeded.systemConfig);
      showToast("Master Data restored to defaults!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reset master data.");
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Sizes Handlers
  // ---------------------------------------------------------------------------
  const handleSaveSize = async (sizeData: Omit<ProductSizeOption, "id">, editId?: string) => {
    const updatedSizes = editId
      ? masterData.sizes.map((s) => (s.id === editId ? { ...sizeData, id: editId } : s))
      : [...masterData.sizes, { ...sizeData, id: `sz-${Date.now()}` }];

    await saveMasterData({ sizes: updatedSizes });
    setMasterData({ ...masterData, sizes: updatedSizes });
    setSizeModal({ open: false });
    showToast(editId ? "Product size updated!" : "New product size added!");
  };

  const handleDeleteSize = async (id: string) => {
    if (!confirm("Are you sure you want to delete this size option?")) return;
    const updated = masterData.sizes.filter((s) => s.id !== id);
    await saveMasterData({ sizes: updated });
    setMasterData({ ...masterData, sizes: updated });
    showToast("Size option deleted.");
  };

  const handleToggleSize = async (id: string) => {
    const updated = masterData.sizes.map((s) => (s.id === id ? { ...s, active: !s.active } : s));
    await saveMasterData({ sizes: updated });
    setMasterData({ ...masterData, sizes: updated });
  };

  // ---------------------------------------------------------------------------
  // Colors & Variants Handlers
  // ---------------------------------------------------------------------------
  const handleSaveColor = async (colorData: Omit<ProductColorVariantOption, "id">, editId?: string) => {
    const updatedColors = editId
      ? masterData.colorVariants.map((c) => (c.id === editId ? { ...colorData, id: editId } : c))
      : [...masterData.colorVariants, { ...colorData, id: `cv-${Date.now()}` }];

    await saveMasterData({ colorVariants: updatedColors });
    setMasterData({ ...masterData, colorVariants: updatedColors });
    setColorModal({ open: false });
    showToast(editId ? "Variant updated!" : "New variant added!");
  };

  const handleDeleteColor = async (id: string) => {
    if (!confirm("Are you sure you want to delete this color/scent variant?")) return;
    const updated = masterData.colorVariants.filter((c) => c.id !== id);
    await saveMasterData({ colorVariants: updated });
    setMasterData({ ...masterData, colorVariants: updated });
    showToast("Variant deleted.");
  };

  const handleToggleColor = async (id: string) => {
    const updated = masterData.colorVariants.map((c) => (c.id === id ? { ...c, active: !c.active } : c));
    await saveMasterData({ colorVariants: updated });
    setMasterData({ ...masterData, colorVariants: updated });
  };

  // ---------------------------------------------------------------------------
  // Category Handlers
  // ---------------------------------------------------------------------------
  const handleSaveCategory = async (name: string, slug: string, parentId: string | null, sortOrder: number, editId?: string) => {
    if (editId) {
      await updateCategory(editId, { name, slug, parentId, sortOrder });
      showToast("Category updated!");
    } else {
      await createCategory({ name, slug, parentId, sortOrder });
      showToast("New category created!");
    }
    setCategoryModal({ open: false });
    const fresh = await getCategories();
    setCategories(fresh);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category? Subcategories or products linked to it will need to be re-organized.")) return;
    await deleteCategory(id);
    showToast("Category deleted.");
    const fresh = await getCategories();
    setCategories(fresh);
  };

  if (isStaffOnly) return null;

  const topLevelCategories = categories.filter((c) => c.parentId === null);
  const subCategories = categories.filter((c) => c.parentId !== null);

  return (
    <div className="flex flex-col gap-6 pb-16 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-brown text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-semibold border border-brand-terracotta animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 text-brand-terracotta text-xs font-bold uppercase tracking-wider mb-1">
            <Database className="w-4 h-4" />
            <span>Central System Configuration</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Master Data Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Manage global categories, sizes, scent/color variants, order workflow statuses, and store parameters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSeedDefaults}
            disabled={saving}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 shadow-xs transition-colors"
            title="Reset to default preset values"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
            <span>Restore Defaults</span>
          </button>
          <button
            type="button"
            onClick={loadAll}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 shadow-xs transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Navigation Master Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 p-1.5 rounded-2xl bg-white border border-gray-200 shadow-xs">
        {[
          { id: "categories" as const, label: "Categories & Subs", icon: <Layers className="w-4 h-4" />, count: categories.length },
          { id: "sizes" as const, label: "Product Sizes", icon: <Tag className="w-4 h-4" />, count: masterData.sizes.length },
          { id: "colors" as const, label: "Colors & Variants", icon: <Palette className="w-4 h-4" />, count: masterData.colorVariants.length },
          { id: "statuses" as const, label: "Order Statuses", icon: <ListOrdered className="w-4 h-4" />, count: masterData.orderStatuses.length },
          { id: "roles" as const, label: "User Roles", icon: <ShieldCheck className="w-4 h-4" />, count: masterData.roles.length },
          { id: "system" as const, label: "System Config", icon: <SettingsIcon className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-brand-terracotta text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* =========================================================================
          TAB 1: Categories & Subcategories
      ========================================================================== */}
      {activeTab === "categories" && (
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">Product Categories & Hierarchies</h2>
                <p className="text-xs text-gray-400 mt-0.5">Define top-level store departments and nested sub-categories.</p>
              </div>
              <button
                type="button"
                onClick={() => setCategoryModal({ open: true })}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-terracotta text-white font-bold text-xs hover:bg-brand-terracotta-dark shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {topLevelCategories.map((parent) => {
                const subs = subCategories.filter((s) => s.parentId === parent.id);
                return (
                  <div key={parent.id} className="p-5 flex flex-col gap-3 hover:bg-gray-50/50 transition-colors">
                    {/* Parent Row */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-lg bg-brand-terracotta/10 text-brand-terracotta font-bold text-xs uppercase">
                          Parent
                        </span>
                        <h3 className="font-bold text-gray-900 text-sm">{parent.name}</h3>
                        <span className="text-xs text-gray-400 font-mono">slug: {parent.slug}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCategoryModal({ open: true, item: parent })}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-gray-100"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(parent.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Subcategories Grid */}
                    {subs.length > 0 && (
                      <div className="ml-8 pl-4 border-l-2 border-brand-terracotta/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                        {subs.map((sub) => (
                          <div
                            key={sub.id}
                            className="bg-white p-2.5 rounded-xl border border-gray-200/80 flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <div>
                              <p className="font-semibold text-gray-800 text-xs">{sub.name}</p>
                              <p className="text-[10px] text-gray-400 font-mono">{sub.slug}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setCategoryModal({ open: true, item: sub })}
                                className="p-1 text-gray-400 hover:text-indigo-600"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(sub.id)}
                                className="p-1 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: Product Sizes & Dimensions
      ========================================================================== */}
      {activeTab === "sizes" && (
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Configurable Product Sizes</h2>
              <p className="text-xs text-gray-400 mt-0.5">Standard sizes, candle jar volumes, and wax weights used in product variants.</p>
            </div>
            <button
              type="button"
              onClick={() => setSizeModal({ open: true })}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-terracotta text-white font-bold text-xs hover:bg-brand-terracotta-dark shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Size Option</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold">Size Label</th>
                  <th className="text-left px-5 py-3.5 font-semibold">Code / Suffix</th>
                  <th className="text-left px-5 py-3.5 font-semibold">Weight</th>
                  <th className="text-left px-5 py-3.5 font-semibold">Description</th>
                  <th className="text-center px-5 py-3.5 font-semibold">Active</th>
                  <th className="text-right px-5 py-3.5 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {masterData.sizes.map((sz) => (
                  <tr key={sz.id} className="hover:bg-gray-50/80">
                    <td className="px-5 py-4 font-bold text-gray-900">{sz.name}</td>
                    <td className="px-5 py-4 font-mono font-semibold text-brand-terracotta text-xs">{sz.code}</td>
                    <td className="px-5 py-4 text-gray-700 font-medium">{sz.weightGrams ? `${sz.weightGrams}g` : "—"}</td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{sz.description || "—"}</td>
                    <td className="px-5 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={sz.active}
                        onChange={() => handleToggleSize(sz.id)}
                        className="w-4 h-4 accent-brand-terracotta rounded cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSizeModal({ open: true, item: sz })}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-gray-100"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSize(sz.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: Product Colors & Scent Variants
      ========================================================================== */}
      {activeTab === "colors" && (
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Colors, Finishes & Fragrance Variants</h2>
              <p className="text-xs text-gray-400 mt-0.5">Manage artisanal scent formulas, resin finishes, and clay container tones.</p>
            </div>
            <button
              type="button"
              onClick={() => setColorModal({ open: true })}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-terracotta text-white font-bold text-xs hover:bg-brand-terracotta-dark shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Variant</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {masterData.colorVariants.map((cv) => (
              <div
                key={cv.id}
                className="p-4 rounded-2xl border border-gray-200 bg-white hover:shadow-sm flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {cv.colorHex && (
                        <span
                          className="w-5 h-5 rounded-full border border-gray-300 shadow-2xs shrink-0"
                          style={{ backgroundColor: cv.colorHex }}
                        />
                      )}
                      <span className="font-bold text-gray-900 text-sm">{cv.name}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-bold text-gray-600">
                      {cv.scentFamily || "General"}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-2">{cv.description || "No description provided."}</p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cv.active}
                      onChange={() => handleToggleColor(cv.id)}
                      className="accent-brand-terracotta w-4 h-4"
                    />
                    <span>{cv.active ? "Active" : "Disabled"}</span>
                  </label>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setColorModal({ open: true, item: cv })}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-gray-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteColor(cv.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: Order Statuses & Lifecycle
      ========================================================================== */}
      {activeTab === "statuses" && (
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">Order Lifecycle & Workflow Statuses</h2>
            <p className="text-xs text-gray-400 mt-0.5">Configurable order pipeline progression and tracking labels.</p>
          </div>

          <div className="divide-y divide-gray-100">
            {masterData.orderStatuses.map((st, idx) => (
              <div key={st.key} className="p-5 flex items-center justify-between gap-4 flex-wrap hover:bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <span className="w-7 h-7 rounded-lg bg-gray-100 text-gray-600 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${st.badgeBg} ${st.badgeText}`}>
                        {st.label}
                      </span>
                      <span className="text-xs font-mono text-gray-400">key: {st.key}</span>
                      {st.isTerminal && (
                        <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          Restores Inventory Stock
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{st.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: User Roles & Permissions
      ========================================================================== */}
      {activeTab === "roles" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {masterData.roles.map((role) => (
            <div key={role.id} className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-3 py-1 rounded-full bg-brand-terracotta/10 text-brand-terracotta text-xs font-bold uppercase">
                    {role.key}
                  </span>
                  <span className="text-xs font-mono text-gray-400">{role.permissions.length} Permissions</span>
                </div>
                <h3 className="text-base font-bold text-gray-900">{role.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{role.description}</p>

                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-1.5">
                  {role.permissions.map((perm) => (
                    <span key={perm} className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-[11px] font-mono">
                      ✓ {perm.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =========================================================================
          TAB 6: System Configuration Values
      ========================================================================== */}
      {activeTab === "system" && (
        <form onSubmit={handleSaveSystemConfig} className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm flex flex-col gap-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900">System Global Configuration</h2>
            <p className="text-xs text-gray-400 mt-0.5">Parameters for store identity, checkout fees, currency, and stock alerts.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Store Name *</label>
              <input
                type="text"
                required
                value={sysConfig.storeName}
                onChange={(e) => setSysConfig({ ...sysConfig, storeName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-terracotta"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Brand Tagline</label>
              <input
                type="text"
                value={sysConfig.tagline}
                onChange={(e) => setSysConfig({ ...sysConfig, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-terracotta"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Currency Symbol</label>
              <input
                type="text"
                value={sysConfig.currency}
                onChange={(e) => setSysConfig({ ...sysConfig, currency: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-brand-terracotta"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Contact Email *</label>
              <input
                type="email"
                required
                value={sysConfig.contactEmail}
                onChange={(e) => setSysConfig({ ...sysConfig, contactEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-terracotta"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Contact Phone</label>
              <input
                type="text"
                value={sysConfig.contactPhone}
                onChange={(e) => setSysConfig({ ...sysConfig, contactPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-terracotta"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">WhatsApp Order Support</label>
              <input
                type="text"
                value={sysConfig.whatsappNumber}
                onChange={(e) => setSysConfig({ ...sysConfig, whatsappNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-terracotta"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Order Number Prefix</label>
              <input
                type="text"
                value={sysConfig.orderPrefix}
                onChange={(e) => setSysConfig({ ...sysConfig, orderPrefix: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-brand-terracotta"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Standard Delivery Fee (Rs.)</label>
              <input
                type="number"
                min={0}
                value={sysConfig.standardDeliveryFee}
                onChange={(e) => setSysConfig({ ...sysConfig, standardDeliveryFee: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-terracotta"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Free Delivery Threshold (Rs.)</label>
              <input
                type="number"
                min={0}
                value={sysConfig.freeDeliveryThreshold}
                onChange={(e) => setSysConfig({ ...sysConfig, freeDeliveryThreshold: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-terracotta"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-brand-terracotta text-white font-bold text-sm hover:bg-brand-terracotta-dark shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save System Values"}
            </button>
          </div>
        </form>
      )}

      {/* =========================================================================
          MODAL: Size Modal
      ========================================================================== */}
      {sizeModal.open && (
        <SizeFormModal
          initial={sizeModal.item}
          onSave={handleSaveSize}
          onClose={() => setSizeModal({ open: false })}
        />
      )}

      {/* =========================================================================
          MODAL: Color / Variant Modal
      ========================================================================== */}
      {colorModal.open && (
        <ColorFormModal
          initial={colorModal.item}
          onSave={handleSaveColor}
          onClose={() => setColorModal({ open: false })}
        />
      )}

      {/* =========================================================================
          MODAL: Category Modal
      ========================================================================== */}
      {categoryModal.open && (
        <CategoryFormModal
          initial={categoryModal.item}
          topLevelCategories={topLevelCategories}
          onSave={handleSaveCategory}
          onClose={() => setCategoryModal({ open: false })}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-Modals
// ---------------------------------------------------------------------------

function SizeFormModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: ProductSizeOption;
  onSave: (data: Omit<ProductSizeOption, "id">, editId?: string) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [weightGrams, setWeightGrams] = useState(initial?.weightGrams ? String(initial.weightGrams) : "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    setSaving(true);
    await onSave(
      {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        weightGrams: weightGrams ? parseFloat(weightGrams) : undefined,
        description: description.trim(),
        sortOrder: 1,
        active,
      },
      initial?.id
    );
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full flex flex-col gap-4 z-10">
        <h3 className="text-lg font-bold text-gray-900">{initial ? "Edit Size Option" : "Add Size Option"}</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">Size Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Classic Amber Jar (200g)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-terracotta"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">SKU Suffix / Code *</label>
            <input
              type="text"
              required
              placeholder="e.g. 200G"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-brand-terracotta"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">Weight (Grams)</label>
            <input
              type="number"
              placeholder="e.g. 200"
              value={weightGrams}
              onChange={(e) => setWeightGrams(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-terracotta"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">Description</label>
            <input
              type="text"
              placeholder="e.g. ~40 hrs burn time, single wick"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-terracotta"
            />
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-gray-100 text-xs font-semibold">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-brand-terracotta text-white text-xs font-bold">
              {saving ? "Saving…" : "Save Size"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ColorFormModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: ProductColorVariantOption;
  onSave: (data: Omit<ProductColorVariantOption, "id">, editId?: string) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [colorHex, setColorHex] = useState(initial?.colorHex ?? "#B85D3D");
  const [scentFamily, setScentFamily] = useState(initial?.scentFamily ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSave(
      {
        name: name.trim(),
        colorHex,
        scentFamily: scentFamily.trim(),
        description: description.trim(),
        sortOrder: 1,
        active,
      },
      initial?.id
    );
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full flex flex-col gap-4 z-10">
        <h3 className="text-lg font-bold text-gray-900">{initial ? "Edit Variant" : "Add Color / Scent Variant"}</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">Variant Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. French Lavender & Wild Chamomile"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-terracotta"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">Swatch Color Hex</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="w-10 h-10 rounded-xl border border-gray-200 p-1 cursor-pointer"
              />
              <input
                type="text"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-brand-terracotta"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">Scent / Material Family</label>
            <input
              type="text"
              placeholder="e.g. Floral & Calming, Woodsy, Gold Resin"
              value={scentFamily}
              onChange={(e) => setScentFamily(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-terracotta"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">Notes / Description</label>
            <input
              type="text"
              placeholder="e.g. Pure essential oils with soothing notes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-terracotta"
            />
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-gray-100 text-xs font-semibold">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-brand-terracotta text-white text-xs font-bold">
              {saving ? "Saving…" : "Save Variant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CategoryFormModal({
  initial,
  topLevelCategories,
  onSave,
  onClose,
}: {
  initial?: Category;
  topLevelCategories: Category[];
  onSave: (name: string, slug: string, parentId: string | null, sortOrder: number, editId?: string) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [parentId, setParentId] = useState(initial?.parentId ?? "");
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 1));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSave(
      name.trim(),
      slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      parentId ? parentId : null,
      parseInt(sortOrder) || 1,
      initial?.id
    );
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full flex flex-col gap-4 z-10">
        <h3 className="text-lg font-bold text-gray-900">{initial ? "Edit Category" : "Add Category"}</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Scented Candles"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!initial) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-terracotta"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-brand-terracotta"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">Parent Category</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-terracotta"
            >
              <option value="">None (Top-Level Category)</option>
              {topLevelCategories
                .filter((c) => c.id !== initial?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">Sort Order</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-terracotta"
            />
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-gray-100 text-xs font-semibold">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-brand-terracotta text-white text-xs font-bold">
              {saving ? "Saving…" : "Save Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
