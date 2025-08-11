"use client";

import Image from "next/image";
import type { Product } from "@/lib/products";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useState } from "react";

type Props = {
  product: Product;
  onAdd?: (p: Product, qty: number) => void; // changed: pass product + quantity
};

export default function ProductDetails({ product, onAdd }: Props) {
  const router = useRouter();
  const { addItem } = useCart();
  const [qty, setQty] = useState<number>(1);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1)
      router.back();
    else router.push("/products");
  };

  const dec = () => setQty((q) => Math.max(1, q - 1));
  const inc = () => setQty((q) => q + 1);

  const handleAddLocal = () => {
    if (onAdd) {
      onAdd(product, qty);
      return;
    }
    addItem(
      {
        productId: product.productId,
        name: product.name,
        price: Number(product.price ?? 0),
        imageUrl: product.imageUrl ?? undefined,
      },
      qty
    );
  };

  const {
    name,
    brand,
    category,
    description,
    quantity,
    packaging,
    country,
    ingredients,
    calories,
    price,
    imageUrl,
  } = product;

  const fmt = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  });

  return (
    <section className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 md:grid-cols-2">
      {/* Back button */}
      <div className="md:col-span-2 -mt-4 mb-2">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          aria-label="Go back"
        >
          ← Back
        </button>
      </div>

      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            priority
            sizes="(min-width:1024px) 40vw, (min-width:640px) 60vw, 90vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            No image
          </div>
        )}
      </div>

      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
        {brand && <p className="mt-1 text-sm text-slate-600">Brand: {brand}</p>}
        <p className="mt-4 text-2xl font-semibold text-slate-900">
          {fmt.format(price ?? 0)}
        </p>
        <p className="mt-4 text-xl font-semibold text-slate-800">
          {description}
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 text-sm text-slate-700 md:grid-cols-2">
          {category && (
            <p>
              <span className="font-medium">Category:</span> {category}
            </p>
          )}
          {quantity && (
            <p>
              <span className="font-medium">Quantity:</span> {quantity}
            </p>
          )}
          {packaging && (
            <p>
              <span className="font-medium">Packaging:</span> {packaging}
            </p>
          )}
          {country && (
            <p>
              <span className="font-medium">Country:</span> {country}
            </p>
          )}
          {calories && (
            <p>
              <span className="font-medium">Calories:</span> {calories}
            </p>
          )}
        </div>

        {ingredients && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-slate-900">
              Ingredients
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-700">
              {ingredients}
            </p>
          </div>
        )}

        <div className="mt-8 flex items-center gap-4">
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={dec}
              className="h-9 w-9 rounded border text-slate-700 hover:bg-red-500"
              aria-label="Decrease"
            >
              −
            </button>
            <span className="w-8 text-center text-sm">{qty}</span>
            <button
              type="button"
              onClick={inc}
              className="h-9 w-9 rounded border text-slate-700 hover:bg-emerald-500"
              aria-label="Increase"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddLocal}
            className="rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          >
            Add to cart
          </button>
        </div>
      </div>
    </section>
  );
}
