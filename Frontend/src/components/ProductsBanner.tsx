"use client";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import type { Product } from "../lib/products";
import Link from "next/link";
import { fetchProducts } from "@/lib/products";

const TAKE = 12;

export default function ProductsBanner(props: {
  searchTerm?: string;
  category?: string;
  sortBy?: "name" | "price";
  sortOrder?: "asc" | "desc";
  title?: string;
  subtitle?: string;
}) {
  const {
    searchTerm = "",
    category,
    sortBy = "name",
    sortOrder = "asc",
    title = "Featured this week",
    subtitle = "Hand-picked items you might like",
  } = props;
  const [products, setProducts] = useState<Product[]>([]);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { addItem } = useCart();

  // Initial load & reload on search/sort change
  useEffect(() => {
    setProducts([]);
    setSkip(0);
    setHasMore(true);
    loadMore(true);
    // eslint-disable-next-line
  }, [searchTerm, category, sortBy, sortOrder]);

  const loadMore = async (reset = false) => {
    setLoading(true);
    const newProducts = await fetchProducts({
      searchTerm: searchTerm.trim() || undefined,
      category,
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

  const handleAdd = (
    p: {
      productId: string;
      name: string;
      price: number;
      imageUrl?: string | null;
    },
    qty: number
  ) => {
    addItem(
      {
        productId: p.productId,
        name: p.name,
        price: Number(p.price) || 0,
        imageUrl: p.imageUrl ?? undefined,
      },
      qty
    );
  };

  const resultsCount = products.length;

  return (
    <section className="w-full bg-[#AAB7BF]">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
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
              className="mt-2 self-start text-sm font-semibold text-emerald-700 hover:text-emerald-800 sm:mt-0"
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
            {products.map((p) => (
              <ProductCard
                key={p.productId}
                title={p.name}
                price={Number(p.price) || 0}
                imageSrc={p.imageUrl ?? undefined}
                linkTo={`/products/${p.productId}`}
                onAdd={(qty) => handleAdd(p, qty)} // pass quantity
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
