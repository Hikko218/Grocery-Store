"use client";

import { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import type { Product } from "../lib/products";
import Link from "next/link";
import { fetchProducts } from "@/lib/products";

type Props = {
  searchTerm?: string;
  sortBy?: "name" | "price";
  sortOrder?: "asc" | "desc";
  title?: string;
  subtitle?: string;
};

const TAKE = 12;

export default function ProductsBanner({
  searchTerm = "",
  sortBy = "name",
  sortOrder = "asc",
  title = "Featured this week",
  subtitle = "Hand-picked items you might like",
}: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Initial load & reload on search/sort change
  useEffect(() => {
    setProducts([]);
    setSkip(0);
    setHasMore(true);
    loadMore(true);
    // eslint-disable-next-line
  }, [searchTerm, sortBy, sortOrder]);

  const loadMore = async (reset = false) => {
    setLoading(true);
    const newProducts = await fetchProducts({
      searchTerm: searchTerm.trim() || undefined,
      sortBy,
      sortOrder,
      take: TAKE,
      skip: reset ? 0 : skip,
    });
    setProducts((prev) => (reset ? newProducts : [...prev, ...newProducts]));
    setSkip((prev) => (reset ? TAKE : prev + TAKE));
    setHasMore(newProducts.length === TAKE);
    setLoading(false);
  };

  const resultsCount = products.length;

  return (
    <section className="w-full bg-white/70">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {searchTerm ? `Search results for “${searchTerm}”` : title}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {searchTerm
                ? loading
                  ? "Searching…"
                  : `${resultsCount} item${resultsCount === 1 ? "" : "s"} found`
                : subtitle}
            </p>
          </div>
          {!searchTerm && (
            <Link
              href="/products"
              className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              View all →
            </Link>
          )}
        </div>

        {loading && resultsCount === 0 && (
          <div className="text-sm text-slate-600">Loading products…</div>
        )}

        {resultsCount === 0 && !loading && (
          <div className="text-sm text-slate-600">No products found.</div>
        )}

        {resultsCount > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p: Product) => (
              <ProductCard
                key={p.id}
                title={p.name}
                price={p.price ?? 0}
                imageSrc={p.imageUrl ?? undefined}
                linkTo={`/products/${p.productId}`}
                onAdd={() => {
                  // TODO: wire up add-to-cart
                }}
              />
            ))}
          </div>
        )}

        {hasMore && (
          <div className="flex justify-center my-6">
            <button
              onClick={() => loadMore()}
              disabled={loading}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded"
            >
              {loading ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
