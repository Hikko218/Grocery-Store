import React from "react";
import Image from "next/image";
import Link from "next/link";

type Props = {
  title: string;
  price: number;
  imageSrc?: string; // optional; if missing, a placeholder is shown
  onAdd?: () => void;
  linkTo?: string;
};

export default function ProductCard({ title, price, imageSrc, onAdd, linkTo }: Props) {
  const content = (
    <>
      <div className="group w-full max-w-[20rem] sm:max-w-[22rem] mx-auto rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
        {/* Image area */}
        <div className="relative aspect-square w-full overflow-hidden rounded-t-xl bg-slate-100">
          {imageSrc ? (
            // If you prefer Next/Image, you can swap this <img> for <Image>
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

        {/* Content */}
        <div className="p-4">
          <h3 className="line-clamp-2 text-sm font-medium text-slate-900">
            {title}
          </h3>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-base font-semibold text-slate-900">
              € {price.toFixed(2)}
            </span>
            <button
              type="button"
              onClick={onAdd}
              className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              aria-label={`Add ${title} to cart`}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </>
  );
  return (
    <div className="group w-full mx-auto rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      {linkTo ? (
        <Link href={linkTo} className="block">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}
