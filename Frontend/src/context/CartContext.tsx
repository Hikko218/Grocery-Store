"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef, // hinzugefügt
} from "react";
import { getAuthStatus } from "@/lib/auth";
import { ensureCart, recalculateCart } from "@/lib/cart";
import {
  setServerCartItem,
  deleteServerCartItem,
  clearServerCartItems,
  addCartItems, // hinzugefügt
} from "@/lib/cartitems";

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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const migratedRef = useRef(false); // verhindert Doppel-Ausführung im StrictMode

  useEffect(() => {
    const initial = loadInitial();
    setItems(initial);
    setLoaded(true);
  }, []);

  // Items in LocalStorage persistieren
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  // Beim ersten Load: eingeloggt? -> Cart sicherstellen, Items anlegen, total neu berechnen
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
        // optional: log
      } finally {
        migratedRef.current = true; // markiere als erledigt
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loaded, items]);

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
          // optional: log
        }
      })();
    },
    []
  );

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
        // optional: log
      }
    })();
  }, []);

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
        // optional: log
      }
    })();
  }, []);

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
        // optional: log
      }
    })();
  }, []);

  const count = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );
  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.price, 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, addItem, removeItem, setQuantity, clear, count, total }),
    [items, count, total, addItem, removeItem, setQuantity, clear] // deps ergänzt
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
