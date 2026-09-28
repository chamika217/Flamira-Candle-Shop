"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ChangeEvent,
  type FormEvent,
  type DragEvent,
} from "react";
import Image from "next/image";
import { getCategories } from "@/lib/categoryService";
import { uploadMultipleToCloudinary } from "@/lib/cloudinaryUpload";
import type { Product, Category, ProductStatus } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProductDraft = Omit<Product, "id" | "createdAt" | "updatedAt">;

export interface ProductFormProps {
  initialData?: Product;
  onSubmit: (data: ProductDraft) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------
// Shared field/input styles
// ---------------------------------------------------------------------------
const inputCls =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-brand-terracotta transition-colors";
const errorInputCls =
  "w-full rounded-lg border border-red-400 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-red-500 transition-colors";
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5";

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {required && <span className="text-brand-terracotta ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">
      {children}
    </h2>
  );
}

// ---------------------------------------------------------------------------
// Image manager sub-component
// ---------------------------------------------------------------------------

function ImageManager({
  images,
  onChange,
  error,
}: {
  images: string[];
  onChange: (imgs: string[]) => void;
  error?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      const urls = await uploadMultipleToCloudinary(Array.from(files));
      onChange([...images, ...urls]);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  function moveUp(i: number) {
    if (i === 0) return;
    const next = [...images];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChange(next);
  }

  function moveDown(i: number) {
    if (i === images.length - 1) return;
    const next = [...images];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    onChange(next);
  }

  function remove(i: number) {
    onChange(images.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Uploaded thumbnails */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((url, i) => (
            <div
              key={url}
              className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 group"
            >
              <Image src={url} alt={`Product image ${i + 1}`} fill className="object-cover" sizes="96px" />
              {i === 0 && (
                <span className="absolute bottom-0 left-0 right-0 bg-brand-terracotta/80 text-white text-[9px] text-center py-0.5 font-semibold">
                  THUMBNAIL
                </span>
              )}
              {/* Controls */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <button type="button" onClick={() => moveUp(i)} disabled={i === 0}
                  className="bg-white/90 rounded p-1 disabled:opacity-30 hover:bg-white transition-colors text-xs"
                  aria-label="Move left">◀</button>
                <button type="button" onClick={() => remove(i)}
                  className="bg-red-500 text-white rounded p-1 hover:bg-red-600 transition-colors text-xs font-bold"
                  aria-label="Remove">✕</button>
                <button type="button" onClick={() => moveDown(i)} disabled={i === images.length - 1}
                  className="bg-white/90 rounded p-1 disabled:opacity-30 hover:bg-white transition-colors text-xs"
                  aria-label="Move right">▶</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !uploading && inputRef.current?.click()}
        className={[
          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 cursor-pointer transition-colors",
          dragOver ? "border-brand-terracotta bg-brand-terracotta/5" : "border-gray-200 hover:border-brand-terracotta/60 bg-gray-50",
          uploading ? "pointer-events-none opacity-60" : "",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <>
            <div className="w-6 h-6 rounded-full border-4 border-brand-terracotta border-t-transparent animate-spin" />
            <p className="text-xs text-gray-500">Uploading…</p>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
              className="text-gray-400" aria-hidden="true">
              <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
            </svg>
            <p className="text-xs text-gray-500 text-center">
              Drag &amp; drop images here or <span className="text-brand-terracotta font-medium">browse</span>
            </p>
            <p className="text-[10px] text-gray-400">First image becomes the listing thumbnail</p>
          </>
        )}
      </div>

      {(error || uploadError) && (
        <p className="text-xs text-red-600">{uploadError ?? error}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main form
// ---------------------------------------------------------------------------

export default function ProductForm({ initialData, onSubmit }: ProductFormProps) {
  const isEdit = !!initialData;

  // ---- form state ----
  const [title, setTitle]               = useState(initialData?.title ?? "");
  const [slug, setSlug]                 = useState(initialData?.slug ?? "");
  const [sku, setSku]                   = useState(initialData?.sku ?? "");
  const [categoryId, setCategoryId]     = useState(initialData?.categoryId ?? "");
  const [subCategoryId, setSubCategoryId] = useState(initialData?.subCategoryId ?? "");
  const [price, setPrice]               = useState(String(initialData?.price ?? ""));
  const [salePrice, setSalePrice]       = useState(String(initialData?.salePrice ?? ""));
  const [stockQty, setStockQty]         = useState(String(initialData?.stockQty ?? "0"));
  const [lowStockThreshold, setLowStockThreshold] = useState(String(initialData?.lowStockThreshold ?? "5"));
  const [weightGrams, setWeightGrams]   = useState(String(initialData?.weightGrams ?? ""));
  const [allowBackorder, setAllowBackorder] = useState(initialData?.allowBackorder ?? false);
  const [isMadeToOrder, setIsMadeToOrder]   = useState(initialData?.isMadeToOrder ?? false);
  const [leadTimeDays, setLeadTimeDays] = useState(String(initialData?.leadTimeDays ?? ""));
  const [shortDesc, setShortDesc]       = useState(initialData?.shortDesc ?? "");
  const [longDesc, setLongDesc]         = useState(initialData?.longDesc ?? "");
  const [occasionTagsStr, setOccasionTagsStr] = useState((initialData?.occasionTags ?? []).join(", "));
  const [isFeatured, setIsFeatured]     = useState(initialData?.isFeatured ?? false);
  const [status, setStatus]             = useState<ProductStatus>(initialData?.status ?? "draft");
  const [seoTitle, setSeoTitle]         = useState(initialData?.seo?.title ?? "");
  const [seoDesc, setSeoDesc]           = useState(initialData?.seo?.description ?? "");
  const [images, setImages]             = useState<string[]>(initialData?.images ?? []);

  const [categories, setCategories]     = useState<Category[]>([]);
  const [errors, setErrors]             = useState<Record<string, string>>({});
  const [submitting, setSubmitting]     = useState(false);
  const [submitError, setSubmitError]   = useState<string | null>(null);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  // Auto-slug from title when not editing
  useEffect(() => {
    if (!isEdit) setSlug(slugify(title));
  }, [title, isEdit]);

  const regenerateSlug = useCallback(() => setSlug(slugify(title)), [title]);

  // ---- validation ----
  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!title.trim())      errs.title      = "Title is required.";
    if (!sku.trim())        errs.sku        = "SKU is required.";
    if (!categoryId)        errs.categoryId = "Category is required.";
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0)
                            errs.price      = "Valid price is required.";
    if (images.length === 0) errs.images    = "At least one image is required.";
    return errs;
  }

  // ---- submit ----
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);

    const data: ProductDraft = {
      title:             title.trim(),
      slug:              slug.trim() || slugify(title),
      sku:               sku.trim(),
      categoryId,
      price:             parseFloat(price),
      stockQty:          parseInt(stockQty) || 0,
      lowStockThreshold: parseInt(lowStockThreshold) || 5,
      weightGrams:       parseFloat(weightGrams) || 0,
      allowBackorder,
      isMadeToOrder,
      images,
      shortDesc:         shortDesc.trim(),
      longDesc:          longDesc.trim(),
      occasionTags:      occasionTagsStr.split(",").map((t) => t.trim()).filter(Boolean),
      isFeatured,
      status,
      seo:               { title: seoTitle.trim(), description: seoDesc.trim() },
      // Optional fields — only include when they have a real value
      ...(subCategoryId                                       ? { subCategoryId }                           : {}),
      ...(salePrice !== ""                                    ? { salePrice: parseFloat(salePrice) }        : {}),
      ...(isMadeToOrder && leadTimeDays !== ""                ? { leadTimeDays: parseInt(leadTimeDays) }    : {}),
    };

    try {
      await onSubmit(data);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  // ---- render ----
  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
      {submitError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      {/* ---- Basic info ---- */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
        <SectionHeading>Basic Information</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <Field label="Title" required error={errors.title}>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className={errors.title ? errorInputCls : inputCls} placeholder="Lavender Soy Candle" />
            </Field>
          </div>

          <Field label="Slug" required>
            <div className="flex gap-2">
              <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)}
                className={`${inputCls} flex-1`} placeholder="lavender-soy-candle" />
              <button type="button" onClick={regenerateSlug}
                className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap">
                Regenerate
              </button>
            </div>
          </Field>

          <Field label="SKU" required error={errors.sku}>
            <input type="text" value={sku} onChange={(e) => setSku(e.target.value)}
              className={errors.sku ? errorInputCls : inputCls} placeholder="FLM-001" />
          </Field>

          <Field label="Category" required error={errors.categoryId}>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
              className={errors.categoryId ? errorInputCls : inputCls}>
              <option value="">Select category…</option>
              {categories.filter((c) => !c.parentId).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Sub-category (optional)">
            <select value={subCategoryId} onChange={(e) => setSubCategoryId(e.target.value)}
              className={inputCls} disabled={!categoryId}>
              <option value="">None</option>
              {categories.filter((c) => c.parentId === categoryId).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as ProductStatus)}
              className={inputCls}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </Field>

          <Field label="Is Featured">
            <label className="flex items-center gap-2 cursor-pointer mt-1">
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 accent-brand-terracotta" />
              <span className="text-sm text-gray-700">Show in Best Sellers / Featured section</span>
            </label>
          </Field>
        </div>
      </div>

      {/* ---- Pricing & Inventory ---- */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
        <SectionHeading>Pricing &amp; Inventory</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Field label="Price (Rs.)" required error={errors.price}>
            <input type="number" min={0} step="0.01" value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={errors.price ? errorInputCls : inputCls} placeholder="1500" />
          </Field>

          <Field label="Sale Price (Rs.) — optional">
            <input type="number" min={0} step="0.01" value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              className={inputCls} placeholder="1200" />
          </Field>

          <Field label="Stock Quantity">
            <input type="number" min={0} value={stockQty}
              onChange={(e) => setStockQty(e.target.value)}
              className={inputCls} />
          </Field>

          <Field label="Low Stock Threshold">
            <input type="number" min={0} value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              className={inputCls} />
          </Field>

          <Field label="Weight (grams)">
            <input type="number" min={0} value={weightGrams}
              onChange={(e) => setWeightGrams(e.target.value)}
              className={inputCls} placeholder="250" />
          </Field>

          <div className="flex flex-col gap-3 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={allowBackorder}
                onChange={(e) => setAllowBackorder(e.target.checked)}
                className="w-4 h-4 accent-brand-terracotta" />
              <span className="text-sm text-gray-700">Allow Backorder</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isMadeToOrder}
                onChange={(e) => setIsMadeToOrder(e.target.checked)}
                className="w-4 h-4 accent-brand-terracotta" />
              <span className="text-sm text-gray-700">Made to Order</span>
            </label>
          </div>

          {isMadeToOrder && (
            <Field label="Lead Time (days)">
              <input type="number" min={1} value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(e.target.value)}
                className={inputCls} placeholder="7" />
            </Field>
          )}
        </div>
      </div>

      {/* ---- Images ---- */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
        <SectionHeading>Images</SectionHeading>
        <ImageManager images={images} onChange={setImages} error={errors.images} />
      </div>

      {/* ---- Descriptions ---- */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
        <SectionHeading>Descriptions</SectionHeading>
        <div className="flex flex-col gap-5">
          <Field label="Short Description">
            <textarea rows={2} value={shortDesc} onChange={(e) => setShortDesc(e.target.value)}
              className={`${inputCls} resize-none`} placeholder="One or two sentences shown on product cards." />
          </Field>
          <Field label="Long Description">
            <textarea rows={6} value={longDesc} onChange={(e) => setLongDesc(e.target.value)}
              className={`${inputCls} resize-y`} placeholder="Full product description shown on the product detail page." />
          </Field>
          <Field label="Occasion Tags (comma-separated)">
            <input type="text" value={occasionTagsStr}
              onChange={(e) => setOccasionTagsStr(e.target.value)}
              className={inputCls} placeholder="Birthday, Anniversary, Mother's Day" />
          </Field>
        </div>
      </div>

      {/* ---- SEO ---- */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
        <SectionHeading>SEO</SectionHeading>
        <div className="flex flex-col gap-5">
          <Field label="SEO Title">
            <input type="text" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)}
              className={inputCls} placeholder="Lavender Soy Candle | Flamira" />
          </Field>
          <Field label="SEO Description">
            <textarea rows={2} value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)}
              className={`${inputCls} resize-none`} placeholder="Hand-poured lavender soy candle, delivered island-wide in Sri Lanka." />
          </Field>
        </div>
      </div>

      {/* ---- Submit ---- */}
      <div className="flex items-center gap-4 pb-4">
        <button
          type="submit"
          disabled={submitting}
          className="px-8 py-3 rounded-lg bg-brand-terracotta text-white text-sm font-medium hover:bg-brand-terracotta-dark disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
        </button>
        <a href="/admin/products" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
          Cancel
        </a>
      </div>
    </form>
  );
}
