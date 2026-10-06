/**
 * featuredService.ts
 * Manages Featured Products / Best Sellers curation for the Home Page.
 * Synchronizes with `settings/general` (featuredProductIds) and `products` collection (isFeatured).
 */

import { doc, getDoc, getDocs, collection, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { updateSettings, getSettings } from "@/lib/settingsService";
import { getAllProductsAdmin } from "@/lib/productService";
import type { Product, Settings } from "@/lib/types";

export interface FeaturedItem {
  product: Product;
  order: number;
  active: boolean;
}

/**
 * Returns structured featured products ordered by priority.
 */
export async function getFeaturedProductsList(): Promise<{
  featured: FeaturedItem[];
  allProducts: Product[];
  settings: Settings;
}> {
  const [settings, products] = await Promise.all([
    getSettings().catch(() => ({ deliveryRates: [] }) as Settings),
    getAllProductsAdmin().catch(() => [] as Product[]),
  ]);

  const productMap = new Map<string, Product>(products.map((p) => [p.id, p]));
  const pinnedIds = settings.featuredProductIds ?? [];

  const featured: FeaturedItem[] = [];
  const featuredIdsSet = new Set<string>();

  // 1. First add pinned IDs in priority order
  pinnedIds.forEach((id, index) => {
    const prod = productMap.get(id);
    if (prod) {
      featured.push({
        product: prod,
        order: index + 1,
        active: prod.isFeatured ?? true,
      });
      featuredIdsSet.add(id);
    }
  });

  // 2. Also add any products marked isFeatured: true that were not explicitly in pinnedIds
  products.forEach((prod) => {
    if (prod.isFeatured && !featuredIdsSet.has(prod.id)) {
      featured.push({
        product: prod,
        order: featured.length + 1,
        active: true,
      });
      featuredIdsSet.add(prod.id);
    }
  });

  return {
    featured,
    allProducts: products,
    settings,
  };
}

/**
 * Saves the ordered featured products list and synchronizes both
 * settings/general (featuredProductIds) and individual product isFeatured flags.
 */
export async function saveFeaturedProductsOrder(
  featuredList: { productId: string; active: boolean }[]
): Promise<void> {
  // 1. Filter only active ones for home page pinned list
  const activeIds = featuredList.filter((item) => item.active).map((item) => item.productId);

  // 2. Update settings/general
  await updateSettings({
    featuredProductIds: activeIds,
  });

  // 3. Update products' isFeatured flags in Firestore
  const allIdsInList = new Set(featuredList.map((item) => item.productId));
  const activeIdsSet = new Set(activeIds);

  const updates = Array.from(allIdsInList).map(async (id) => {
    const prodRef = doc(db, "products", id);
    const shouldBeFeatured = activeIdsSet.has(id);
    await updateDoc(prodRef, {
      isFeatured: shouldBeFeatured,
      updatedAt: serverTimestamp(),
    }).catch((err) => {
      console.warn(`[saveFeaturedProductsOrder] Failed updating product ${id}:`, err);
    });
  });

  await Promise.all(updates);
}
