import { notFound } from "next/navigation";
import { getProductById } from "@/lib/productService";
import EditProductClient from "./EditProductClient";
import type { Product } from "@/lib/types";

// Serialize Firestore Timestamps before passing to client component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeProduct(p: Product): any {
  return {
    ...p,
    createdAt: p.createdAt?.toDate?.().toISOString() ?? null,
    updatedAt: p.updatedAt?.toDate?.().toISOString() ?? null,
  };
}

export default async function EditProductPage(
  props: PageProps<"/admin/products/[id]/edit">
) {
  const { id } = await props.params;
  const product = await getProductById(id);
  if (!product) notFound();
  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
        <p className="text-sm text-gray-400 mt-0.5">Update the product details below.</p>
      </div>
      <EditProductClient product={serializeProduct(product)} />
    </div>
  );
}
