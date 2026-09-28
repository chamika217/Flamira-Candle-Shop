import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/productService";
import { getCategories } from "@/lib/categoryService";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ---- Static routes ----
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,                           priority: 1.0,  changeFrequency: "weekly" },
    { url: `${BASE_URL}/shop`,                       priority: 0.9,  changeFrequency: "daily"  },
    { url: `${BASE_URL}/about`,                      priority: 0.7,  changeFrequency: "monthly"},
    { url: `${BASE_URL}/contact`,                    priority: 0.7,  changeFrequency: "monthly"},
    { url: `${BASE_URL}/custom`,                     priority: 0.7,  changeFrequency: "monthly"},
    { url: `${BASE_URL}/track`,                      priority: 0.4,  changeFrequency: "monthly"},
    { url: `${BASE_URL}/policies/delivery-returns`,  priority: 0.4,  changeFrequency: "monthly"},
    { url: `${BASE_URL}/policies/faq`,               priority: 0.4,  changeFrequency: "monthly"},
    { url: `${BASE_URL}/policies/terms`,             priority: 0.3,  changeFrequency: "yearly" },
    { url: `${BASE_URL}/policies/privacy`,           priority: 0.3,  changeFrequency: "yearly" },
  ];

  // ---- Active products ----
  const products = await getProducts({ status: "active" }).catch(() => []);
  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url:             `${BASE_URL}/product/${p.slug}`,
    lastModified:    p.updatedAt?.toDate?.() ?? new Date(),
    priority:        0.8,
    changeFrequency: "weekly",
  }));

  // ---- Categories ----
  const categories = await getCategories().catch(() => []);
  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url:             `${BASE_URL}/category/${c.slug}`,
    priority:        0.7,
    changeFrequency: "weekly",
  }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}
