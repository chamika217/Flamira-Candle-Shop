"use client";

import React, { useEffect, useState, useRef, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/categoryService";
import { uploadToCloudinary } from "@/lib/cloudinaryUpload";
import { useAdminAuth } from "@/context/AdminAuthContext";
import type { Category } from "@/lib/types";

// ---------------------------------------------------------------------------
// Default category seed data — Flamira's full category structure
// ---------------------------------------------------------------------------
type SeedEntry = { name: string; slug: string; sortOrder: number; children: { name: string; slug: string; sortOrder: number }[] };

const SEED_CATEGORIES: SeedEntry[] = [
  {
    name: "Home Décor", slug: "home-decor", sortOrder: 1,
    children: [
      { name: "Wall Art & Frames",       slug: "wall-art-frames",       sortOrder: 1 },
      { name: "Candles & Holders",        slug: "candles-holders",        sortOrder: 2 },
      { name: "Vases & Planters",         slug: "vases-planters",         sortOrder: 3 },
      { name: "Table & Shelf Décor",      slug: "table-shelf-decor",      sortOrder: 4 },
      { name: "Lighting & Fairy Lights",  slug: "lighting-fairy-lights",  sortOrder: 5 },
    ],
  },
  {
    name: "Gifts", slug: "gifts", sortOrder: 2,
    children: [
      { name: "Gift Boxes & Hampers",       slug: "gift-boxes-hampers",       sortOrder: 1 },
      { name: "Personalized Gifts",         slug: "personalized-gifts",        sortOrder: 2 },
      { name: "Couple & Anniversary Gifts", slug: "couple-anniversary-gifts",  sortOrder: 3 },
      { name: "Corporate & Bulk Gifting",   slug: "corporate-bulk-gifting",    sortOrder: 4 },
    ],
  },
  {
    name: "Handmade & Resin", slug: "handmade-resin", sortOrder: 3,
    children: [
      { name: "Resin Art",        slug: "resin-art",        sortOrder: 1 },
      { name: "Clay & Ceramic",   slug: "clay-ceramic",     sortOrder: 2 },
      { name: "Macramé & Fabric", slug: "macrame-fabric",   sortOrder: 3 },
    ],
  },
  {
    name: "Seasonal", slug: "seasonal", sortOrder: 4,
    children: [
      { name: "Avurudu Collection",       slug: "avurudu-collection",       sortOrder: 1 },
      { name: "Christmas & New Year",     slug: "christmas-new-year",       sortOrder: 2 },
      { name: "Valentine's Collection",   slug: "valentines-collection",    sortOrder: 3 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function slugify(str: string): string {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------
const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-brand-terracotta transition-colors";
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5";

// ---------------------------------------------------------------------------
// Category form (add / edit)
// ---------------------------------------------------------------------------
interface FormValues {
  name: string;
  slug: string;
  parentId: string; // "" means top-level (null)
  sortOrder: string;
  imageFile: File | null;
  existingImage: string;
}

function CategoryModal({
  initial,
  topLevelCategories,
  onSave,
  onClose,
}: {
  initial?: Category;
  topLevelCategories: Category[];
  onSave: (values: FormValues) => Promise<void>;
  onClose: () => void;
}) {
  const [values, setValues] = useState<FormValues>({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    parentId: initial?.parentId ?? "",
    sortOrder: String(initial?.sortOrder ?? ""),
    imageFile: null,
    existingImage: initial?.image ?? "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setValues((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "name" && !initial) next.slug = slugify(value);
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-md w-full flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-base font-semibold text-gray-900">
          {initial ? "Edit Category" : "Add Category"}
        </h2>

        {error && (
          <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Name *</label>
            <input name="name" type="text" value={values.name} onChange={handleChange}
              className={inputCls} placeholder="Candles & Holders" required />
          </div>

          <div>
            <label className={labelCls}>Slug</label>
            <div className="flex gap-2">
              <input name="slug" type="text" value={values.slug} onChange={handleChange}
                className={`${inputCls} flex-1`} placeholder="candles-holders" />
              <button type="button" onClick={() => setValues((p) => ({ ...p, slug: slugify(p.name) }))}
                className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap">
                Auto
              </button>
            </div>
          </div>

          <div>
            <label className={labelCls}>Parent Category</label>
            <select name="parentId" value={values.parentId} onChange={handleChange} className={inputCls}>
              <option value="">None (top-level)</option>
              {topLevelCategories
                .filter((c) => c.id !== initial?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Sort Order</label>
            <input name="sortOrder" type="number" min={0} value={values.sortOrder} onChange={handleChange}
              className={inputCls} placeholder="1" />
          </div>

          {/* Image upload */}
          <div>
            <label className={labelCls}>Image (optional)</label>
            {(values.existingImage || values.imageFile) && (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 mb-2">
                <Image
                  src={values.imageFile ? URL.createObjectURL(values.imageFile) : values.existingImage}
                  alt="Preview"
                  fill
                  className="object-cover"
                  sizes="80px"
                />
                <button type="button"
                  onClick={() => setValues((p) => ({ ...p, imageFile: null, existingImage: "" }))}
                  className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold hover:bg-red-600">
                  ✕
                </button>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setValues((p) => ({ ...p, imageFile: file, existingImage: file ? "" : p.existingImage }));
              }}
            />
            <button type="button" onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
              {uploading ? "Uploading…" : values.existingImage || values.imageFile ? "Change image" : "Upload image"}
            </button>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving || uploading}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-terracotta hover:bg-brand-terracotta-dark disabled:opacity-50 transition-colors">
              {saving ? "Saving…" : initial ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete confirmation dialog
// ---------------------------------------------------------------------------
function DeleteDialog({
  name,
  onConfirm,
  onCancel,
  loading,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full flex flex-col gap-4">
        <h2 className="text-base font-semibold text-gray-900">Delete category?</h2>
        <p className="text-sm text-gray-500">
          <span className="font-medium text-gray-800">{name}</span> will be permanently deleted.
          Products in this category won&apos;t be deleted but will need to be re-categorized.
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
// Seed confirmation dialog
// ---------------------------------------------------------------------------
function SeedDialog({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full flex flex-col gap-4">
        <h2 className="text-base font-semibold text-gray-900">Seed default categories?</h2>
        <p className="text-sm text-gray-500">
          This will create Flamira&apos;s full default category structure (4 parent categories + 15 sub-categories).
          Only do this once on a fresh database.
        </p>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onCancel} disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-terracotta hover:bg-brand-terracotta-dark disabled:opacity-50 transition-colors">
            {loading ? "Seeding…" : "Seed Categories"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category row
// ---------------------------------------------------------------------------
function CategoryRow({
  category,
  isChild,
  onEdit,
  onDelete,
}: {
  category: Category;
  isChild: boolean;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className={`flex items-center gap-3 ${isChild ? "pl-6" : ""}`}>
          {isChild && <span className="text-gray-300 shrink-0">└</span>}
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
            {category.image ? (
              <Image src={category.image} alt={category.name} width={40} height={40}
                className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-400">
                No img
              </div>
            )}
          </div>
          <span className={`font-medium text-gray-800 text-sm ${isChild ? "font-normal text-gray-600" : ""}`}>
            {category.name}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-xs font-mono text-gray-500">{category.slug}</td>
      <td className="px-4 py-3 text-sm text-gray-500 text-center">{category.sortOrder}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onEdit(category)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
            Edit
          </button>
          <button type="button" onClick={() => onDelete(category)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminCategoriesPage() {
  const { isStaffOnly } = useAdminAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);

  // Modal state
  const [modalOpen, setModalOpen]       = useState(false);
  const [editTarget, setEditTarget]     = useState<Category | undefined>(undefined);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting]         = useState(false);

  // Seed state
  const [seedDialogOpen, setSeedDialogOpen] = useState(false);
  const [seeding, setSeeding]               = useState(false);

  // Staff guard — redirect owners-only page
  useEffect(() => {
    if (isStaffOnly) router.replace("/admin/dashboard");
  }, [isStaffOnly, router]);

  function load() {
    setLoading(true);
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  if (isStaffOnly) return null; // redirect in progress

  // Derived
  const topLevel = categories.filter((c) => c.parentId === null);
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id);

  // ---- Save category (add or edit) ----
  async function handleSave(values: FormValues) {
    let imageUrl = values.existingImage;

    if (values.imageFile) {
      imageUrl = await uploadToCloudinary(values.imageFile);
    }

    const data: Omit<Category, "id"> = {
      name:      values.name.trim(),
      slug:      values.slug.trim() || slugify(values.name),
      parentId:  values.parentId || null,
      sortOrder: parseInt(values.sortOrder) || 0,
      ...(imageUrl ? { image: imageUrl } : {}),
    };

    if (editTarget) {
      await updateCategory(editTarget.id, data);
    } else {
      await createCategory(data);
    }

    setModalOpen(false);
    setEditTarget(undefined);
    load();
  }

  // ---- Delete ----
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } finally {
      setDeleting(false);
    }
  }

  // ---- Seed ----
  async function handleSeed() {
    setSeeding(true);
    try {
      for (let pi = 0; pi < SEED_CATEGORIES.length; pi++) {
        const parent = SEED_CATEGORIES[pi];
        const parentId = await createCategory({
          name:      parent.name,
          slug:      parent.slug,
          parentId:  null,
          sortOrder: parent.sortOrder,
        });
        for (const child of parent.children) {
          await createCategory({
            name:      child.name,
            slug:      child.slug,
            parentId:  parentId,
            sortOrder: child.sortOrder,
          });
        }
      }
    } finally {
      setSeeding(false);
      setSeedDialogOpen(false);
      load();
    }
  }

  // ---- Render ----
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-400 mt-0.5">{categories.length} total</p>
        </div>
        <div className="flex items-center gap-3">
          {categories.length === 0 && !loading && (
            <button type="button" onClick={() => setSeedDialogOpen(true)}
              className="px-4 py-2.5 rounded-lg border border-brand-terracotta text-brand-terracotta text-sm font-medium hover:bg-brand-terracotta/5 transition-colors">
              Seed Default Categories
            </button>
          )}
          <button type="button" onClick={() => { setEditTarget(undefined); setModalOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-terracotta text-white text-sm font-medium hover:bg-brand-terracotta-dark transition-colors">
            + Add Category
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center">
            <div className="w-7 h-7 rounded-full border-4 border-brand-terracotta border-t-transparent animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="p-10 flex flex-col items-center gap-4 text-center">
            <p className="text-gray-400 text-sm">No categories yet</p>
            <button type="button" onClick={() => setSeedDialogOpen(true)}
              className="px-4 py-2.5 rounded-lg bg-brand-terracotta text-white text-sm font-medium hover:bg-brand-terracotta-dark transition-colors">
              Seed Default Categories
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Slug</th>
                  <th className="text-center px-4 py-3 font-semibold w-24">Order</th>
                  <th className="text-left px-4 py-3 font-semibold w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topLevel.map((parent) => (
                  <React.Fragment key={parent.id}>
                    <CategoryRow
                      category={parent}
                      isChild={false}
                      onEdit={(c) => { setEditTarget(c); setModalOpen(true); }}
                      onDelete={setDeleteTarget}
                    />
                    {childrenOf(parent.id).map((child) => (
                      <CategoryRow
                        key={child.id}
                        category={child}
                        isChild
                        onEdit={(c) => { setEditTarget(c); setModalOpen(true); }}
                        onDelete={setDeleteTarget}
                      />
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {modalOpen && (
        <CategoryModal
          initial={editTarget}
          topLevelCategories={topLevel}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditTarget(undefined); }}
        />
      )}

      {/* Delete dialog */}
      {deleteTarget && (
        <DeleteDialog
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      {/* Seed dialog */}
      {seedDialogOpen && (
        <SeedDialog
          onConfirm={handleSeed}
          onCancel={() => setSeedDialogOpen(false)}
          loading={seeding}
        />
      )}
    </div>
  );
}
