// Renders the shop header with navigation, search bar, category dropdown, cart icon, and user menu.
// Handles search, category selection, and user authentication actions.
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
  const isAdmin = (user?.role ?? "").toLowerCase() === "admin";

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
      <div className="ml-4 flex md:w-1/3 w-1/4 items-center gap-2">
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
        className="relative flex md:w-1/3 w-2/4 items-center px-2"
      >
        <div className="flex w-full items-stretch overflow-hidden rounded-lg bg-white ring-1 ring-slate-300">
          <input
            type="text"
            placeholder="Search products…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-10 flex-1 min-w-0 bg-transparent px-3 text-sm text-primary outline-none"
            aria-label="Search products"
          />
          <button
            type="submit"
            className="h-10 shrink-0 px-3 bg-emerald-500 text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Submit search"
            title="Search"
          >
            <Search size={18} />
          </button>
          <button
            type="button"
            onClick={loadCategories}
            className="h-10 shrink-0 border-l border-slate-300 bg-white px-3 text-primary hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Browse categories"
            title="Categories"
          >
            <ListFilter size={18} />
          </button>
        </div>

        {catOpen && (
          <div className="absolute right-2 top-[calc(100%+6px)] z-50 max-h-72 w-64 overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
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

      <div className="relative flex md:w-1/3 w-1/4 items-center justify-end gap-4">
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
        <div className="absolute right-0 top-full z-50 min-w-[160px] rounded-b-md bg-black/40 px-4 py-2 backdrop-blur-sm">
          {!loading && user ? (
            <>
              {isAdmin ? (
                <a
                  href="/admin"
                  className="block px-2 py-1 text-sm text-white hover:text-emerald-400"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </a>
              ) : (
                <a
                  href="/profile"
                  className="block px-2 py-1 text-sm text-white hover:text-emerald-400"
                  onClick={() => setMenuOpen(false)}
                >
                  Profile
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="block w-full px-2 py-1 text-left text-sm text-white hover:text-red-500"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                loginRedirect();
              }}
              className="block w-full px-2 py-1 text-left text-sm text-white hover:text-emerald-400"
            >
              Login
            </button>
          )}
        </div>
      )}
    </header>
  );
}
