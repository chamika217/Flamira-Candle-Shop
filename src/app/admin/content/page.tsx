"use client";

import {
  useEffect, useState, useRef,
  type ChangeEvent, type FormEvent,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { getSettings, updateSettings } from "@/lib/settingsService";
import { getAllProductsAdmin } from "@/lib/productService";
import { uploadToCloudinary } from "@/lib/cloudinaryUpload";
import {
  getCoupons, createCoupon, updateCoupon, deleteCoupon,
} from "@/lib/couponService";
import type { Settings, Product, Coupon, CouponType } from "@/lib/types";

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------
const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-brand-terracotta transition-colors";
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 flex flex-col gap-5">
      <h2 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-3">{title}</h2>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete confirmation dialog
// ---------------------------------------------------------------------------
function DeleteDialog({ name, onConfirm, onCancel, loading }: {
  name: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full flex flex-col gap-4">
        <h3 className="text-base font-semibold text-gray-900">Delete coupon?</h3>
        <p className="text-sm text-gray-500">
          Coupon <span className="font-mono font-semibold text-gray-800">{name}</span> will be permanently deleted.
        </p>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onCancel} disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors">
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
type Tab = "banner" | "featured" | "coupons";

// ---------------------------------------------------------------------------
// Banner section
// ---------------------------------------------------------------------------
function BannerSection({ settings, onSaved }: { settings: Settings; onSaved: () => void }) {
  const [imageFile, setImageFile]     = useState<File | null>(null);
  const [headline, setHeadline]       = useState(settings.bannerHeadline ?? "");
  const [subtext, setSubtext]         = useState(settings.bannerSubtext ?? "");
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const fileRef                       = useRef<HTMLInputElement>(null);

  const previewUrl = imageFile
    ? URL.createObjectURL(imageFile)
    : settings.bannerImageUrl ?? null;

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      let imageUrl = settings.bannerImageUrl;
      if (imageFile) imageUrl = await uploadToCloudinary(imageFile);
      await updateSettings({
        bannerImageUrl: imageUrl,
        bannerHeadline: headline.trim() || undefined,
        bannerSubtext:  subtext.trim()  || undefined,
      });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Hero Banner">
      <form onSubmit={handleSave} className="flex flex-col gap-5">
        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        {/* Image preview + upload */}
        <div>
          <label className={labelCls}>Banner Image</label>
          {previewUrl && (
            <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden border border-gray-200 mb-3">
              <Image src={previewUrl} alt="Banner preview" fill className="object-cover" sizes="600px" />
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
          <button type="button" onClick={() => fileRef.current?.click()}
            className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors">
            {previewUrl ? "Change image" : "Upload image"}
          </button>
          {imageFile && (
            <button type="button" onClick={() => setImageFile(null)}
              className="ml-2 text-xs text-gray-400 hover:text-gray-600 underline transition-colors">
              Remove
            </button>
          )}
        </div>

        {/* Headline */}
        <div>
          <label className={labelCls}>Headline</label>
          <input type="text" value={headline} onChange={(e) => setHeadline(e.target.value)}
            className={inputCls} placeholder="Handmade Home Décor & Gifts, Delivered Island-Wide" />
          <p className="text-xs text-gray-400 mt-1">Leave blank to use the default hardcoded headline.</p>
        </div>

        {/* Subtext */}
        <div>
          <label className={labelCls}>Subtext</label>
          <textarea rows={2} value={subtext} onChange={(e) => setSubtext(e.target.value)}
            className={`${inputCls} resize-none`}
            placeholder="Lovingly crafted in Sri Lanka — Cash on Delivery available island-wide." />
          <p className="text-xs text-gray-400 mt-1">Leave blank to use the default hardcoded subtext.</p>
        </div>

        <button type="submit" disabled={saving}
          className={[
            "self-start px-6 py-2.5 rounded-lg text-sm font-medium transition-colors",
            saved ? "bg-emerald-600 text-white"
              : "bg-brand-terracotta text-white hover:bg-brand-terracotta-dark disabled:opacity-60 disabled:cursor-not-allowed",
          ].join(" ")}>
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save Banner"}
        </button>
      </form>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Featured products section
// ---------------------------------------------------------------------------
function FeaturedSection({ settings, products, onSaved }: {
  settings: Settings; products: Product[]; onSaved: () => void;
}) {
  const [checked, setChecked]   = useState<Set<string>>(new Set(settings.featuredProductIds ?? []));
  const [search, setSearch]     = useState("");
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const filtered = products.filter((p) =>
    !search || p.title.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true); setError(null);
    try {
      await updateSettings({ featuredProductIds: Array.from(checked) });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Featured Products (Best Sellers)">
      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      <p className="text-xs text-gray-400 -mt-2">
        {checked.size} selected — shown on the Home page Best Sellers section.
        If none are selected, products with &ldquo;Is Featured&rdquo; checked are used instead.
      </p>

      <input type="search" placeholder="Filter by title…" value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-brand-terracotta transition-colors" />

      <div className="max-h-96 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-400 p-4 text-center">No products found</p>
        ) : filtered.map((p) => (
          <label key={p.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
            <input type="checkbox" checked={checked.has(p.id)} onChange={() => toggle(p.id)}
              className="w-4 h-4 accent-brand-terracotta shrink-0" />
            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
              {p.images[0] ? (
                <Image src={p.images[0]} alt={p.title} fill className="object-cover" sizes="40px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-400">No img</div>
              )}
            </div>
            <span className="text-sm text-gray-800 leading-snug line-clamp-1">{p.title}</span>
            {checked.has(p.id) && (
              <span className="ml-auto shrink-0 text-[10px] font-semibold text-brand-terracotta">Selected</span>
            )}
          </label>
        ))}
      </div>

      <button type="button" onClick={handleSave} disabled={saving}
        className={[
          "self-start px-6 py-2.5 rounded-lg text-sm font-medium transition-colors",
          saved ? "bg-emerald-600 text-white"
            : "bg-brand-terracotta text-white hover:bg-brand-terracotta-dark disabled:opacity-60 disabled:cursor-not-allowed",
        ].join(" ")}>
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save Featured Selection"}
      </button>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Add Coupon form
// ---------------------------------------------------------------------------

const EMPTY_COUPON_FORM = {
  code: "", type: "percentage" as CouponType, value: "", minOrderValue: "",
  usageLimit: "", validFrom: "", validTo: "", freeDelivery: false, active: true,
};

function AddCouponForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm]     = useState(EMPTY_COUPON_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const t = e.target;
    if (t instanceof HTMLInputElement && t.type === "checkbox") {
      setForm((p) => ({ ...p, [t.name]: t.checked }));
    } else {
      const val = t.name === "code" ? t.value.toUpperCase() : t.value;
      setForm((p) => ({ ...p, [t.name]: val }));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.code.trim()) { setError("Code is required."); return; }
    if (!form.value || isNaN(parseFloat(form.value))) { setError("Value is required."); return; }
    if (!form.validFrom || !form.validTo) { setError("Valid From and Valid To are required."); return; }
    setSaving(true); setError(null);
    try {
      await createCoupon({
        code:          form.code.trim().toUpperCase(),
        type:          form.type,
        value:         parseFloat(form.value),
        minOrderValue: form.minOrderValue ? parseFloat(form.minOrderValue) : undefined,
        usageLimit:    form.usageLimit    ? parseInt(form.usageLimit)      : undefined,
        validFrom:     Timestamp.fromDate(new Date(form.validFrom)),
        validTo:       Timestamp.fromDate(new Date(form.validTo)),
        freeDelivery:  form.freeDelivery || undefined,
        active:        form.active,
      });
      setForm(EMPTY_COUPON_FORM);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-gray-50 rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-semibold text-gray-600">New Coupon</p>
      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Code *</label>
          <input name="code" type="text" value={form.code} onChange={handleChange}
            className={inputCls} placeholder="SAVE10" />
        </div>
        <div>
          <label className={labelCls}>Type *</label>
          <select name="type" value={form.type} onChange={handleChange} className={inputCls}>
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed (Rs.)</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Value *</label>
          <input name="value" type="number" min={0} value={form.value} onChange={handleChange}
            className={inputCls} placeholder={form.type === "percentage" ? "10" : "500"} />
        </div>
        <div>
          <label className={labelCls}>Min Order Value (Rs.)</label>
          <input name="minOrderValue" type="number" min={0} value={form.minOrderValue} onChange={handleChange}
            className={inputCls} placeholder="Optional" />
        </div>
        <div>
          <label className={labelCls}>Usage Limit</label>
          <input name="usageLimit" type="number" min={1} value={form.usageLimit} onChange={handleChange}
            className={inputCls} placeholder="Unlimited" />
        </div>
        <div>
          <label className={labelCls}>Valid From *</label>
          <input name="validFrom" type="date" value={form.validFrom} onChange={handleChange} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Valid To *</label>
          <input name="validTo" type="date" value={form.validTo} onChange={handleChange} className={inputCls} />
        </div>
        <div className="flex flex-col gap-2.5 pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input name="freeDelivery" type="checkbox" checked={form.freeDelivery} onChange={handleChange}
              className="w-4 h-4 accent-brand-terracotta" />
            <span className="text-sm text-gray-700">Free Delivery</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input name="active" type="checkbox" checked={form.active} onChange={handleChange}
              className="w-4 h-4 accent-brand-terracotta" />
            <span className="text-sm text-gray-700">Active</span>
          </label>
        </div>
      </div>
      <button type="submit" disabled={saving}
        className="self-start px-5 py-2 rounded-lg text-sm font-medium text-white bg-brand-terracotta hover:bg-brand-terracotta-dark disabled:opacity-60 transition-colors">
        {saving ? "Creating…" : "Create Coupon"}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Coupons section
// ---------------------------------------------------------------------------
function CouponsSection({ coupons, onRefresh }: { coupons: Coupon[]; onRefresh: () => void }) {
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const [togglingId, setTogglingId]     = useState<string | null>(null);
  const [showForm, setShowForm]         = useState(false);

  async function handleToggle(c: Coupon) {
    setTogglingId(c.id);
    try {
      await updateCoupon(c.id, { active: !c.active });
      onRefresh();
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCoupon(deleteTarget.id);
      setDeleteTarget(null);
      onRefresh();
    } finally {
      setDeleting(false);
    }
  }

  function formatDate(ts: { toDate: () => Date }) {
    return ts.toDate().toLocaleDateString("en-LK", { day: "numeric", month: "short", year: "numeric" });
  }

  function formatValue(c: Coupon) {
    return c.type === "percentage" ? `${c.value}% off` : `Rs. ${c.value.toLocaleString("en-LK")} off`;
  }

  return (
    <SectionCard title="Coupon Codes">
      <div className="flex justify-end">
        <button type="button" onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-terracotta hover:bg-brand-terracotta-dark transition-colors">
          {showForm ? "Cancel" : "+ Add Coupon"}
        </button>
      </div>

      {showForm && (
        <AddCouponForm onCreated={() => { setShowForm(false); onRefresh(); }} />
      )}

      {coupons.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No coupons yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Code</th>
                <th className="text-left px-4 py-3 font-semibold">Value</th>
                <th className="text-left px-4 py-3 font-semibold">Min Order</th>
                <th className="text-left px-4 py-3 font-semibold">Usage</th>
                <th className="text-left px-4 py-3 font-semibold">Valid</th>
                <th className="text-left px-4 py-3 font-semibold">Flags</th>
                <th className="text-left px-4 py-3 font-semibold">Active</th>
                <th className="px-4 py-3 font-semibold w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-gray-800">{c.code}</td>
                  <td className="px-4 py-3 text-gray-700">{formatValue(c)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {c.minOrderValue ? `Rs. ${c.minOrderValue.toLocaleString("en-LK")}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {c.usedCount}{c.usageLimit !== undefined ? ` / ${c.usageLimit}` : ""}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {formatDate(c.validFrom)} – {formatDate(c.validTo)}
                  </td>
                  <td className="px-4 py-3">
                    {c.freeDelivery && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                        Free Delivery
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={c.active}
                      onClick={() => handleToggle(c)}
                      disabled={togglingId === c.id}
                      className={[
                        "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors disabled:opacity-50",
                        c.active ? "bg-emerald-500" : "bg-gray-200",
                      ].join(" ")}
                    >
                      <span className={[
                        "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform",
                        c.active ? "translate-x-4" : "translate-x-0",
                      ].join(" ")} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => setDeleteTarget(c)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <DeleteDialog
          name={deleteTarget.code}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminContentPage() {
  const { isStaffOnly }     = useAdminAuth();
  const router              = useRouter();
  const [tab, setTab]       = useState<Tab>("banner");
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons]   = useState<Coupon[]>([]);

  useEffect(() => {
    if (isStaffOnly) router.replace("/admin/dashboard");
  }, [isStaffOnly, router]);

  async function load() {
    const [s, p, c] = await Promise.all([
      import("@/lib/settingsService").then((m) => m.getSettings()),
      getAllProductsAdmin().catch(() => [] as Product[]),
      getCoupons().catch(() => [] as Coupon[]),
    ]);
    setSettings(s);
    setProducts(p);
    setCoupons(c);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  if (isStaffOnly) return null;

  const TABS: { key: Tab; label: string }[] = [
    { key: "banner",   label: "Hero Banner" },
    { key: "featured", label: "Featured Products" },
    { key: "coupons",  label: "Coupons" },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Content & Promotions</h1>
        <p className="text-sm text-gray-400 mt-0.5">Hero banner, featured products, and coupon codes</p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white w-fit">
        {TABS.map(({ key, label }) => (
          <button key={key} type="button" onClick={() => setTab(key)}
            className={[
              "px-5 py-2.5 text-sm font-medium transition-colors",
              tab === key
                ? "bg-brand-terracotta text-white"
                : "text-gray-600 hover:bg-gray-50",
            ].join(" ")}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 rounded-full border-4 border-brand-terracotta border-t-transparent animate-spin" />
        </div>
      ) : !settings ? (
        <p className="text-sm text-red-600">Failed to load settings.</p>
      ) : (
        <>
          {tab === "banner" && (
            <BannerSection settings={settings} onSaved={load} />
          )}
          {tab === "featured" && (
            <FeaturedSection settings={settings} products={products} onSaved={load} />
          )}
          {tab === "coupons" && (
            <CouponsSection coupons={coupons} onRefresh={load} />
          )}
        </>
      )}
    </div>
  );
}
