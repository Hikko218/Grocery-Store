"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type OrderItem = {
  id: number;
  quantity: number;
  price: number;
  product?: {
    id: number;
    name: string;
    price: number;
    imageUrl?: string | null;
  };
};
type OrderRow = {
  id: number;
  userId: number;
  createdAt: string;
  paymentStatus: "PROCESSING" | "SUCCEEDED" | "FAILED";
  totalPrice: number;
  user?: {
    id: number;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
  items: OrderItem[];
};

type ProductRow = {
  id: number;
  productId: string;
  name: string;
  price?: number | null;
  imageUrl?: string | null;
  category?: string | null;
  brand?: string | null;
  description?: string | null;
};

type AdminUser = {
  id: number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: string | null;
  orders?: OrderRow[];
};

export default function AdminPage() {
  const API = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "/api", []);

  // Orders via User
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userQuery, setUserQuery] = useState<{
    userId?: string;
    email?: string;
  }>({});
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loadingUser, setLoadingUser] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Products with search/filter/sort
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productQ, setProductQ] = useState<string>("");
  const [productCategory, setProductCategory] = useState<string>("");
  const [productBrand, setProductBrand] = useState<string>("");
  const [sortBy, setSortBy] = useState<"name" | "price">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [newProduct, setNewProduct] = useState<Partial<ProductRow>>({
    name: "",
    productId: "",
    price: 0,
    category: "",
    brand: "",
    imageUrl: "",
    description: "",
  });

  // Helpers
  const loadUser = useCallback(async () => {
    setLoadingUser(true);
    setSelectedUser(null);
    setOrders([]);
    try {
      let u: AdminUser | null = null;

      // 1) per ID
      if (userQuery.userId && userQuery.userId.trim()) {
        const res = await fetch(
          `${API}/user/id/${encodeURIComponent(
            userQuery.userId.trim()
          )}?include=orders`,
          { credentials: "include" }
        );
        if (res.ok) {
          const d = (await res.json()) as Partial<AdminUser>;
          if (typeof d?.id === "number" && typeof d?.email === "string") {
            u = {
              id: d.id,
              email: d.email,
              firstName: d.firstName ?? null,
              lastName: d.lastName ?? null,
              role: (d.role ?? null) as string | null,
              orders: (d.orders as OrderRow[] | undefined) ?? [],
            };
          }
        }
      }

      // 2) per E-Mail (Fallback)
      if (!u && userQuery.email && userQuery.email.trim()) {
        const email = userQuery.email.trim();
        const res = await fetch(
          `${API}/user/${encodeURIComponent(email)}?include=orders`,
          { credentials: "include" }
        );
        if (res.ok) {
          const d = (await res.json()) as Partial<AdminUser>;
          if (typeof d?.id === "number" && typeof d?.email === "string") {
            u = {
              id: d.id,
              email: d.email,
              firstName: d.firstName ?? null,
              lastName: d.lastName ?? null,
              role: (d.role ?? null) as string | null,
              orders: (d.orders as OrderRow[] | undefined) ?? [],
            };
          }
        }
      }

      setSelectedUser(u);

      if (u) {
        setLoadingOrders(true);
        setOrders(u.orders ?? []);
        setLoadingOrders(false);
      }
    } finally {
      setLoadingUser(false);
    }
  }, [API, userQuery]);

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    const params = new URLSearchParams();
    if (productQ.trim()) params.set("searchTerm", productQ.trim());
    if (productCategory.trim()) params.set("category", productCategory.trim());
    // Brand-Filter: falls dein /products das nicht unterstützt, ignoriere ihn serverseitig
    if (productBrand.trim()) params.set("brand", productBrand.trim());
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);
    params.set("take", "50");

    const res = await fetch(`${API}/products?${params.toString()}`, {
      credentials: "include",
    });
    setProducts(res.ok ? ((await res.json()) as ProductRow[]) : []);
    setLoadingProducts(false);
  }, [API, productQ, productCategory, productBrand, sortBy, sortOrder]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  // Order actions
  const updateOrderStatus = useCallback(
    async (id: number, paymentStatus: OrderRow["paymentStatus"]) => {
      const res = await fetch(`${API}/order/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus }),
      });
      if (res.ok && selectedUser) await loadUser(); // lädt User inkl. orders neu
    },
    [API, loadUser, selectedUser]
  );

  const deleteOrder = useCallback(
    async (id: number) => {
      const res = await fetch(`${API}/order/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok && selectedUser) await loadUser();
    },
    [API, loadUser, selectedUser]
  );

  // Product actions
  const createProduct = useCallback(async () => {
    const desc = (newProduct.description ?? "").trim();
    const res = await fetch(`${API}/products`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newProduct.name,
        productId: newProduct.productId,
        price: Number(newProduct.price ?? 0),
        brand: newProduct.brand ?? "",
        category: newProduct.category ?? "",
        imageUrl: newProduct.imageUrl ?? null,
        description: desc.length ? desc : null,
      }),
    });
    if (res.ok) {
      setNewProduct({
        name: "",
        productId: "",
        price: 0,
        category: "",
        brand: "",
        imageUrl: "",
        description: "",
      });
      await loadProducts();
    }
  }, [API, newProduct, loadProducts]);

  const updateProduct = useCallback(
    async (p: ProductRow) => {
      const res = await fetch(
        `${API}/products/${encodeURIComponent(p.productId)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: p.name,
            price: p.price ?? null,
            brand: p.brand ?? "",
            category: p.category ?? "",
            imageUrl: p.imageUrl ?? null,
            description: (p.description ?? "").trim() || null,
          }),
        }
      );
      if (res.ok) await loadProducts();
    },
    [API, loadProducts]
  );

  const deleteProduct = useCallback(
    async (productId: string) => {
      const res = await fetch(
        `${API}/products/${encodeURIComponent(productId)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (res.ok) await loadProducts();
    },
    [API, loadProducts]
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pt-24">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">
        Admin Dashboard
      </h1>

      {/* User → Orders */}
      <section className="mb-8 rounded-md border border-slate-200 p-4">
        <h2 className="mb-3 text-lg font-semibold">Find user orders</h2>
        <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="grid gap-1">
            <span className="text-sm text-slate-600">User ID</span>
            <input
              className="rounded border border-slate-300 px-2 py-1 text-sm"
              placeholder="e.g. 12"
              value={userQuery.userId ?? ""}
              onChange={(e) =>
                setUserQuery((s) => ({ ...s, userId: e.target.value }))
              }
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-slate-600">Email</span>
            <input
              className="rounded border border-slate-300 px-2 py-1 text-sm"
              placeholder="user@example.com"
              value={userQuery.email ?? ""}
              onChange={(e) =>
                setUserQuery((s) => ({ ...s, email: e.target.value }))
              }
            />
          </label>
          <div className="flex gap-2">
            <button
              className="h-9 rounded bg-slate-800 px-4 text-sm font-semibold text-white"
              onClick={() => void loadUser()}
              disabled={loadingUser}
            >
              {loadingUser ? "Searching…" : "Search"}
            </button>
            <button
              className="h-9 rounded border border-slate-300 px-3 text-sm"
              onClick={() => {
                setUserQuery({});
                setSelectedUser(null);
                setOrders([]);
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {selectedUser && (
          <div className="mb-3 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <span className="font-medium">User:</span> #{selectedUser.id} ·{" "}
            {selectedUser.email}
            {selectedUser.firstName || selectedUser.lastName ? (
              <span>
                {" "}
                (
                {[selectedUser.firstName, selectedUser.lastName]
                  .filter(Boolean)
                  .join(" ")}
                )
              </span>
            ) : null}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-slate-600">
                <th className="border-b px-3 py-2 text-left">#</th>
                <th className="border-b px-3 py-2 text-left">Date</th>
                <th className="border-b px-3 py-2 text-left">Status</th>
                <th className="border-b px-3 py-2 text-right">Total</th>
                <th className="border-b px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-3 py-2">#{o.id}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {new Date(o.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="rounded border border-slate-300 px-2 py-1"
                      value={o.paymentStatus}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        void updateOrderStatus(
                          o.id,
                          e.target.value as OrderRow["paymentStatus"]
                        )
                      }
                    >
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SUCCEEDED">SUCCEEDED</option>
                      <option value="FAILED">FAILED</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {Number(o.totalPrice ?? 0).toLocaleString(undefined, {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      className="rounded bg-red-500 px-3 py-1.5 text-white hover:bg-red-600"
                      onClick={() => void deleteOrder(o.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!orders.length && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-4 text-center text-slate-500"
                  >
                    {loadingOrders
                      ? "Loading orders…"
                      : selectedUser
                      ? "No orders for this user"
                      : "No user selected"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Products */}
      <section className="rounded-md border border-slate-200 p-4">
        <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1fr_auto_auto] sm:items-end">
          <label className="grid gap-1">
            <span className="text-sm text-slate-600">Search</span>
            <input
              className="rounded border border-slate-300 px-2 py-1 text-sm"
              placeholder="Name or term"
              value={productQ}
              onChange={(e) => setProductQ(e.target.value)}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-slate-600">Category</span>
            <input
              className="rounded border border-slate-300 px-2 py-1 text-sm"
              placeholder="Category"
              value={productCategory}
              onChange={(e) => setProductCategory(e.target.value)}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-slate-600">Brand</span>
            <input
              className="rounded border border-slate-300 px-2 py-1 text-sm"
              placeholder="Brand"
              value={productBrand}
              onChange={(e) => setProductBrand(e.target.value)}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-slate-600">Sort by</span>
            <select
              className="rounded border border-slate-300 px-2 py-1 text-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "name" | "price")}
            >
              <option value="name">Name</option>
              <option value="price">Price</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-slate-600">Order</span>
            <select
              className="rounded border border-slate-300 px-2 py-1 text-sm"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </label>
          <div className="sm:col-span-5">
            <button
              className="mt-2 rounded bg-slate-800 px-4 py-2 text-sm font-semibold text-white sm:mt-0"
              onClick={() => void loadProducts()}
              disabled={loadingProducts}
            >
              {loadingProducts ? "Loading…" : "Apply"}
            </button>
          </div>
        </div>

        {/* Create */}
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-6">
          <input
            className="rounded border border-slate-300 px-2 py-1 text-sm"
            placeholder="Product ID"
            value={newProduct.productId ?? ""}
            onChange={(e) =>
              setNewProduct((s) => ({ ...s, productId: e.target.value }))
            }
          />
          <input
            className="rounded border border-slate-300 px-2 py-1 text-sm"
            placeholder="Name"
            value={newProduct.name ?? ""}
            onChange={(e) =>
              setNewProduct((s) => ({ ...s, name: e.target.value }))
            }
          />
          <input
            type="number"
            className="rounded border border-slate-300 px-2 py-1 text-sm"
            placeholder="Price"
            value={String(newProduct.price ?? "")}
            onChange={(e) =>
              setNewProduct((s) => ({ ...s, price: Number(e.target.value) }))
            }
          />
          <input
            className="rounded border border-slate-300 px-2 py-1 text-sm"
            placeholder="Category"
            value={newProduct.category ?? ""}
            onChange={(e) =>
              setNewProduct((s) => ({ ...s, category: e.target.value }))
            }
          />
          <input
            className="rounded border border-slate-300 px-2 py-1 text-sm"
            placeholder="Brand"
            value={newProduct.brand ?? ""}
            onChange={(e) =>
              setNewProduct((s) => ({ ...s, brand: e.target.value }))
            }
          />
          <input
            className="rounded border border-slate-300 px-2 py-1 text-sm"
            placeholder="Image URL"
            value={newProduct.imageUrl ?? ""}
            onChange={(e) =>
              setNewProduct((s) => ({ ...s, imageUrl: e.target.value }))
            }
          />
          <textarea
            className="rounded border border-slate-300 px-2 py-1 text-sm sm:col-span-6"
            placeholder="Description"
            rows={3}
            value={newProduct.description ?? ""}
            onChange={(e) =>
              setNewProduct((s) => ({ ...s, description: e.target.value }))
            }
          />
          <div className="sm:col-span-6">
            <button
              className="rounded bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-600"
              onClick={() => void createProduct()}
            >
              Add product
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-slate-600">
                <th className="border-b px-3 py-2 text-left">Product ID</th>
                <th className="border-b px-3 py-2 text-left">Name</th>
                <th className="border-b px-3 py-2 text-right">Price</th>
                <th className="border-b px-3 py-2 text-left">Category</th>
                <th className="border-b px-3 py-2 text-left">Brand</th>
                <th className="border-b px-3 py-2 text-left">Image URL</th>
                <th className="border-b px-3 py-2 text-left">Description</th>
                <th className="border-b px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2">{p.productId}</td>
                  <td className="px-3 py-2">
                    <input
                      className="w-full rounded border border-slate-300 px-2 py-1"
                      value={p.name}
                      onChange={(e) =>
                        setProducts((arr) =>
                          arr.map((x) =>
                            x.id === p.id ? { ...x, name: e.target.value } : x
                          )
                        )
                      }
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      className="w-28 rounded border border-slate-300 px-2 py-1 text-right"
                      value={String(p.price ?? 0)}
                      onChange={(e) =>
                        setProducts((arr) =>
                          arr.map((x) =>
                            x.id === p.id
                              ? { ...x, price: Number(e.target.value) }
                              : x
                          )
                        )
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="w-full rounded border border-slate-300 px-2 py-1"
                      value={p.category ?? ""}
                      onChange={(e) =>
                        setProducts((arr) =>
                          arr.map((x) =>
                            x.id === p.id
                              ? { ...x, category: e.target.value }
                              : x
                          )
                        )
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="w-full rounded border border-slate-300 px-2 py-1"
                      value={p.brand ?? ""}
                      onChange={(e) =>
                        setProducts((arr) =>
                          arr.map((x) =>
                            x.id === p.id ? { ...x, brand: e.target.value } : x
                          )
                        )
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="w-full rounded border border-slate-300 px-2 py-1"
                      value={p.imageUrl ?? ""}
                      onChange={(e) =>
                        setProducts((arr) =>
                          arr.map((x) =>
                            x.id === p.id
                              ? { ...x, imageUrl: e.target.value }
                              : x
                          )
                        )
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <textarea
                      className="w-full rounded border border-slate-300 px-2 py-1"
                      rows={2}
                      value={p.description ?? ""}
                      onChange={(e) =>
                        setProducts((arr) =>
                          arr.map((x) =>
                            x.id === p.id
                              ? { ...x, description: e.target.value }
                              : x
                          )
                        )
                      }
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        className="rounded bg-slate-800 px-3 py-1.5 text-white hover:bg-slate-900"
                        onClick={() => void updateProduct(p)}
                      >
                        Save
                      </button>
                      <button
                        className="rounded bg-red-500 px-3 py-1.5 text-white hover:bg-red-600"
                        onClick={() => void deleteProduct(p.productId)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!products.length && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-4 text-center text-slate-500"
                  >
                    {loadingProducts ? "Loading…" : "No products"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
