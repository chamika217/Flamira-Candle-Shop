import { Suspense } from "react";
import Link from "next/link";
import { getProducts } from "@/lib/productService";
import { getCategories } from "@/lib/categoryService";
import type { Product, Category } from "@/lib/types";
import ShopFilters from "@/components/ShopFilters";

export const metadata = {
  title: "Shop — Flamira",
  description:
    "Browse our full collection of handmade home décor and gifts, delivered island-wide.",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeProduct(p: Product): any {
  return {
    ...p,
    createdAt: p.createdAt?.toDate?.().toISOString() ?? null,
    updatedAt: p.updatedAt?.toDate?.().toISOString() ?? null,
  };
}

// Quick category nav items (parent categories)
const CATEGORY_NAV = [
  { label: "All Products", slug: null, icon: "✦" },
  { label: "Home Décor", slug: "home-decor", icon: "🏠" },
  { label: "Gifts", slug: "gifts", icon: "🎁" },
  { label: "Handmade & Resin", slug: "handmade-resin", icon: "🖼️" },
  { label: "Seasonal", slug: "seasonal", icon: "🌸" },
];

export default async function ShopPage(props: PageProps<"/shop">) {
  const searchParams = await props.searchParams;

  const initialCategorySlug =
    typeof searchParams.category === "string" ? searchParams.category : null;

  const [products, categories] = await Promise.all([
    getProducts().catch(() => [] as Product[]),
    getCategories().catch(() => [] as Category[]),
  ]);

  const serializedProducts = products.map(serializeProduct);

  return (
    <div className="min-h-screen bg-brand-cream">

      {/* ── Premium Shop Header ── */}
      <div className="relative bg-brand-brown overflow-hidden">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-brand-terracotta/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-0">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-white/40 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white/70 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/70">Shop</span>
            {initialCategorySlug && (
              <>
                <span>/</span>
                <span className="text-brand-terracotta capitalize">
                  {initialCategorySlug.replace(/-/g, " ")}
                </span>
              </>
            )}
          </nav>

          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-brand-terracotta text-[11px] font-bold tracking-widest uppercase mb-2">
                <span>✦</span>
                <span>Handmade in Sri Lanka</span>
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white leading-tight">
                {initialCategorySlug
                  ? initialCategorySlug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
                  : "Our Collection"}
              </h1>
              <p className="mt-2 text-white/55 text-sm sm:text-base max-w-lg">
                {products.length > 0
                  ? `${products.length} handcrafted piece${products.length !== 1 ? "s" : ""} — Cash on Delivery, island-wide`
                  : "Handcrafted with love — Cash on Delivery, island-wide"}
              </p>
            </div>

            {/* Sort hint */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-white/40 pb-1">
              <span>✦ Free delivery on orders above Rs. 5,000</span>
            </div>
          </div>

          {/* Category pill navigation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {CATEGORY_NAV.map(({ label, slug, icon }) => {
              const isActive = slug === initialCategorySlug;
              const href = slug ? `/shop?category=${slug}` : "/shop";
              return (
                <Link
                  key={label}
                  href={href}
                  className={[
                    "shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all duration-200 border-b-2",
                    isActive
                      ? "bg-brand-cream text-brand-brown border-brand-terracotta"
                      : "bg-white/10 text-white/70 border-transparent hover:bg-white/20 hover:text-white",
                  ].join(" ")}
                >
                  <span className="text-base leading-none">{icon}</span>
                  <span>{label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-terracotta" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Product grid with filters ── */}
      <Suspense fallback={
        <div className="flex justify-center py-24">
          <div className="w-7 h-7 rounded-full border-4 border-brand-terracotta border-t-transparent animate-spin" />
        </div>
      }>
        <ShopFilters
          products={serializedProducts}
          categories={categories}
          initialCategorySlug={initialCategorySlug}
        />
      </Suspense>
    </div>
  );
}
