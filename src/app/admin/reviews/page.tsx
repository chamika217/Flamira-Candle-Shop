"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import {
  getAllReviewsAdmin, moderateReview, replyToReview,
  toggleFeatured, deleteReview,
} from "@/lib/reviewService";
import { getAllProductsAdmin } from "@/lib/productService";
import type { Review, Product } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ReviewFilter = "all" | "pending" | "approved";

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="text-sm">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rating ? "text-amber-400" : "text-gray-200"}>★</span>
      ))}
    </span>
  );
}

function formatDate(ts: { toDate: () => Date } | undefined): string {
  if (!ts) return "—";
  return ts.toDate().toLocaleDateString("en-LK", { day: "numeric", month: "short", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Delete dialog
// ---------------------------------------------------------------------------
function DeleteDialog({ onConfirm, onCancel, loading }: {
  onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full flex flex-col gap-4">
        <h2 className="text-base font-semibold text-gray-900">Delete review?</h2>
        <p className="text-sm text-gray-500">This cannot be undone.</p>
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
// Review row
// ---------------------------------------------------------------------------
function ReviewRow({
  review,
  productTitle,
  onReload,
}: {
  review: Review;
  productTitle: string;
  onReload: () => void;
}) {
  const [expanded, setExpanded]   = useState(false);
  const [replyText, setReplyText] = useState(review.reply ?? "");
  const [replySaving, setReplySaving] = useState(false);
  const [moderating, setModerating]   = useState(false);
  const [featuring, setFeaturing]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [lightbox, setLightbox]         = useState<string | null>(null);

  async function handleModerate(approved: boolean) {
    setModerating(true);
    try { await moderateReview(review.id, approved); onReload(); }
    finally { setModerating(false); }
  }

  async function handleReply() {
    setReplySaving(true);
    try { await replyToReview(review.id, replyText); onReload(); }
    finally { setReplySaving(false); }
  }

  async function handleFeature(featured: boolean) {
    setFeaturing(true);
    try { await toggleFeatured(review.id, featured); onReload(); }
    finally { setFeaturing(false); }
  }

  async function handleDelete() {
    setDeleting(true);
    try { await deleteReview(review.id); setDeleteTarget(false); onReload(); }
    finally { setDeleting(false); }
  }

  return (
    <>
      <tr className="border-t border-gray-100 hover:bg-gray-50 transition-colors align-top">
        {/* Product */}
        <td className="px-4 py-3 text-sm text-gray-700 max-w-[160px]">
          <span className="line-clamp-2 leading-snug">{productTitle}</span>
        </td>
        {/* Customer */}
        <td className="px-4 py-3 text-sm text-gray-700">
          <p className="font-medium">{review.customerName || "—"}</p>
          <p className="text-xs text-gray-400 font-mono">{review.orderNumber}</p>
        </td>
        {/* Rating */}
        <td className="px-4 py-3"><StarDisplay rating={review.rating} /></td>
        {/* Comment */}
        <td className="px-4 py-3 text-sm text-gray-600 max-w-[220px]">
          <p className={expanded ? "" : "line-clamp-2"}>{review.comment}</p>
          {review.comment.length > 100 && (
            <button type="button" onClick={() => setExpanded((v) => !v)}
              className="text-xs text-brand-terracotta underline underline-offset-2 mt-0.5 transition-colors hover:text-brand-terracotta-dark">
              {expanded ? "show less" : "show more"}
            </button>
          )}
        </td>
        {/* Photos */}
        <td className="px-4 py-3">
          {review.photos && review.photos.length > 0 ? (
            <div className="flex gap-1 flex-wrap">
              {review.photos.map((url) => (
                <button key={url} type="button" onClick={() => setLightbox(url)}
                  className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 hover:border-brand-terracotta transition-colors">
                  <Image src={url} alt="Review photo" fill className="object-cover" sizes="40px" />
                </button>
              ))}
            </div>
          ) : <span className="text-xs text-gray-400">—</span>}
        </td>
        {/* Status */}
        <td className="px-4 py-3">
          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${review.approved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {review.approved ? "Approved" : "Pending"}
          </span>
        </td>
        {/* Featured */}
        <td className="px-4 py-3">
          <button
            type="button"
            role="switch"
            aria-checked={review.featured}
            disabled={featuring || !review.approved}
            onClick={() => handleFeature(!review.featured)}
            title={!review.approved ? "Approve first to feature" : undefined}
            className={[
              "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors disabled:opacity-40",
              review.featured ? "bg-amber-400" : "bg-gray-200",
            ].join(" ")}
          >
            <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${review.featured ? "translate-x-4" : "translate-x-0"}`} />
          </button>
        </td>
        {/* Date */}
        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDate(review.createdAt)}</td>
        {/* Actions */}
        <td className="px-4 py-3">
          <div className="flex flex-col gap-1.5 min-w-[100px]">
            {!review.approved ? (
              <button type="button" onClick={() => handleModerate(true)} disabled={moderating}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 transition-colors">
                Approve
              </button>
            ) : (
              <button type="button" onClick={() => handleModerate(false)} disabled={moderating}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 transition-colors">
                Unapprove
              </button>
            )}
            <button type="button" onClick={() => setDeleteTarget(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
              Delete
            </button>
          </div>
        </td>
      </tr>

      {/* Reply row */}
      <tr className="border-t border-gray-50 bg-gray-50/50">
        <td colSpan={9} className="px-4 py-3">
          <div className="flex gap-2 items-end max-w-xl">
            <div className="flex-1">
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1 font-semibold">
                Owner reply
              </label>
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply visible to customers…"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-brand-terracotta transition-colors"
              />
            </div>
            <button type="button" onClick={handleReply} disabled={replySaving}
              className="px-3 py-2 rounded-lg text-xs font-medium text-white bg-brand-terracotta hover:bg-brand-terracotta-dark disabled:opacity-50 transition-colors shrink-0">
              {replySaving ? "Saving…" : "Save Reply"}
            </button>
          </div>
        </td>
      </tr>

      {deleteTarget && (
        <DeleteDialog
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(false)}
          loading={deleting}
        />
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
          onClick={() => setLightbox(null)}>
          <div className="relative max-w-lg w-full aspect-square">
            <Image src={lightbox} alt="Review photo" fill className="object-contain rounded-xl" sizes="512px" />
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminReviewsPage() {
  const [reviews, setReviews]     = useState<Review[]>([]);
  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<ReviewFilter>("all");

  async function load() {
    const [r, p] = await Promise.all([
      getAllReviewsAdmin().catch(() => [] as Review[]),
      getAllProductsAdmin().catch(() => [] as Product[]),
    ]);
    setReviews(r);
    setProducts(p);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const productMap = useMemo(() => {
    const m: Record<string, string> = {};
    products.forEach((p) => (m[p.id] = p.title));
    return m;
  }, [products]);

  const filtered = useMemo(() => {
    if (filter === "pending")  return reviews.filter((r) => !r.approved);
    if (filter === "approved") return reviews.filter((r) => r.approved);
    return reviews;
  }, [reviews, filter]);

  const pendingCount = reviews.filter((r) => !r.approved).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {reviews.length} total{pendingCount > 0 ? ` — ${pendingCount} pending approval` : ""}
        </p>
      </div>

      {/* Filter */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white w-fit">
        {([ ["all", "All"], ["pending", "Pending"], ["approved", "Approved"] ] as [ReviewFilter, string][]).map(([val, label]) => (
          <button key={val} type="button" onClick={() => setFilter(val)}
            className={[
              "px-5 py-2.5 text-sm font-medium transition-colors",
              filter === val ? "bg-brand-terracotta text-white" : "text-gray-600 hover:bg-gray-50",
            ].join(" ")}>
            {label}
            {val === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center">
            <div className="w-7 h-7 rounded-full border-4 border-brand-terracotta border-t-transparent animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">No reviews yet</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">No reviews match this filter</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Product</th>
                  <th className="text-left px-4 py-3 font-semibold">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold">Rating</th>
                  <th className="text-left px-4 py-3 font-semibold">Comment</th>
                  <th className="text-left px-4 py-3 font-semibold">Photos</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Featured</th>
                  <th className="text-left px-4 py-3 font-semibold">Date</th>
                  <th className="text-left px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((review) => (
                  <ReviewRow
                    key={review.id}
                    review={review}
                    productTitle={productMap[review.productId] ?? review.productId}
                    onReload={load}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
