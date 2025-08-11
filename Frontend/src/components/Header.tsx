"use client";

import Link from "next/link";
import {
  UserRound,
  ShoppingBag,
  ShoppingCart,
  Search,
  ListFilter,
} from "lucide-react";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const { count } = useCart();
  const { user, loading, loginRedirect, logout } = useAuth();

  const goCart = () => {
    router.push("/cart");
  };

  // Categories dropdown state
  const [catOpen, setCatOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

  const onSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const term = q.trim();
    router.push(
      term ? `/products?searchTerm=${encodeURIComponent(term)}` : "/products"
    );
  };

  const loadCategories = async () => {
    if (categories.length || catLoading) {
      setCatOpen((v) => !v);
      return;
    }
    setCatLoading(true);
    try {
      const res = await fetch(`${API_BASE}/products/categories`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as string[];
        setCategories(data);
        setCatOpen(true);
      } else {
        console.error("Failed to load categories", res.status);
        setCatOpen((v) => !v);
      }
    } catch (e) {
      console.error("Failed to load categories", e);
      setCatOpen(false);
    } finally {
      setCatLoading(false);
    }
  };

  const onSelectCategory = (cat: string) => {
    setCatOpen(false);
    router.push(`/products?category=${encodeURIComponent(cat)}`);
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
          <span className="md:block hidden">Grocery Store</span>
        </Link>
      </div>

      {/* Search + Categories */}
      <form
        onSubmit={onSearch}
        className="relative flex w-1/3 items-center gap-2 px-2"
      >
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
        <button
          type="button"
          onClick={loadCategories}
          className="mt-2 inline-flex items-center justify-center rounded-lg bg-white px-3 py-2 text-primary ring-1 ring-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Browse categories"
          title="Categories"
        >
          <ListFilter size={18} />
        </button>

        {catOpen && (
          <div className="absolute right-2 top-[calc(100%+6px)] z-50 w-64 max-h-72 overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
            {catLoading && (
              <div className="px-3 py-2 text-sm text-slate-600">Loading…</div>
            )}
            {!catLoading && categories.length === 0 && (
              <div className="px-3 py-2 text-sm text-slate-600">
                No categories
              </div>
            )}
            {!catLoading &&
              categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onSelectCategory(c)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-emerald-500"
                >
                  {c}
                </button>
              ))}
          </div>
        )}
      </form>

      <div className="relative flex w-1/3 items-center justify-end gap-4">
        <button
          type="button"
          onClick={goCart}
          className="relative inline-flex items-center justify-center text-white hover:text-emerald-500"
          aria-label="Open cart"
          title="Cart"
        >
          <ShoppingCart size={24} />
          {count > 0 && (
            <span className="absolute -right-2 -top-2 min-w-[18px] rounded-full bg-emerald-500 px-1 text-center text-[11px] font-semibold leading-5 text-white">
              {count}
            </span>
          )}
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
          {user ? (
            <>
              <Link
                href="/profile"
                className="block rounded px-2 py-2 text-white transition hover:text-emerald-500"
                onClick={() => setMenuOpen(false)}
              >
                Profile
              </Link>
              <button
                className="block w-full rounded px-2 py-2 text-left text-white transition hover:text-red-500"
                onClick={async () => {
                  setMenuOpen(false);
                  await logout();
                }}
                disabled={loading}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                className="block w-full rounded px-2 py-2 text-left text-white transition hover:text-emerald-500"
                onClick={() => {
                  setMenuOpen(false);
                  loginRedirect();
                }}
                disabled={loading}
              >
                Login
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
