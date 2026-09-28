"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, ShoppingBag, Eye, Check, Sparkles, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import QuickViewModal from "./QuickViewModal";
import type { Product } from "@/lib/types";

// Curated fallbacks if no products are in Firestore yet
const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "fb-1",
    title: "Vanilla & Sandalwood Amber Candle",
    slug: "vanilla-sandalwood-amber-candle",
    sku: "CAN-VAN-01",
    categoryId: "candles",
    price: 3200,
    salePrice: 2850,
    stockQty: 15,
    lowStockThreshold: 3,
    allowBackorder: true,
    isMadeToOrder: false,
    weightGrams: 350,
    images: ["/Animation1.png", "/Animation3.png"],
    shortDesc: "Hand-poured 100% natural soy wax candle infused with warm Madagascar vanilla and royal Ceylon sandalwood notes.",
    longDesc: "Crafted for peaceful evenings and warm ambiance.",
    occasionTags: ["bestseller", "gift", "candle"],
    isFeatured: true,
    status: "active",
    seo: { title: "Vanilla Sandalwood Candle", description: "Handmade soy candle Sri Lanka" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createdAt: null as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updatedAt: null as any,
  },
  {
    id: "fb-2",
    title: "Botanical Floral Aroma Wax Sachet",
    slug: "botanical-floral-aroma-wax-sachet",
    sku: "WAX-BOT-02",
    categoryId: "decor",
    price: 1850,
    salePrice: 1650,
    stockQty: 25,
    lowStockThreshold: 5,
    allowBackorder: true,
    isMadeToOrder: false,
    weightGrams: 120,
    images: ["/Animation2.png", "/Animation6.png"],
    shortDesc: "Natural soy wax tablet embedded with dried wild florals and infused with soothing lavender & jasmine fragrance.",
    longDesc: "Hang in closets, cars, or bedside for an effortless fragrance breeze.",
    occasionTags: ["closet freshener", "handmade"],
    isFeatured: true,
    status: "active",
    seo: { title: "Botanical Wax Sachet", description: "Aroma wax tablet Sri Lanka" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createdAt: null as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updatedAt: null as any,
  },
  {
    id: "fb-3",
    title: "Artisanal Resin Floral Trinket Tray",
    slug: "artisanal-resin-floral-trinket-tray",
    sku: "RES-FLR-03",
    categoryId: "decor",
    price: 3600,
    stockQty: 8,
    lowStockThreshold: 2,
    allowBackorder: false,
    isMadeToOrder: true,
    weightGrams: 280,
    images: ["/Animation4.png", "/Animation7.png"],
    shortDesc: "Crystal clear epoxy resin tray encasing preserved Sri Lankan wildflowers with delicate gold leaf flakes.",
    longDesc: "Perfect for jewelry, keys, or aesthetic bedside décor.",
    occasionTags: ["resin", "keepsake", "gift"],
    isFeatured: true,
    status: "active",
    seo: { title: "Resin Floral Tray", description: "Handmade resin tray Sri Lanka" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createdAt: null as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updatedAt: null as any,
  },
  {
    id: "fb-4",
    title: "Luxe Celebration Gift Hamper Box",
    slug: "luxe-celebration-gift-hamper-box",
    sku: "HMP-LUX-04",
    categoryId: "gifts",
    price: 6800,
    salePrice: 5950,
    stockQty: 10,
    lowStockThreshold: 2,
    allowBackorder: true,
    isMadeToOrder: true,
    weightGrams: 850,
    images: ["/Animation5.png", "/Animation1.png"],
    shortDesc: "A complete curated gift set featuring 1 amber candle, 2 aroma sachets, match bottle & personalized handwritten card.",
    longDesc: "Delivered in a luxury gift box wrapped with satin ribbon.",
    occasionTags: ["hamper", "custom", "wedding gift"],
    isFeatured: true,
    status: "active",
    seo: { title: "Luxury Gift Hamper", description: "Gift box delivery Sri Lanka" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createdAt: null as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updatedAt: null as any,
  },
];

interface BestSellersSectionProps {
  products: Product[];
}

export default function BestSellersSection({ products }: BestSellersSectionProps) {
  const { addItem } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<string>("all");

  const displayList = products.length > 0 ? products : FALLBACK_PRODUCTS;

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const displayPrice = product.salePrice ?? product.price;
    const thumbnail = product.images[0] ?? "/Animation1.png";

    addItem(
      {
        productId: product.id,
        slug: product.slug,
        title: product.title,
        price: displayPrice,
        image: thumbnail,
      },
      1
    );

    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1800);
  };

  const handleOpenQuickView = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProduct(product);
  };

  // Filter products by tab
  const filteredProducts = displayList.filter((p) => {
    if (activeTab === "all") return true;
    if (activeTab === "candles") return p.categoryId?.toLowerCase().includes("candle") || p.title.toLowerCase().includes("candle");
    if (activeTab === "decor") return p.categoryId?.toLowerCase().includes("decor") || p.categoryId?.toLowerCase().includes("resin") || p.title.toLowerCase().includes("tray") || p.title.toLowerCase().includes("sachet");
    if (activeTab === "gifts") return p.categoryId?.toLowerCase().includes("gift") || p.title.toLowerCase().includes("hamper") || p.title.toLowerCase().includes("gift");
    return true;
  });

  const finalProducts = filteredProducts.length > 0 ? filteredProducts : displayList;

  return (
    <section
      className="relative bg-brand-ivory/60 border-t border-brand-border/80 py-20 sm:py-28 overflow-hidden"
      aria-labelledby="bestsellers-heading"
    >
      {/* Ambient background blur */}
      <div className="pointer-events-none absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-brand-terracotta/10 blur-3xl" />
      <div className="pointer-events-none absolute top-20 -left-20 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 text-brand-terracotta text-xs font-bold tracking-widest uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Customer Favorites</span>
          </div>
          <h2
            id="bestsellers-heading"
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-brown tracking-tight"
          >
            Best Selling Creations
          </h2>
          <p className="text-sm sm:text-base text-brand-stone mt-3">
            Handcrafted with patient artistry. Our most cherished artisanal candles, botanical wax tablets, and keepsake gifts.
          </p>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8 p-1.5 rounded-full bg-white/90 border border-brand-border/80 backdrop-blur-md shadow-sm">
            {[
              { id: "all", label: "All Creations" },
              { id: "candles", label: "Soy Candles" },
              { id: "decor", label: "Wax & Resin Décor" },
              { id: "gifts", label: "Luxury Gift Sets" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                suppressHydrationWarning
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-brand-terracotta text-white shadow-md shadow-brand-terracotta/20"
                    : "text-brand-stone hover:text-brand-brown hover:bg-brand-ivory/80"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {finalProducts.map((product) => {
            const thumbnail = product.images[0] ?? "/Animation1.png";
            const secondary = product.images[1] ?? thumbnail;
            const displayPrice = product.salePrice ?? product.price;
            const hasSale = product.salePrice !== undefined && product.salePrice < product.price;
            const isAdded = !!addedIds[product.id];
            const discountPct = hasSale
              ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
              : 0;

            return (
              <article
                key={product.id}
                className="group relative flex flex-col rounded-3xl bg-white border border-brand-border/70 overflow-hidden shadow-sm hover:shadow-2xl hover:border-brand-terracotta/40 hover:-translate-y-1.5 transition-all duration-300"
              >
                {/* Image Container with Hover Quick Actions */}
                <div className="relative aspect-square w-full bg-brand-ivory overflow-hidden">
                  <Link href={`/product/${product.slug}`} className="block w-full h-full">
                    {/* Primary Image */}
                    <Image
                      src={thumbnail}
                      alt={product.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className={`object-cover transition-all duration-700 ease-out group-hover:scale-108 ${
                        secondary !== thumbnail ? "group-hover:opacity-0" : ""
                      }`}
                    />

                    {/* Secondary Image on Hover if available */}
                    {secondary !== thumbnail && (
                      <Image
                        src={secondary}
                        alt={product.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-opacity duration-500 opacity-0 group-hover:opacity-100 scale-105"
                      />
                    )}
                  </Link>

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
                    {hasSale ? (
                      <span className="bg-brand-terracotta text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                        Save {discountPct}%
                      </span>
                    ) : (
                      <span className="bg-white/90 backdrop-blur-md text-brand-brown text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm border border-white/60">
                        Handcrafted
                      </span>
                    )}

                    {/* Quick View Button */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenQuickView(product, e)}
                      className="pointer-events-auto w-8 h-8 rounded-full bg-white/90 backdrop-blur-md text-brand-stone hover:text-brand-terracotta hover:bg-white flex items-center justify-center shadow-md transition-all duration-200 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                      aria-label={`Quick view ${product.title}`}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Bottom Image Overlay Strip: Quick Add to Cart */}
                  <div className="absolute inset-x-3 bottom-3 z-10">
                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(product, e)}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl font-medium text-xs shadow-lg transition-all duration-300 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 ${
                        isAdded
                          ? "bg-emerald-600 text-white shadow-emerald-600/30"
                          : "bg-brand-brown hover:bg-brand-terracotta text-white shadow-brand-brown/30 active:scale-95"
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5 animate-scale-in" />
                          <span>Added to Cart!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Quick Add</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    {/* Star Rating */}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="flex items-center text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-[11px] font-semibold text-brand-stone">5.0</span>
                    </div>

                    {/* Title */}
                    <h3 className="font-serif text-base font-bold text-brand-brown group-hover:text-brand-terracotta transition-colors leading-snug line-clamp-2">
                      <Link href={`/product/${product.slug}`}>{product.title}</Link>
                    </h3>
                  </div>

                  {/* Price & CTA */}
                  <div className="mt-4 pt-3 border-t border-brand-border/60 flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-bold text-brand-terracotta">
                        Rs. {displayPrice.toLocaleString("en-LK")}
                      </span>
                      {hasSale && (
                        <span className="text-xs text-brand-muted line-through">
                          Rs. {product.price.toLocaleString("en-LK")}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/product/${product.slug}`}
                      className="text-xs font-semibold text-brand-stone hover:text-brand-terracotta flex items-center gap-1 transition-colors"
                    >
                      <span>Details</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* View All Shop CTA Banner */}
        <div className="mt-14 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-white hover:bg-brand-cream border border-brand-border text-brand-brown font-semibold text-sm shadow-md hover:shadow-lg hover:border-brand-terracotta/50 transition-all duration-300"
          >
            <span>Explore All 2026 Creations</span>
            <ArrowRight className="w-4 h-4 text-brand-terracotta" />
          </Link>
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </section>
  );
}
