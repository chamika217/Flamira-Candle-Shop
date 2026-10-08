"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Product, Category } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useToast } from "@/context/ToastContext";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShopFiltersProps {
  products: Product[];
  categories: Category[];
  /** Still accepted from server — used as initial seed only; URL is authoritative. */
  initialCategorySlug: string | null;
}

type SortKey = "newest" | "price-asc" | "price-desc";

interface Filters {
  categoryIds: Set<string>;
  occasionTags: Set<string>;
  priceMin: string;
  priceMax: string;
  inStockOnly: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-LK")}`;
}

function isInStock(p: Product): boolean {
  return p.stockQty > 0 || p.allowBackorder || p.isMadeToOrder;
}

function effectivePrice(p: Product): number {
  return p.salePrice !== undefined && p.salePrice < p.price ? p.salePrice : p.price;
}

/** Resolve a category slug to its id, also matching children to their parent slug. */
function resolveSlugToIds(slug: string | null, categories: Category[]): Set<string> {
  const ids = new Set<string>();
  if (!slug) return ids;
  const match = categories.find((c) => c.slug === slug);
  if (match) ids.add(match.id);
  return ids;
}

function hasActiveFilters(f: Filters): boolean {
  return (
    f.categoryIds.size > 0 ||
    f.occasionTags.size > 0 ||
    f.priceMin !== "" ||
    f.priceMax !== "" ||
    f.inStockOnly
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function FilterIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Filter accordion section
// ---------------------------------------------------------------------------
function FilterSection({ title, children, defaultOpen = true }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-brand-border last:border-b-0">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-3 text-sm font-semibold text-brand-brown hover:text-brand-terracotta transition-colors"
        aria-expanded={open}>
        {title}
        <ChevronDownIcon open={open} />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter panel content
// ---------------------------------------------------------------------------
function FilterPanelContent({ filters, categories, allOccasionTags, onToggleCategory,
  onToggleOccasion, onPriceChange, onToggleInStock, onClear }: {
  filters: Filters; categories: Category[]; allOccasionTags: string[];
  onToggleCategory: (id: string) => void; onToggleOccasion: (tag: string) => void;
  onPriceChange: (field: "priceMin" | "priceMax", value: string) => void;
  onToggleInStock: () => void; onClear: () => void;
}) {
  // Split into parent categories and their children for grouped display
  const parents = categories.filter((c) => c.parentId === null);
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id);

  return (
    <div className="flex flex-col gap-0">
      {/* Category — parent only, subcategories expand on click */}
      {categories.length > 0 && (
        <FilterSection title="Category">
          <ul className="flex flex-col gap-1">
            {parents.map((parent) => {
              const kids = childrenOf(parent.id);
              const isParentSelected = filters.categoryIds.has(parent.id);
              const anyKidSelected = kids.some(k => filters.categoryIds.has(k.id));
              const expanded = isParentSelected || anyKidSelected;
              return (
                <li key={parent.id}>
                  <label className="flex items-center gap-2.5 cursor-pointer group py-1">
                    <input type="checkbox" checked={isParentSelected}
                      onChange={() => onToggleCategory(parent.id)}
                      className="w-4 h-4 rounded border-brand-border accent-brand-terracotta cursor-pointer" />
                    <span className="text-sm font-semibold text-brand-brown group-hover:text-brand-terracotta transition-colors flex-1">
                      {parent.name}
                    </span>
                    {kids.length > 0 && (
                      <span className="text-[10px] text-brand-muted">{expanded ? "▲" : "▼"}</span>
                    )}
                  </label>
                  {/* Subcategories — only shown when parent is selected */}
                  {kids.length > 0 && expanded && (
                    <ul className="ml-6 flex flex-col gap-1 mt-1 mb-1">
                      {kids.map((kid) => (
                        <li key={kid.id}>
                          <label className="flex items-center gap-2.5 cursor-pointer group py-0.5">
                            <input type="checkbox" checked={filters.categoryIds.has(kid.id)}
                              onChange={() => onToggleCategory(kid.id)}
                              className="w-3.5 h-3.5 rounded border-brand-border accent-brand-terracotta cursor-pointer" />
                            <span className="text-xs text-brand-stone group-hover:text-brand-brown transition-colors">
                              {kid.name}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </FilterSection>
      )}

      {/* Occasion */}
      {allOccasionTags.length > 0 && (
        <FilterSection title="Occasion" defaultOpen={false}>
          <ul className="flex flex-col gap-2">
            {allOccasionTags.map((tag) => (
              <li key={tag}>
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="checkbox" checked={filters.occasionTags.has(tag)}
                    onChange={() => onToggleOccasion(tag)}
                    className="w-4 h-4 rounded border-brand-border accent-brand-terracotta cursor-pointer" />
                  <span className="text-sm text-brand-stone group-hover:text-brand-brown transition-colors">{tag}</span>
                </label>
              </li>
            ))}
          </ul>
        </FilterSection>
      )}

      {/* Price range */}
      <FilterSection title="Price Range" defaultOpen={false}>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="sr-only" htmlFor="price-min">Minimum price</label>
            <input id="price-min" type="number" min={0} placeholder="Min" value={filters.priceMin}
              onChange={(e) => onPriceChange("priceMin", e.target.value)}
              className="w-full rounded-lg border border-brand-border bg-brand-white px-3 py-2 text-sm text-brand-brown placeholder:text-brand-muted focus:outline-none focus:border-brand-terracotta transition-colors" />
          </div>
          <span className="text-brand-muted text-sm shrink-0">–</span>
          <div className="flex-1">
            <label className="sr-only" htmlFor="price-max">Maximum price</label>
            <input id="price-max" type="number" min={0} placeholder="Max" value={filters.priceMax}
              onChange={(e) => onPriceChange("priceMax", e.target.value)}
              className="w-full rounded-lg border border-brand-border bg-brand-white px-3 py-2 text-sm text-brand-brown placeholder:text-brand-muted focus:outline-none focus:border-brand-terracotta transition-colors" />
          </div>
        </div>
        <p className="mt-1.5 text-xs text-brand-muted">Prices in Rs.</p>
      </FilterSection>

      {/* Availability */}
      <FilterSection title="Availability">
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input type="checkbox" checked={filters.inStockOnly} onChange={onToggleInStock}
            className="w-4 h-4 rounded border-brand-border accent-brand-terracotta cursor-pointer" />
          <span className="text-sm text-brand-stone group-hover:text-brand-brown transition-colors">In stock only</span>
        </label>
      </FilterSection>

      {/* Clear */}
      {hasActiveFilters(filters) && (
        <button type="button" onClick={onClear}
          className="mt-4 w-full text-center text-sm font-medium text-brand-terracotta hover:text-brand-terracotta-dark underline underline-offset-2 transition-colors">
          Clear all filters
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product card — enhanced with badges, wishlist, Add to Cart, hover actions
// ---------------------------------------------------------------------------
function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const { showToast } = useToast();
  const [adding, setAdding] = useState(false);

  const thumbnail  = product.images[0] ?? null;
  const hasSale    = product.salePrice !== undefined && product.salePrice < product.price;
  const displayPrice = hasSale ? product.salePrice! : product.price;
  const outOfStock = !isInStock(product);
  const wishlisted = isWishlisted(product.id);

  // Badge logic
  const badge = outOfStock
    ? { label: "Out of Stock", cls: "bg-gray-600 text-white" }
    : hasSale
    ? { label: "Sale", cls: "bg-brand-terracotta text-white" }
    : product.isFeatured
    ? { label: "Best Seller", cls: "bg-amber-500 text-white" }
    : product.stockQty > 0 && product.stockQty <= product.lowStockThreshold
    ? { label: "Low Stock", cls: "bg-amber-500 text-white" }
    : null;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock || adding) return;
    setAdding(true);
    addItem(
      {
        productId: product.id,
        slug:      product.slug,
        title:     product.title,
        price:     displayPrice,
        image:     product.images[0] ?? "",
      },
      1
    );
    showToast(`${product.title} added to cart!`);
    setTimeout(() => setAdding(false), 1200);
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle(product.id);
    showToast(
      wishlisted ? "Removed from wishlist" : "Added to wishlist ♡",
      wishlisted ? "info" : "success"
    );
  }

  return (
    <article className="group relative flex flex-col rounded-2xl overflow-hidden border border-brand-border bg-brand-white hover:border-brand-terracotta hover:shadow-lg transition-all duration-300">
      {/* Image area */}
      <div className="relative aspect-square bg-brand-ivory overflow-hidden">
        <Link href={`/product/${product.slug}`} className="block w-full h-full" aria-label={product.title}>
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-sm text-brand-muted">No image</span>
            </div>
          )}
        </Link>

        {/* Badge */}
        {badge && (
          <span className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide z-10 ${badge.cls}`}>
            {badge.label}
          </span>
        )}

        {/* Wishlist button */}
        <button
          type="button"
          onClick={handleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={[
            "absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200",
            wishlisted
              ? "bg-brand-terracotta text-white shadow-md"
              : "bg-white/80 text-brand-stone hover:bg-brand-terracotta hover:text-white opacity-0 group-hover:opacity-100 shadow-sm",
          ].join(" ")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

        {/* Hover overlay with actions */}
        <div className="absolute inset-0 bg-brand-brown/0 group-hover:bg-brand-brown/10 transition-colors duration-300 pointer-events-none" />

        {/* Quick View + Add to Cart — slide up on hover */}
        <div className="absolute bottom-0 left-0 right-0 flex gap-2 p-2.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Link
            href={`/product/${product.slug}`}
            className="flex-1 text-center bg-white/95 text-brand-brown text-xs font-semibold py-2 rounded-lg hover:bg-brand-ivory transition-colors shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            View Product
          </Link>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock || adding}
            className={[
              "flex-1 text-xs font-semibold py-2 rounded-lg transition-colors shadow-sm",
              outOfStock
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : adding
                ? "bg-emerald-600 text-white"
                : "bg-brand-terracotta text-white hover:bg-brand-terracotta-dark",
            ].join(" ")}
          >
            {adding ? "Added ✓" : outOfStock ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-1.5 p-3.5 sm:p-4 flex-1">
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-serif text-sm sm:text-base font-semibold text-brand-brown leading-snug line-clamp-2 hover:text-brand-terracotta transition-colors">
            {product.title}
          </h3>
        </Link>

        {/* Price row */}
        <div className="flex items-baseline gap-2 mt-auto pt-1">
          <span className="text-brand-terracotta font-bold text-sm sm:text-base">
            {formatPrice(displayPrice)}
          </span>
          {hasSale && (
            <span className="text-brand-muted text-xs line-through">{formatPrice(product.price)}</span>
          )}
        </div>

        {/* Stock indicator */}
        {!outOfStock && product.stockQty > 0 && product.stockQty <= product.lowStockThreshold && (
          <p className="text-[11px] text-amber-600 font-medium">Only {product.stockQty} left!</p>
        )}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Main component — URL is the single source of truth for category filter
// ---------------------------------------------------------------------------

export default function ShopFilters({ products, categories }: ShopFiltersProps) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const gridRef      = useRef<HTMLDivElement>(null);

  const urlCategorySlug = searchParams.get("category");

  // Derive categoryIds from URL on every render — URL is authoritative
  const urlCategoryIds = useMemo(
    () => resolveSlugToIds(urlCategorySlug, categories),
    [urlCategorySlug, categories]
  );

  // Non-URL filters live in local state
  const [occasionTags, setOccasionTags] = useState(new Set<string>());
  const [priceMin, setPriceMin]         = useState("");
  const [priceMax, setPriceMax]         = useState("");
  const [inStockOnly, setInStockOnly]   = useState(false);
  const [sort, setSort]                 = useState<SortKey>("newest");
  const [drawerOpen, setDrawerOpen]     = useState(false);

  // Combined filters (merge URL-derived category with local state)
  const filters: Filters = {
    categoryIds: urlCategoryIds,
    occasionTags,
    priceMin,
    priceMax,
    inStockOnly,
  };

  // When a category checkbox is toggled, write it to the URL
  const toggleCategory = useCallback((id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    if (urlCategorySlug === cat.slug) {
      // Deselect: clear URL param
      router.replace("/shop", { scroll: false });
    } else {
      router.replace(`/shop?category=${cat.slug}`, { scroll: false });
    }
    // Close mobile drawer and scroll to grid
    setDrawerOpen(false);
    setTimeout(() => gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }, [categories, router, urlCategorySlug]);

  const clearFilters = useCallback(() => {
    router.replace("/shop", { scroll: false });
    setOccasionTags(new Set());
    setPriceMin("");
    setPriceMax("");
    setInStockOnly(false);
  }, [router]);

  // Occasion tags derived from all products
  const allOccasionTags = useMemo<string[]>(() => {
    const set = new Set<string>();
    for (const p of products) for (const tag of p.occasionTags) set.add(tag);
    return Array.from(set).sort();
  }, [products]);

  // Product matching — a product matches a category filter if:
  // - its categoryId OR subCategoryId matches any checked id, OR
  // - its categoryId matches a child of any checked parent id
  const childIds = useMemo(() => {
    const map = new Map<string, string[]>();
    categories.forEach((c) => {
      if (c.parentId) {
        if (!map.has(c.parentId)) map.set(c.parentId, []);
        map.get(c.parentId)!.push(c.id);
      }
    });
    return map;
  }, [categories]);

  const displayedProducts = useMemo<Product[]>(() => {
    const minPrice = priceMin !== "" ? parseFloat(priceMin) : null;
    const maxPrice = priceMax !== "" ? parseFloat(priceMax) : null;

    const filtered = products.filter((p) => {
      // Category filter
      if (urlCategoryIds.size > 0) {
        // Expand each selected id to also include its children
        const expanded = new Set<string>();
        urlCategoryIds.forEach((id) => {
          expanded.add(id);
          childIds.get(id)?.forEach((cid) => expanded.add(cid));
        });
        const matches =
          expanded.has(p.categoryId) ||
          (p.subCategoryId !== undefined && expanded.has(p.subCategoryId));
        if (!matches) return false;
      }

      if (occasionTags.size > 0 && !p.occasionTags.some((t) => occasionTags.has(t))) return false;

      const ep = effectivePrice(p);
      if (minPrice !== null && ep < minPrice) return false;
      if (maxPrice !== null && ep > maxPrice) return false;
      if (inStockOnly && !isInStock(p)) return false;
      return true;
    });

    switch (sort) {
      case "price-asc":  filtered.sort((a, b) => effectivePrice(a) - effectivePrice(b)); break;
      case "price-desc": filtered.sort((a, b) => effectivePrice(b) - effectivePrice(a)); break;
    }
    return filtered;
  }, [products, urlCategoryIds, occasionTags, priceMin, priceMax, inStockOnly, sort, childIds]);

  const filterPanelProps = {
    filters,
    categories,
    allOccasionTags,
    onToggleCategory: toggleCategory,
    onToggleOccasion: (tag: string) => {
      setOccasionTags((prev) => { const n = new Set(prev); n.has(tag) ? n.delete(tag) : n.add(tag); return n; });
    },
    onPriceChange: (field: "priceMin" | "priceMax", value: string) => {
      field === "priceMin" ? setPriceMin(value) : setPriceMax(value);
    },
    onToggleInStock: () => setInStockOnly((v) => !v),
    onClear: clearFilters,
  };

  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center gap-5 text-center">
        <p className="font-serif text-2xl text-brand-stone">No products yet — check back soon!</p>
        <p className="text-sm text-brand-muted max-w-xs">We&apos;re putting the finishing touches on our collection.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <p className="text-sm text-brand-stone">
          {displayedProducts.length} {displayedProducts.length === 1 ? "product" : "products"}
          {urlCategorySlug && (
            <span className="ml-2 text-brand-muted text-xs">
              in {categories.find((c) => c.slug === urlCategorySlug)?.name ?? urlCategorySlug}
              {" "}·{" "}
              <Link href="/shop" className="text-brand-terracotta underline underline-offset-2 hover:text-brand-terracotta-dark transition-colors">
                All products
              </Link>
            </span>
          )}
        </p>
        <div className="flex items-center gap-3">
          <div>
            <label htmlFor="sort-select" className="sr-only">Sort products</label>
            <select id="sort-select" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-lg border border-brand-border bg-brand-white px-3 py-2 text-sm text-brand-brown focus:outline-none focus:border-brand-terracotta transition-colors cursor-pointer">
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
          <button type="button" onClick={() => setDrawerOpen((v) => !v)}
            className="lg:hidden flex items-center gap-2 rounded-lg border border-brand-border bg-brand-white px-3 py-2 text-sm text-brand-brown hover:border-brand-terracotta transition-colors min-h-[44px]"
            aria-expanded={drawerOpen} aria-controls="mobile-filter-drawer">
            <FilterIcon />
            Filters
            {hasActiveFilters(filters) && (
              <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-brand-terracotta text-brand-white text-[10px] font-semibold px-1">
                {filters.categoryIds.size + filters.occasionTags.size +
                  (priceMin !== "" || priceMax !== "" ? 1 : 0) + (inStockOnly ? 1 : 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <div id="mobile-filter-drawer" className="lg:hidden mb-6 rounded-2xl border border-brand-border bg-brand-white p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="font-serif text-base font-semibold text-brand-brown">Filters</span>
            <button type="button" onClick={() => setDrawerOpen(false)}
              className="text-brand-stone hover:text-brand-terracotta transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close filters">
              <XIcon />
            </button>
          </div>
          <FilterPanelContent {...filterPanelProps} />
        </div>
      )}

      {/* Layout: sidebar + grid */}
      <div className="flex gap-8 items-start">
        <aside className="hidden lg:block w-56 shrink-0 rounded-2xl border border-brand-border bg-brand-white p-5 sticky top-20" aria-label="Product filters">
          <div className="flex items-center justify-between mb-4">
            <span className="font-serif text-base font-semibold text-brand-brown">Filters</span>
            {hasActiveFilters(filters) && (
              <button type="button" onClick={clearFilters}
                className="text-xs text-brand-terracotta hover:text-brand-terracotta-dark underline underline-offset-2 transition-colors">
                Clear all
              </button>
            )}
          </div>
          <FilterPanelContent {...filterPanelProps} />
        </aside>

        <div ref={gridRef} className="flex-1 min-w-0">
          {displayedProducts.length === 0 ? (
            <div className="flex flex-col items-center gap-5 py-20 text-center">
              <p className="font-serif text-xl text-brand-stone">No products match your filters</p>
              <p className="text-sm text-brand-muted">Try adjusting or removing some filters.</p>
              <button type="button" onClick={clearFilters}
                className="inline-block px-6 py-2.5 rounded-full bg-brand-terracotta text-brand-white text-sm font-medium hover:bg-brand-terracotta-dark transition-colors min-h-[44px]">
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {displayedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
