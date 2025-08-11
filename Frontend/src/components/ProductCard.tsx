import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Props = {
  title: string;
  price: number;
  imageSrc?: string;
  onAdd?: (qty: number) => void; // changed: pass quantity
  linkTo?: string;
};

export default function ProductCard({
  title,
  price,
  imageSrc,
  onAdd,
  linkTo,
}: Props) {
  const fmt = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  });
  const [qty, setQty] = useState<number>(1);

  const dec = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQty((q) => Math.max(1, q - 1));
  };
  const inc = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQty((q) => q + 1);
  };
  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAdd?.(qty);
  };

  return (
    <div className="group mx-auto w-full max-w-[22rem] rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      {linkTo ? (
        <Link href={linkTo} className="block">
          <div className="relative aspect-square w-full overflow-hidden rounded-t-xl bg-slate-100">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={title}
                fill
                priority
                sizes="(min-width:1024px) 352px, (min-width:640px) 320px, 100vw"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                No image
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="line-clamp-2 text-sm font-medium text-slate-900">
              {title}
            </h3>
          </div>
        </Link>
      ) : (
        <>
          <div className="relative aspect-square w-full overflow-hidden rounded-t-xl bg-slate-100">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={title}
                fill
                priority
                sizes="(min-width:1024px) 352px, (min-width:640px) 320px, 100vw"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                No image
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="line-clamp-2 text-sm font-medium text-slate-900">
              {title}
            </h3>
          </div>
        </>
      )}

      <div className="flex items-center justify-between gap-3 px-4 pb-4">
        <span className="text-base font-semibold text-slate-900">
          {fmt.format(price)}
        </span>
        <div className="ml-auto mr-2 inline-flex items-center gap-2">
          <button
            type="button"
            onClick={dec}
            className="h-8 w-8 rounded border text-slate-700 hover:bg-red-500"
            aria-label="Decrease"
          >
            −
          </button>
          <span className="w-6 text-center text-sm">{qty}</span>
          <button
            type="button"
            onClick={inc}
            className="h-8 w-8 rounded border text-slate-700 hover:bg-emerald-500"
            aria-label="Increase"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={handleAddClick}
          className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          aria-label={`Add ${title} to cart`}
        >
          Add
        </button>
      </div>
    </div>
  );
}
