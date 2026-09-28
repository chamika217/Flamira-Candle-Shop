import { getProducts, getProductById } from "@/lib/productService";
import { getCategories } from "@/lib/categoryService";
import { getSettings } from "@/lib/settingsService";
import TopAnnouncementBar from "@/components/home/TopAnnouncementBar";
import HeroModern from "@/components/home/HeroModern";
import TrustFeatures from "@/components/home/TrustFeatures";
import CategoryShowcase from "@/components/home/CategoryShowcase";
import BestSellersSection from "@/components/home/BestSellersSection";
import ArtisanStorySection from "@/components/home/ArtisanStorySection";
import CustomOrderCallout from "@/components/home/CustomOrderCallout";
import ReviewsSection from "@/components/home/ReviewsSection";
import NewsletterSection from "@/components/home/NewsletterSection";
import type { Product, Category } from "@/lib/types";

export const revalidate = 60; // Revalidate home page every 60 seconds

export default async function HomePage() {
  // Fetch settings, categories, and products in parallel.
  // Errors are caught individually so one failure doesn't crash the whole page.
  const [settings, categories] = await Promise.all([
    getSettings().catch(() => null),
    getCategories().catch(() => [] as Category[]),
  ]);

  // Best Sellers: if admin has pinned specific product IDs, use those in order.
  // Otherwise fall back to products with isFeatured === true.
  const pinnedIds = settings?.featuredProductIds ?? [];
  let featuredProducts: Product[] = [];

  try {
    if (pinnedIds.length > 0) {
      const fetched = await Promise.all(
        pinnedIds.map((id) => getProductById(id).catch(() => null))
      );
      featuredProducts = fetched.filter((p): p is Product => p !== null);
    } else {
      featuredProducts = await getProducts({ featured: true }).catch(() => []);
    }
  } catch {
    featuredProducts = [];
  }

  // If no featured products found in Firestore, fetch any active products
  if (featuredProducts.length === 0) {
    try {
      featuredProducts = await getProducts({ featured: true }).catch(() => []);
    } catch {
      featuredProducts = [];
    }
  }

  // Serialize Timestamps before passing products to client sub-components
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serializedFeatured: Product[] = featuredProducts.map((p: Product): any => ({
    ...p,
    createdAt: p.createdAt?.toDate?.().toISOString() ?? null,
    updatedAt: p.updatedAt?.toDate?.().toISOString() ?? null,
  }));

  // Banner fields from Admin Settings
  const bannerImageUrl = settings?.bannerImageUrl;
  const bannerHeadline = settings?.bannerHeadline?.trim() || null;
  const bannerSubtext  = settings?.bannerSubtext?.trim()  || null;

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Top Ticker Marquee Announcement */}
      <TopAnnouncementBar />

      {/* 2. Modern 3D Hero Section */}
      <HeroModern
        bannerImageUrl={bannerImageUrl}
        bannerHeadline={bannerHeadline}
        bannerSubtext={bannerSubtext}
      />

      {/* 3. Interactive Trust & Feature Cards */}
      <TrustFeatures />

      {/* 4. Curated Shop by Category Showcase */}
      <CategoryShowcase categories={categories} />

      {/* 5. Best Sellers & Interactive Product Showcase */}
      <BestSellersSection products={serializedFeatured} />

      {/* 6. Artisan Storytelling & Handcrafted Experience */}
      <ArtisanStorySection />

      {/* 7. Bespoke Custom Orders & Wedding Hampers Callout */}
      <CustomOrderCallout />

      {/* 8. Social Proof & Customer Reviews Marquee */}
      <ReviewsSection />

      {/* 9. VIP Community Newsletter & Welcome Coupon */}
      <NewsletterSection />
    </div>
  );
}
