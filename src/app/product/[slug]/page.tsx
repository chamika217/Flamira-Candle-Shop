import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/productService";
import ProductDetailView from "@/components/ProductDetailView";
import type { Product } from "@/lib/types";

// ---------------------------------------------------------------------------
// Serialize Firestore Timestamps before passing to client components
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeProduct(p: Product): any {
  return {
    ...p,
    createdAt: p.createdAt?.toDate?.().toISOString() ?? null,
    updatedAt: p.updatedAt?.toDate?.().toISOString() ?? null,
  };
}

// ---------------------------------------------------------------------------
// Dynamic SEO metadata per product
// ---------------------------------------------------------------------------

export async function generateMetadata(
  props: PageProps<"/product/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Product not found | Flamira" };
  }

  const description =
    product.seo?.description?.trim()
      ? product.seo.description
      : product.shortDesc?.trim()
        ? product.shortDesc
        : "Discover handmade home décor and gifts from Flamira, Sri Lanka.";

  const images = product.images[0]
    ? [{ url: product.images[0], alt: product.title }]
    : undefined;

  return {
    title:       `${product.title} | Flamira`,
    description,
    openGraph: {
      title:       `${product.title} | Flamira`,
      description,
      type:        "website",
      images,
    },
    twitter: {
      card:        "summary_large_image",
      title:       `${product.title} | Flamira`,
      description,
      images:      product.images[0] ? [product.images[0]] : undefined,
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ProductPage(
  props: PageProps<"/product/[slug]">
) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  // Serialize Timestamps before passing to the client component
  return <ProductDetailView product={serializeProduct(product)} />;
}
