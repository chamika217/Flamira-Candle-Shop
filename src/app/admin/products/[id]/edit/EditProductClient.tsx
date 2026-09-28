"use client";

import { useRouter } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { updateProduct } from "@/lib/productService";
import type { Product } from "@/lib/types";

export default function EditProductClient({ product }: { product: Product }) {
  const router = useRouter();

  async function handleSubmit(data: Omit<Product, "id" | "createdAt" | "updatedAt">) {
    await updateProduct(product.id, data);
    router.push("/admin/products");
  }

  return <ProductForm initialData={product} onSubmit={handleSubmit} />;
}
