"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/services/userService";
import { orderService } from "@/services/orderService";
import { addressService } from "@/services/addressService";
import type { ResponseUser, UpdateUserPayload } from "@/types/user";
import type { ResponseOrder } from "@/types/order";
import type {
  CreateAddressPayload,
  ResponseAddress,
  UpdateAddressPayload,
} from "@/types/address";

type MaybeAuthUser = {
  id?: number | string;
  userId?: number | string;
  email?: string;
  name?: string | null;
};

function parseNumericId(val: unknown): number | null {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string" && /^\d+$/.test(val)) return Number(val);
  return null;
}

function getEffectiveUserId(
  u: MaybeAuthUser | null | undefined
): number | null {
  if (!u) return null;
  const rec = u as Record<string, unknown>;
  if ("id" in rec) {
    const n = parseNumericId(rec.id);
    if (n !== null) return n;
  }
  if ("userId" in rec) {
    const n = parseNumericId(rec.userId);
    if (n !== null) return n;
  }
  return null;
}

function getOrderTotal(o: unknown): number {
  const rec = o as { total?: unknown; totalPrice?: unknown };
  const n = Number(rec.total ?? rec.totalPrice ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function getOrderStatus(o: unknown): string {
  const rec = o as { status?: unknown; paymentStatus?: unknown };
  const s = String(rec.status ?? rec.paymentStatus ?? "").toUpperCase();
  return s || "UNKNOWN";
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  const cls =
    s === "SUCCEEDED"
      ? "bg-emerald-100 text-emerald-800"
      : s === "PROCESSING" || s === "REQUIRES_ACTION"
      ? "bg-amber-100 text-amber-800"
      : s === "FAILED"
      ? "bg-red-100 text-red-800"
      : "bg-slate-100 text-slate-700";
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${cls}`}
    >
      {s}
    </span>
  );
}

export default function ProfilePage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const userId = getEffectiveUserId(authUser as MaybeAuthUser);

  const [user, setUser] = useState<ResponseUser | null>(null);
  const [orders, setOrders] = useState<ResponseOrder[]>([]);
  const [addresses, setAddresses] = useState<ResponseAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userForm, setUserForm] = useState<UpdateUserPayload>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
  });
  const [addrForm, setAddrForm] = useState<CreateAddressPayload>({
    type: "SHIPPING",
    isDefault: false,
    name: "",
    street: "",
    street2: "",
    postalCode: "",
    city: "",
    country: "DE",
    phone: "",
  });

  const [pwConfirm, setPwConfirm] = useState<string>("");

  const defaultShipping = useMemo(
    () => addresses.find((a) => a.type === "SHIPPING" && a.isDefault),
    [addresses]
  );
  const defaultBilling = useMemo(
    () => addresses.find((a) => a.type === "BILLING" && a.isDefault),
    [addresses]
  );

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        setLoading(true);

        const userPromise: Promise<ResponseUser | null> =
          typeof userId === "number"
            ? userService.getById(userId) // GET /api/user/id/:id
            : Promise.resolve(null);
        const ordersPromise = orderService.listMy(); // GET /api/order
        const addrPromise = addressService.list(); // GET /api/address

        const [uRes, oRes, aRes] = await Promise.allSettled([
          userPromise,
          ordersPromise,
          addrPromise,
        ]);

        if (cancelled) return;

        const me = uRes.status === "fulfilled" ? uRes.value : null;
        const myOrders = oRes.status === "fulfilled" ? oRes.value : [];
        const myAddresses = aRes.status === "fulfilled" ? aRes.value : [];

        setUser(me);
        setOrders(myOrders);
        setAddresses(myAddresses);

        if (me) {
          setUserForm({
            firstName: me.firstName ?? "",
            lastName: me.lastName ?? "",
            phone: me.phone ?? "",
            email: me.email ?? "",
            password: "",
          });
        }
      } catch (e: unknown) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, userId]);

  async function saveUser(e: React.FormEvent) {
    e.preventDefault();
    if (typeof userId !== "number") return;
    if (
      (userForm.password ?? "").length > 0 &&
      userForm.password !== pwConfirm
    ) {
      setError("Passwords do not match");
      return;
    }
    const updated = await userService.update(userId, userForm);
    setUser(updated);
    // Passwort-Felder nach erfolgreichem Update leeren
    setUserForm((s) => ({ ...s, password: "" }));
    setPwConfirm("");
  }

  async function addAddress(e: React.FormEvent) {
    e.preventDefault();
    const created = await addressService.create(addrForm);
    setAddresses((prev) => [created, ...prev]);
    setAddrForm({
      type: "SHIPPING",
      isDefault: false,
      name: "",
      street: "",
      street2: "",
      postalCode: "",
      city: "",
      country: "DE",
      phone: "",
    });
  }

  async function updateAddress(id: number, patch: UpdateAddressPayload) {
    const updated = await addressService.update(id, patch);
    setAddresses((prev) => prev.map((a) => (a.id === id ? updated : a)));
  }

  async function removeAddress(id: number) {
    await addressService.remove(id);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }

  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-24">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Your Profile</h1>

      {authLoading || loading ? (
        <div className="rounded-md border border-slate-200 p-6 text-slate-600">
          Loading profile…
        </div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            {/* Account */}
            <section className="rounded-md border border-slate-200 p-6">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">
                Account
              </h2>
              <form onSubmit={saveUser} className="grid gap-3">
                <label className="grid gap-1">
                  <span className="text-sm text-slate-600">Email</span>
                  <input
                    type="email"
                    className="rounded border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                    value={userForm.email ?? ""}
                    onChange={(e) =>
                      setUserForm((s) => ({ ...s, email: e.target.value }))
                    }
                    required
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm text-slate-600">First name</span>
                  <input
                    className="rounded border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                    value={userForm.firstName ?? ""}
                    onChange={(e) =>
                      setUserForm((s) => ({ ...s, firstName: e.target.value }))
                    }
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm text-slate-600">Last name</span>
                  <input
                    className="rounded border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                    value={userForm.lastName ?? ""}
                    onChange={(e) =>
                      setUserForm((s) => ({ ...s, lastName: e.target.value }))
                    }
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm text-slate-600">Phone</span>
                  <input
                    className="rounded border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                    value={userForm.phone ?? ""}
                    onChange={(e) =>
                      setUserForm((s) => ({ ...s, phone: e.target.value }))
                    }
                  />
                </label>
                <div className="mt-2 grid gap-3 md:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="text-sm text-slate-600">New password</span>
                    <input
                      type="password"
                      className="rounded border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                      value={userForm.password ?? ""}
                      onChange={(e) =>
                        setUserForm((s) => ({ ...s, password: e.target.value }))
                      }
                      placeholder="Leave empty to keep current"
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-sm text-slate-600">
                      Confirm password
                    </span>
                    <input
                      type="password"
                      className="rounded border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                      value={pwConfirm}
                      onChange={(e) => setPwConfirm(e.target.value)}
                      placeholder="Repeat new password"
                    />
                  </label>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    className="rounded-md bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                    disabled={typeof userId !== "number"}
                  >
                    Save
                  </button>
                  <span className="text-sm text-slate-600">{user?.email}</span>
                </div>
              </form>
            </section>

            {/* Addresses */}
            <section className="rounded-md border border-slate-200 p-6">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">
                Addresses
              </h2>

              <form onSubmit={addAddress} className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-sm text-slate-600">Type</span>
                  <select
                    className="rounded border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                    value={addrForm.type}
                    onChange={(e) =>
                      setAddrForm((s) => ({
                        ...s,
                        type: e.target.value as "SHIPPING" | "BILLING",
                      }))
                    }
                  >
                    <option value="SHIPPING">Shipping</option>
                    <option value="BILLING">Billing</option>
                  </select>
                </label>
                <label className="flex items-end gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-emerald-600"
                    checked={!!addrForm.isDefault}
                    onChange={(e) =>
                      setAddrForm((s) => ({
                        ...s,
                        isDefault: e.target.checked,
                      }))
                    }
                  />
                  <span className="text-sm text-slate-700">Default</span>
                </label>
                <label className="grid gap-1">
                  <span className="text-sm text-slate-600">Name</span>
                  <input
                    className="rounded border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                    value={addrForm.name ?? ""}
                    onChange={(e) =>
                      setAddrForm((s) => ({ ...s, name: e.target.value }))
                    }
                  />
                </label>
                <label className="grid gap-1 md:col-span-2">
                  <span className="text-sm text-slate-600">Street</span>
                  <input
                    className="rounded border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                    value={addrForm.street}
                    onChange={(e) =>
                      setAddrForm((s) => ({ ...s, street: e.target.value }))
                    }
                    required
                  />
                </label>
                <label className="grid gap-1 md:col-span-2">
                  <span className="text-sm text-slate-600">Address line 2</span>
                  <input
                    className="rounded border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                    value={addrForm.street2 ?? ""}
                    onChange={(e) =>
                      setAddrForm((s) => ({ ...s, street2: e.target.value }))
                    }
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm text-slate-600">Postal code</span>
                  <input
                    className="rounded border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                    value={addrForm.postalCode}
                    onChange={(e) =>
                      setAddrForm((s) => ({ ...s, postalCode: e.target.value }))
                    }
                    required
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm text-slate-600">City</span>
                  <input
                    className="rounded border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                    value={addrForm.city}
                    onChange={(e) =>
                      setAddrForm((s) => ({ ...s, city: e.target.value }))
                    }
                    required
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm text-slate-600">Country</span>
                  <input
                    className="rounded border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                    value={addrForm.country}
                    onChange={(e) =>
                      setAddrForm((s) => ({ ...s, country: e.target.value }))
                    }
                    required
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm text-slate-600">Phone</span>
                  <input
                    className="rounded border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                    value={addrForm.phone ?? ""}
                    onChange={(e) =>
                      setAddrForm((s) => ({ ...s, phone: e.target.value }))
                    }
                  />
                </label>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="w-full rounded-md bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-600"
                  >
                    Add address
                  </button>
                </div>
              </form>

              <div className="mt-6 grid gap-4">
                {addresses.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-md border border-slate-200 p-4"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <strong className="text-slate-900">
                        {a.type} {a.isDefault ? "• Default" : ""}
                      </strong>
                      <div className="flex gap-2">
                        {!a.isDefault && (
                          <button
                            type="button"
                            className="rounded border px-3 py-1 text-slate-700 hover:bg-emerald-500 hover:text-white"
                            onClick={() =>
                              updateAddress(a.id, { isDefault: true })
                            }
                          >
                            Set default
                          </button>
                        )}
                        <button
                          type="button"
                          className="rounded border px-3 py-1 text-red-600 hover:bg-red-500 hover:text-white"
                          onClick={() => removeAddress(a.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="text-slate-700">{a.name}</div>
                    <div className="text-slate-700">
                      {a.street}
                      {a.street2 ? `, ${a.street2}` : ""}
                    </div>
                    <div className="text-slate-700">
                      {a.postalCode} {a.city}, {a.country}
                    </div>
                    <div className="text-slate-700">{a.phone}</div>
                  </div>
                ))}
                {!addresses.length && (
                  <div className="rounded-md border border-slate-200 p-4 text-slate-600">
                    No addresses yet.
                  </div>
                )}
                <div className="text-sm text-slate-600">
                  Default shipping:{" "}
                  {defaultShipping
                    ? `${defaultShipping.street}, ${defaultShipping.city}`
                    : "—"}
                  <br />
                  Default billing:{" "}
                  {defaultBilling
                    ? `${defaultBilling.street}, ${defaultBilling.city}`
                    : "—"}
                </div>
              </div>
            </section>
          </div>

          {/* Orders summary */}
          <aside className="h-fit rounded-md border border-slate-200 p-4">
            <h2 className="mb-3 text-xl font-semibold text-slate-900">
              Orders
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-sm text-slate-600">
                    <th className="border-b border-slate-200 px-3 py-2 text-left">
                      Order
                    </th>
                    <th className="border-b border-slate-200 px-3 py-2 text-left">
                      Date
                    </th>
                    <th className="border-b border-slate-200 px-3 py-2 text-left">
                      Status
                    </th>
                    <th className="border-b border-slate-200 px-3 py-2 text-right">
                      Items
                    </th>
                    <th className="border-b border-slate-200 px-3 py-2 text-right">
                      Total
                    </th>
                    <th className="border-b border-slate-200 px-3 py-2 text-right">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const itemCount =
                      o.items?.reduce(
                        (acc, it) => acc + (it.quantity ?? 0),
                        0
                      ) ?? 0;
                    const isOpen = expanded === o.id;
                    return (
                      <Fragment key={o.id}>
                        <tr className="align-top">
                          <td className="px-3 py-2">#{o.id}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {new Date(o.createdAt).toLocaleString()}
                          </td>
                          <td className="px-3 py-2">
                            <StatusBadge status={getOrderStatus(o)} />
                          </td>
                          <td className="px-3 py-2 text-right">{itemCount}</td>
                          <td className="px-3 py-2 text-right">
                            {getOrderTotal(o).toLocaleString(undefined, {
                              style: "currency",
                              currency: "EUR",
                            })}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              className="text-emerald-700 underline hover:text-emerald-900"
                              onClick={() => setExpanded(isOpen ? null : o.id)}
                            >
                              {isOpen ? "Hide" : "View"}
                            </button>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr>
                            <td colSpan={6} className="px-3 pb-3">
                              <div className="rounded border border-slate-200">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="bg-slate-50 text-slate-600">
                                      <th className="px-3 py-2 text-left">
                                        Product
                                      </th>
                                      <th className="px-3 py-2 text-right">
                                        Qty
                                      </th>
                                      <th className="px-3 py-2 text-right">
                                        Price
                                      </th>
                                      <th className="px-3 py-2 text-right">
                                        Subtotal
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(o.items ?? []).map((it) => {
                                      const name = it.product?.name ?? "Item";
                                      const price = Number(
                                        it.price ?? it.product?.price ?? 0
                                      );
                                      const qty = Number(it.quantity ?? 0);
                                      return (
                                        <tr key={it.id}>
                                          <td className="px-3 py-2">{name}</td>
                                          <td className="px-3 py-2 text-right">
                                            {qty}
                                          </td>
                                          <td className="px-3 py-2 text-right">
                                            {price.toLocaleString(undefined, {
                                              style: "currency",
                                              currency: "EUR",
                                            })}
                                          </td>
                                          <td className="px-3 py-2 text-right">
                                            {(price * qty).toLocaleString(
                                              undefined,
                                              {
                                                style: "currency",
                                                currency: "EUR",
                                              }
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                  {!orders.length && (
                    <tr>
                      <td colSpan={6} className="px-3 py-2 text-slate-600">
                        No orders yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
