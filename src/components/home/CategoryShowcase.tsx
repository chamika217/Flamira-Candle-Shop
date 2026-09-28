"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Sparkles } from "lucide-react";
import type { Category } from "@/lib/types";

// High quality curated default image assets for categories
const CATEGORY_IMAGES: Record<string, { img: string; badge: string; desc: string }> = {
  "Home Décor": {
    img: "/Animation1.png",
    badge: "Trending",
    desc: "Aesthetic candle jars, botanical table accents & room warmth",
  },
  "Gifts": {
    img: "/Animation5.png",
    badge: "Best for Gifting",
    desc: "Curated hampers, bridesmaid favors & personalized packages",
  },
  "Handmade & Resin": {
    img: "/Animation4.png",
    badge: "Artisan Pick",
    desc: "Epoxy resin coasters, floral trays & custom keepsakes",
  },
  "Seasonal": {
    img: "/Animation6.png",
    badge: "Limited Edition",
    desc: "Aroma wax tablets, festive scents & seasonal bundles",
  },
};

const FALLBACK_CATEGORY_DATA = [
  {
    id: "cat-1",
    name: "Soy Wax Candles",
    slug: "soy-wax-candles",
    img: "/Animation3.png",
    badge: "Bestseller",
    desc: "Pure botanical soy wax with lead-free cotton wicks",
  },
  {
    id: "cat-2",
    name: "Aroma Wax Tablets",
    slug: "aroma-wax-tablets",
    img: "/Animation2.png",
    badge: "Most Loved",
    desc: "Floral closet & room fresheners infused with essential oils",
  },
  {
    id: "cat-3",
    name: "Resin Keepsakes & Décor",
    slug: "resin-keepsakes",
    img: "/Animation4.png",
    badge: "Handcrafted",
    desc: "Hand-poured floral preservation, coasters & trinket trays",
  },
  {
    id: "cat-4",
    name: "Luxury Gift Sets",
    slug: "gift-sets",
    img: "/Animation5.png",
    badge: "Gift Ready",
    desc: "Elegantly boxed hampers with personalized handwritten notes",
  },
];

interface CategoryShowcaseProps {
  categories: Category[];
}

export default function CategoryShowcase({ categories }: CategoryShowcaseProps) {
  // If Firestore has categories, enrich them, otherwise use our rich curated list
  const displayList = categories.length > 0
    ? categories.map((cat, idx) => {
        const fallback = CATEGORY_IMAGES[cat.name] || FALLBACK_CATEGORY_DATA[idx % FALLBACK_CATEGORY_DATA.length];
        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug === "#" ? "/shop" : `/shop?category=${cat.slug}`,
          img: cat.image || fallback.img,
          badge: fallback.badge,
          desc: fallback.desc,
        };
      })
    : FALLBACK_CATEGORY_DATA.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: `/shop?category=${cat.slug}`,
        img: cat.img,
        badge: cat.badge,
        desc: cat.desc,
      }));

  return (
    <section
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28"
      aria-labelledby="categories-heading"
    >
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-brand-terracotta text-xs font-bold tracking-widest uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Collections</span>
          </div>
          <h2
            id="categories-heading"
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-brown tracking-tight"
          >
            Shop by Category
          </h2>
          <p className="text-sm sm:text-base text-brand-stone mt-2 max-w-lg">
            Explore our thoughtfully curated handcrafted pieces, designed to bring calm, fragrance, and beauty to your home.
          </p>
        </div>

        <Link
          href="/shop"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-brand-terracotta hover:text-brand-terracotta-dark transition-colors self-start md:self-end pb-1 border-b border-brand-terracotta/40 hover:border-brand-terracotta"
        >
          <span>View All Products</span>
          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayList.map((cat) => (
          <Link
            key={cat.id}
            href={cat.slug}
            className="group relative flex flex-col rounded-3xl overflow-hidden aspect-[4/5] bg-brand-brown border border-brand-border/80 shadow-md hover:shadow-2xl hover:border-brand-terracotta transition-all duration-500 hover:-translate-y-1.5"
            aria-label={`Browse ${cat.name}`}
          >
            {/* Background Image with Zoom */}
            <div className="absolute inset-0 overflow-hidden">
              <Image
                src={cat.img}
                alt={cat.name}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              {/* Luxury Gradient Dark Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-brown/95 via-brand-brown/40 to-black/10 group-hover:via-brand-brown/30 transition-all duration-500" />
            </div>

            {/* Top Badge */}
            <div className="relative p-5 flex justify-between items-start z-10">
              <span className="bg-white/90 backdrop-blur-md text-brand-brown text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm border border-white/60">
                {cat.badge}
              </span>
              <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-brand-terracotta transition-all duration-300 transform group-hover:rotate-45">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            {/* Bottom Content Info */}
            <div className="relative mt-auto p-6 flex flex-col gap-1.5 z-10">
              <h3 className="font-serif text-2xl font-bold text-white group-hover:text-amber-200 transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs text-white/80 line-clamp-2 leading-relaxed">
                {cat.desc}
              </p>
              <div className="flex items-center gap-1 text-xs font-semibold text-amber-300 mt-2 pt-2 border-t border-white/15">
                <span>Browse Collection</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
