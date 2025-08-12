"use client";

import Link from "next/link";
import { FormEvent } from "react";

// Footer component
export default function Footer() {
  const year = new Date().getFullYear();

  // Handle newsletter submit (demo only)
  const onSubscribe = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: send to newsletter API
  };

  // Render footer with typical shop sections
  return (
    <footer className="w-full border-t border-white/10 bg-black/70 text-slate-200">
      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* Top grid: brand, shop links, help, newsletter */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand / About */}
          <div>
            <div className="flex items-center gap-2 text-lg font-semibold">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500 text-black">
                GS
              </span>
              <span>Grocery Store</span>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              Fresh products, fair prices, fast delivery. Your daily essentials
              in one place.
            </p>

            {/* Social links */}
            <div className="mt-4 flex gap-3">
              {/* Use accessible labels; replace href with real profiles */}
              <a
                href="#"
                aria-label="Visit us on Instagram"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 hover:bg-white/10"
              >
                {/* Minimal Instagram-like glyph */}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="5"
                    stroke="currentColor"
                  />
                  <circle cx="12" cy="12" r="4.5" stroke="currentColor" />
                  <circle cx="17.5" cy="6.5" r="1.25" fill="currentColor" />
                </svg>
              </a>
              <a
                href="#"
                aria-label="Visit us on Facebook"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 hover:bg-white/10"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M14 9h3V6h-3c-1.657 0-3 1.343-3 3v2H8v3h3v7h3v-7h3l1-3h-4V9c0-.552.448-1 1-1Z"
                    fill="currentColor"
                  />
                </svg>
              </a>
              <a
                href="#"
                aria-label="Visit us on X"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 hover:bg-white/10"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 4l7 8.5L4.5 20H7l5-6.2L16.5 20H20l-7.1-8.6L19.5 4H17l-4.6 5.7L8.5 4H4Z"
                    fill="currentColor"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* Shop links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Shop
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300/90">
              <li>
                <Link href="/products" className="hover:text-white">
                  All products
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-white">
                  Deals & offers
                </Link>
              </li>
            </ul>
          </div>

          {/* Help / Support */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Help
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300/90">
              <li>
                <Link href="/" replace prefetch={false} className="hover:text-white">
                  Customer support
                </Link>
              </li>
              <li>
                <Link href="/" replace prefetch={false} className="hover:text-white">
                  Shipping & returns
                </Link>
              </li>
              <li>
                <Link href="/" replace prefetch={false} className="hover:text-white">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/" replace prefetch={false} className="hover:text-white">
                  Order tracking
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Newsletter
            </h3>
            <p className="mt-3 text-sm text-slate-400">
              Sign up for fresh deals and weekly highlights. You can unsubscribe
              at any time.
            </p>
            <form onSubmit={onSubscribe} className="mt-4 flex gap-2">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-400/60"
              />
              <button
                type="button"
                className="whitespace-nowrap rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400"
              >
                Subscribe
              </button>
            </form>
            <p className="mt-2 text-xs text-slate-400">
              By subscribing you agree to our{" "}
              <Link href="/" replace prefetch={false} className="underline hover:text-white">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Bottom bar: payments, legal, copyright */}
        <div className="mt-10 flex flex-col gap-6 border-t border-white/10 pt-6 md:flex-row md:items-center md:justify-between">
          {/* Payment badges (placeholders) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Keep generic to avoid trademarks; replace with real badges if needed */}
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300">
              VISA
            </span>
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300">
              Mastercard
            </span>
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300">
              PayPal
            </span>
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300">
              Apple Pay
            </span>
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300">
              Google Pay
            </span>
          </div>

          {/* Legal links */}
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-300/90">
            <Link href="/" replace prefetch={false} className="hover:text-white">
              Imprint
            </Link>
            <Link href="/" replace prefetch={false} className="hover:text-white">
              Privacy
            </Link>
            <Link href="/" replace prefetch={false} className="hover:text-white">
              Terms
            </Link>
            <Link href="/" replace prefetch={false} className="hover:text-white">
              Cookies
            </Link>
            <Link href="/" replace prefetch={false} className="hover:text-white">
              Contact
            </Link>
          </nav>

          {/* Copyright and author info */}
          <div className="flex flex-row text-sm text-slate-400">
            <span className="align-middle text-slate-300 mr-1">© {year}</span>{" "}
            <span className="align-middle mr-1">H.Ries</span> • All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
