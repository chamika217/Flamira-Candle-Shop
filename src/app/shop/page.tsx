import { getProducts } from "@/lib/productService";
import { getCategories } from "@/lib/categoryService";
import type { Product, Category } from "@/lib/types";
import ShopFilters from "@/components/ShopFilters";

export const metadata = {
  title: "Shop — Flamira",
  description:
    "Browse our full collection of handmade home décor and gifts, delivered island-wide.",
};

/**
 * Firestore Timestamp objects are not serializable across the server→client
 * boundary in Next.js. Convert them to ISO strings (or null) before passing
 * to a client component.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeProduct(p: Product): any {
  return {
    ...p,
    createdAt: p.createdAt?.toDate?.().toISOString() ?? null,
    updatedAt: p.updatedAt?.toDate?.().toISOString() ?? null,
  };
}

export default async function ShopPage(props: PageProps<"/shop">) {
  const searchParams = await props.searchParams;

  const initialCategorySlug =
    typeof searchParams.category === "string" ? searchParams.category : null;

  const [products, categories] = await Promise.all([
    getProducts().catch(() => [] as Product[]),
    getCategories().catch(() => [] as Category[]),
  ]);

  // Serialize Timestamps before passing to the client component
  const serializedProducts = products.map(serializeProduct);

  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="bg-brand-ivory border-b border-brand-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-brand-brown">
            Shop
          </h1>
          <p className="mt-2 text-brand-stone text-sm sm:text-base">
            Handmade in Sri Lanka — Cash on Delivery, island-wide.
          </p>
        </div>
      </div>

      <ShopFilters
        products={serializedProducts}
        categories={categories}
        initialCategorySlug={initialCategorySlug}
      />
    </div>
  );
}
