"use client";

import { useRouter } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { createProduct } from "@/lib/productService";
import type { Product } from "@/lib/types";

export default function NewProductPage() {
  const router = useRouter();

  async function handleSubmit(data: Omit<Product, "id" | "createdAt" | "updatedAt">) {
    await createProduct(data);
    router.push("/admin/products");
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Product</h1>
        <p className="text-sm text-gray-400 mt-0.5">Fill in the details below to create a new product.</p>
      </div>
      <ProductForm onSubmit={handleSubmit} />
    </div>
  );
}
