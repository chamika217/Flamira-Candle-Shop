"use client";

import { useState, type FormEvent } from "react";
import { submitReview } from "@/lib/reviewService";
import { uploadMultipleToCloudinary } from "@/lib/cloudinaryUpload";
import type { OrderItem } from "@/lib/types";

// ---------------------------------------------------------------------------
// Star picker
// ---------------------------------------------------------------------------

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n !== 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="text-2xl leading-none transition-transform hover:scale-110 focus:outline-none"
        >
          <span className={(hovered || value) >= n ? "text-amber-400" : "text-brand-border"}>
            ★
          </span>
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single item review form
// ---------------------------------------------------------------------------

function ItemReviewForm({
  item,
  orderNumber,
}: {
  item: OrderItem;
  orderNumber: string;
}) {
  const [rating, setRating]       = useState(0);
  const [comment, setComment]     = useState("");
  const [files, setFiles]         = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const inputCls = "w-full rounded-lg border border-brand-border bg-brand-white px-3 py-2.5 text-sm text-brand-brown placeholder:text-brand-muted focus:outline-none focus:border-brand-terracotta transition-colors";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError("Please select a star rating."); return; }
    if (!comment.trim()) { setError("Please write a short comment."); return; }

    setError(null);
    setSubmitting(true);

    try {
      let photoUrls: string[] = [];
      if (files.length > 0) {
        setUploading(true);
        photoUrls = await uploadMultipleToCloudinary(files);
        setUploading(false);
      }

      await submitReview({
        productId:    item.productId,
        orderNumber,
        customerName: "", // server-verified, we pass order name via order lookup
        rating,
        comment:      comment.trim(),
        photos:       photoUrls.length > 0 ? photoUrls : undefined,
        reply:        undefined,
      });

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review. Please try again.");
      setUploading(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
        <span>✓</span>
        <span>Thanks for your review! It will appear once approved.</span>
      </div>
    );
  }

  return (
    <div className="border border-brand-border rounded-xl p-4 bg-brand-white">
      <p className="text-sm font-semibold text-brand-brown mb-3 line-clamp-1">{item.title}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">
            {error}
          </p>
        )}

        <div>
          <label className="block text-xs font-medium text-brand-stone mb-1.5">Your rating *</label>
          <StarPicker value={rating} onChange={setRating} />
        </div>

        <div>
          <label className="block text-xs font-medium text-brand-stone mb-1.5">Your review *</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="How was this product? Would you recommend it?"
            className={`${inputCls} resize-none`}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-brand-stone mb-1.5">
            Photos (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            className="text-xs text-brand-stone file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-brand-ivory file:text-brand-brown hover:file:bg-brand-border transition-colors"
          />
          {files.length > 0 && (
            <p className="text-xs text-brand-muted mt-1">{files.length} photo{files.length !== 1 ? "s" : ""} selected</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="self-start px-5 py-2 rounded-full bg-brand-terracotta text-brand-white text-sm font-medium hover:bg-brand-terracotta-dark disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? "Uploading photos…" : submitting ? "Submitting…" : "Submit Review"}
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review section — renders all item forms
// ---------------------------------------------------------------------------

export default function ReviewSection({
  orderNumber,
  items,
  orderStatus,
}: {
  orderNumber: string;
  items: OrderItem[];
  orderStatus: string;
}) {
  const canReview = orderStatus === "delivered" || orderStatus === "completed";

  return (
    <div className="mt-8">
      <div className="bg-brand-white rounded-2xl border border-brand-border overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-brand-border">
          <h2 className="font-serif text-base font-semibold text-brand-brown">
            Leave a Review
          </h2>
          <p className="text-xs text-brand-muted mt-1">
            Help others by sharing your experience with your purchase.
          </p>
        </div>

        <div className="p-5 sm:p-6">
          {canReview ? (
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <ItemReviewForm
                  key={item.productId}
                  item={item}
                  orderNumber={orderNumber}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-brand-stone">
              You can review your items once your order has been delivered. We&apos;ll let you know when it&apos;s on its way!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
