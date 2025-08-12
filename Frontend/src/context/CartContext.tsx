// Provides global cart state and actions for adding, removing, updating, and syncing cart items with the backend
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { getAuthStatus } from "@/lib/auth";
import { ensureCart, recalculateCart } from "@/lib/cart";
import {
  setServerCartItem,
  deleteServerCartItem,
  clearServerCartItems,
  addCartItems,
} from "@/lib/cartitems";
import { usePathname } from "next/navigation";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, qty: number) => void;
  clear: () => void;
  count: number;
  total: number;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "cart";

// Loads cart items from localStorage, filtering out invalid entries
function loadInitial(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i) =>
        i &&
        typeof i.productId === "string" &&
        typeof i.name === "string" &&
        typeof i.price === "number" &&
        typeof i.quantity === "number"
    );
  } catch {
    return [];
  }
}

// CartProvider manages cart state, local persistence, and backend sync for authenticated users
export function CartProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const migratedRef = useRef(false);

  // Load cart from localStorage on mount, except on profile page
  useEffect(() => {
    if (pathname === "/profile") return;
    const initial = loadInitial();
    setItems(initial);
    setLoaded(true);
  }, [pathname]);

  // Persist cart items to localStorage whenever items change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore storage errors
    }
  }, [items]);

  // On first load, if user is authenticated, migrate local cart to backend and recalculate totals
  useEffect(() => {
    if (!loaded || migratedRef.current) return;
    let cancelled = false;
    (async () => {
      const status = await getAuthStatus();
      if (cancelled) return;
      if (!status.isAuthenticated || !status.userId) return;

      try {
        const cart = await ensureCart(status.userId);
        if (items.length > 0) {
          await addCartItems(
            items.map((i) => ({
              cartId: cart.id,
              productId: i.productId,
              quantity: i.quantity,
            }))
          );
          await recalculateCart(cart.id);
        }
      } catch {
        // ignore migration errors
      } finally {
        migratedRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loaded, items]);

  // Adds an item to the cart, updating quantity if it already exists, and syncs with backend if authenticated
  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, qty: number = 1) => {
      let nextQtyCalculated = qty;
      setItems((prev) => {
        const idx = prev.findIndex((p) => p.productId === item.productId);
        if (idx >= 0) {
          nextQtyCalculated = prev[idx].quantity + qty;
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: nextQtyCalculated };
          return next;
        }
        nextQtyCalculated = qty;
        return [...prev, { ...item, quantity: qty }];
      });

      void (async () => {
        const status = await getAuthStatus();
        if (!status.isAuthenticated || !status.userId) return;
        const cart = await ensureCart(status.userId);
        try {
          await setServerCartItem(cart.id, item.productId, nextQtyCalculated);
          await recalculateCart(cart.id);
        } catch {
          // ignore backend errors
        }
      })();
    },
    []
  );

  // Removes an item from the cart and deletes it from backend cart if authenticated
  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((p) => p.productId !== productId));

    void (async () => {
      const status = await getAuthStatus();
      if (!status.isAuthenticated || !status.userId) return;
      const cart = await ensureCart(status.userId);
      try {
        await deleteServerCartItem(cart.id, productId);
        await recalculateCart(cart.id);
      } catch {
        // ignore backend errors
      }
    })();
  }, []);

  // Sets the quantity for a cart item, removes if qty <= 0, and syncs with backend
  const setQuantity = useCallback((productId: string, qty: number) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.productId === productId);
      if (idx === -1) return prev;
      if (qty <= 0) return prev.filter((p) => p.productId !== productId);
      const next = [...prev];
      next[idx] = { ...next[idx], quantity: qty };
      return next;
    });

    void (async () => {
      const status = await getAuthStatus();
      if (!status.isAuthenticated || !status.userId) return;
      const cart = await ensureCart(status.userId);
      try {
        await setServerCartItem(cart.id, productId, qty);
        await recalculateCart(cart.id);
      } catch {
        // ignore backend errors
      }
    })();
  }, []);

  // Clears all items from the cart and backend cart if authenticated
  const clear = useCallback(() => {
    setItems([]);

    void (async () => {
      const status = await getAuthStatus();
      if (!status.isAuthenticated || !status.userId) return;
      const cart = await ensureCart(status.userId);
      try {
        await clearServerCartItems(cart.id);
        await recalculateCart(cart.id);
      } catch {
        // ignore backend errors
      }
    })();
  }, []);

  // Calculates total item count in the cart
  const count = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );
  // Calculates total price of all items in the cart
  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.price, 0),
    [items]
  );

  // Memoizes context value to avoid unnecessary re-renders
  const value = useMemo(
    () => ({ items, addItem, removeItem, setQuantity, clear, count, total }),
    [items, count, total, addItem, removeItem, setQuantity, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Custom hook to access cart context, throws if used outside provider
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
