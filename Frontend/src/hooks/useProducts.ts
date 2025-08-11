"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProducts, fetchProductById, type Product } from "@/lib/products";

export function useProducts(params?: {
  searchTerm?: string;
  sortBy?: "name" | "price";
  sortOrder?: "asc" | "desc";
}) {
  const { searchTerm = "", sortBy = "name", sortOrder = "asc" } = params || {};
  return useQuery<Product[], Error>({
    queryKey: ["products", { searchTerm, sortBy, sortOrder }],
    queryFn: () => fetchProducts({ searchTerm, sortBy, sortOrder }),
    staleTime: 60_000,
  });
}

export function useProduct(productId: string | number) {
  return useQuery<Product, Error>({
    queryKey: ["product", String(productId)],
    queryFn: () => fetchProductById(productId),
    enabled: !!productId,
    staleTime: 60_000,
  });
}
