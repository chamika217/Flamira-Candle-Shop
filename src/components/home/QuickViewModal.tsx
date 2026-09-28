"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Star, ShoppingBag, Check, ArrowRight, ShieldCheck, Truck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/lib/types";

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const images = product.images.length > 0 ? product.images : ["/Animation1.png"];
  const displayPrice = product.salePrice ?? product.price;
  const hasSale = product.salePrice !== undefined && product.salePrice < product.price;

  const handleAddToCart = () => {
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        title: product.title,
        price: displayPrice,
        image: images[0] ?? "",
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-brown/60 backdrop-blur-sm animate-scale-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-brand-border overflow-hidden flex flex-col md:flex-row max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 text-brand-stone hover:text-brand-brown hover:bg-brand-ivory flex items-center justify-center shadow-md transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image Gallery */}
        <div className="w-full md:w-1/2 bg-brand-ivory p-6 flex flex-col items-center justify-center">
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-sm bg-white">
            <Image
              src={images[activeImgIdx] ?? "/Animation1.png"}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {/* Thumbnails if multiple */}
          {images.length > 1 && (
            <div className="flex items-center gap-2 mt-4 overflow-x-auto py-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImgIdx(i)}
                  className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    activeImgIdx === i ? "border-brand-terracotta scale-105" : "border-transparent opacity-70"
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-terracotta bg-brand-terracotta/10 px-2.5 py-0.5 rounded-full">
                Handcrafted
              </span>
              <div className="flex items-center text-amber-500 text-xs gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span className="font-semibold text-brand-brown">4.9</span>
                <span className="text-brand-muted text-[11px]">(Reviews)</span>
              </div>
            </div>

            <h3 className="font-serif text-2xl font-bold text-brand-brown leading-tight">
              {product.title}
            </h3>

            {/* Price */}
            <div className="flex items-baseline gap-3 my-3">
              <span className="text-2xl font-bold text-brand-terracotta">
                Rs. {displayPrice.toLocaleString("en-LK")}
              </span>
              {hasSale && (
                <span className="text-sm text-brand-muted line-through">
                  Rs. {product.price.toLocaleString("en-LK")}
                </span>
              )}
            </div>

            <p className="text-sm text-brand-stone leading-relaxed line-clamp-3 mb-4">
              {product.shortDesc ||
                "Hand-poured with love in Sri Lanka. Crafted using natural soy wax and therapeutic grade botanical scents for a soothing ambiance."}
            </p>

            {/* Micro Highlights */}
            <div className="space-y-1.5 py-3 border-y border-brand-border/60 text-xs text-brand-stone">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand-terracotta shrink-0" />
                <span>Island-Wide Delivery (Cash on Delivery Available)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Eco-Friendly &amp; Non-Toxic</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center border border-brand-border rounded-full bg-brand-ivory/50 px-3 py-1.5">
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-7 h-7 text-brand-brown font-bold flex items-center justify-center hover:text-brand-terracotta"
                >
                  -
                </button>
                <span className="w-8 text-center text-sm font-semibold text-brand-brown">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty(qty + 1)}
                  className="w-7 h-7 text-brand-brown font-bold flex items-center justify-center hover:text-brand-terracotta"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-all duration-300 ${
                  added
                    ? "bg-emerald-600 text-white shadow-lg"
                    : "bg-brand-terracotta hover:bg-brand-terracotta-dark text-white shadow-md hover:shadow-lg"
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>
            </div>

            <Link
              href={`/product/${product.slug}`}
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-brand-terracotta hover:text-brand-terracotta-dark transition-colors py-1"
            >
              <span>View Full Product Details &amp; Custom Options</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
