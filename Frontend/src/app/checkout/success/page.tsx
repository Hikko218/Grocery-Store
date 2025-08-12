// Checkout success page. Clears the cart and shows confirmation message.
"use client";

import { useCart } from "@/context/CartContext";
import { useEffect } from "react";
import Link from "next/link";

export default function SuccessPage() {
  const { clear } = useCart();

  useEffect(() => {
    // Clear cart on backend and locally after successful checkout
    const run = async () => {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL ?? "";
        await fetch(`${API}/cart/clear`, {
          method: "POST",
          credentials: "include",
        });
      } catch {
        // ignore errors
      } finally {
        clear();
      }
    };
    void run();
  }, [clear]);

  return (
    <div className="mx-auto min-h-[70vh] max-w-xl px-4 pt-24">
      <h1 className="mb-4 text-2xl font-bold">Thank you!</h1>
      <p className="mb-6 text-slate-700">
        Your payment was successful. This is a demo shop – no real orders are fulfilled.
      </p>
      <Link href="/profile" className="text-emerald-600 underline">
        View your orders
      </Link>
    </div>
  );
}
