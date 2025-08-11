"use client";

import Link from "next/link";
import { UserRound, ShoppingBag, ShoppingCart, Search } from "lucide-react";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();

  const onSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const term = q.trim();
    router.push(
      term ? `/products?searchTerm=${encodeURIComponent(term)}` : "/products"
    );
  };

  return (
    <header className="fixed top-0 z-10 flex w-full flex-row items-center justify-between bg-black/40 py-4 backdrop-blur-sm">
      <div className="ml-4 flex w-1/3 items-center gap-2">
        <Link
          href="/"
          className="md:mb-2 md:flex md:flex-row md:gap-2 md:text-2xl md:font-bold md:text-emerald-500"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500 text-primary">
            <ShoppingBag size={28} />
          </span>
          <span>Grocery Store</span>
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={onSearch} className="flex w-1/3 items-center gap-2 px-2">
        <input
          type="text"
          placeholder="Search products..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="mt-2 w-full rounded-lg bg-white px-3 py-2 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Search products"
        />
        <button
          type="submit"
          className="mt-2 inline-flex items-center justify-center rounded-lg bg-emerald-500 px-3 py-2 text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Submit search"
          title="Search"
        >
          <Search size={18} />
        </button>
      </form>

      <div className="relative flex w-1/3 items-center justify-end gap-4">
        <button
          className="mr-2 text-white hover:text-emerald-500"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Open cart"
          title="Cart"
        >
          <ShoppingCart size={28} />
        </button>
        <button
          className="mr-2 text-white hover:text-emerald-500"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Open user menu"
          title="Account"
        >
          <UserRound size={28} />
        </button>
      </div>

      {menuOpen && (
        <div className="absolute right-0 top-full z-50 min-w-[140px] rounded-b-md bg-black/40 px-4 py-2 backdrop-blur-sm">
          <Link
            href="/profile"
            className="rounded px-2 py-2 text-white transition hover:text-emerald-500"
            onClick={() => setMenuOpen(false)}
          >
            Profile
          </Link>
          <button className="rounded px-2 py-2 text-left text-white transition hover:text-red-500">
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
