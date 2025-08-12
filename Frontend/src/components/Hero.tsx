import React from "react";
import Image from "next/image";
import ProductsBanner from "./ProductsBanner";
import Link from "next/link";

export default function Hero() {
  return (
    <>
    <section className="relative min-h-[50vh] w-full overflow-hidden">
      {/* Background-Picture */}
      <div className="absolute inset-0 -z-20">
        <Image
          src="/Hero_bg.jpg"
          alt=""
          fill
          priority
          className="object-cover object-center"
        />
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-24 text-center md:py-24">
        <h1 className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
          Fresh and <span className="text-emerald-500">Organic</span> Products
        </h1>

        <p className="mx-auto mt-3 max-w-2xl text-sm text-white md:mt-4 md:text-base">
          Discover fresh quality at fair prices. Browse categories, add to cart, and check out in minutes.
        </p>

        <div className="mt-7 flex justify-center">
          <Link
            href="/products"
            className="inline-flex items-center rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50"
            aria-label="Jetzt einkaufen"
          >
            Shop now
          </Link>
        </div>
      </div>
    </section>

    {/* Product banner (fetched with React Query) */}
      <ProductsBanner sortBy="price" sortOrder="asc" />
      </>
  );
}
