"use client";

import { useCart } from "@/context/CartContext";
import Image from "next/image";
import Link from "next/link";

export default function CartPage() {
  const { items, setQuantity, removeItem, clear, total } = useCart();

  const inc = (id: string, qty: number) => setQuantity(id, qty + 1);
  const dec = (id: string, qty: number) => setQuantity(id, qty - 1);

  return (
    <main className="mx-auto max-w-5xl px-4 pt-24">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Your Cart</h1>

      {items.length === 0 ? (
        <div className="rounded-md border border-slate-200 p-6 text-slate-600">
          Your cart is empty.{" "}
          <Link className="text-emerald-600 hover:underline" href="/products">
            Browse products
          </Link>
          .
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            {items.map((i) => (
              <div
                key={i.productId}
                className="flex items-center gap-4 rounded-md border border-slate-200 p-3"
              >
                <div className="h-16 w-16 overflow-hidden rounded bg-slate-100">
                  {i.imageUrl ? (
                    <Image
                      src={i.imageUrl}
                      alt={i.name}
                      width={64}
                      height={64}
                      className="h-16 w-16 object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center text-xs text-slate-400">
                      No image
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-slate-900">{i.name}</div>
                  <div className="text-sm text-slate-600">
                    € {i.price.toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded border px-2 py-1 text-slate-700 hover:bg-red-500"
                    onClick={() => dec(i.productId, i.quantity)}
                    aria-label="Decrease"
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{i.quantity}</span>
                  <button
                    className="rounded border px-2 py-1 text-slate-700 hover:bg-emerald-500"
                    onClick={() => inc(i.productId, i.quantity)}
                    aria-label="Increase"
                  >
                    +
                  </button>
                </div>
                <button
                  className="ml-2 rounded border px-2 py-1 text-red-600 hover:bg-red-500 hover:text-white"
                  onClick={() => removeItem(i.productId)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <aside className="h-fit rounded-md border border-slate-200 p-4">
            <div className="mb-2 flex justify-between">
              <span className="text-slate-700">Subtotal</span>
              <span className="font-semibold text-slate-900">
                € {total.toFixed(2)}
              </span>
            </div>
            <p className="mb-4 text-xs text-slate-500">
              Taxes and shipping calculated at checkout.
            </p>
            <button className="mb-2 w-full rounded-md bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-600">
              Checkout
            </button>
            <button
              className="w-full rounded-md border px-4 py-2 text-slate-700 hover:bg-red-500"
              onClick={clear}
            >
              Clear cart
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}
