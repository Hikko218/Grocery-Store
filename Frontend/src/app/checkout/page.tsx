"use client";

import { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

type Address = {
  id: number;
  type: "SHIPPING" | "BILLING";
  isDefault: boolean;
  name?: string | null;
  street: string;
  street2?: string | null;
  postalCode: string;
  city: string;
  country: string;
  phone?: string | null;
};

type Shipping = {
  name: string;
  street: string;
  street2?: string;
  postalCode: string;
  city: string;
  country: string; // ISO2
  phone?: string;
};

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const API = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "/api", []);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(true);

  const [shipping, setShipping] = useState<Shipping>({
    name: "",
    street: "",
    street2: "",
    postalCode: "",
    city: "",
    country: "DE",
    phone: "",
  });

  // Helpers
  function applyAddress(a: Address) {
    setShipping({
      name: a.name ?? "",
      street: a.street,
      street2: a.street2 ?? "",
      postalCode: a.postalCode,
      city: a.city,
      country: (a.country || "DE").toUpperCase(),
      phone: a.phone ?? "",
    });
  }

  // Load addresses
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/address`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const list = (await res.json()) as Address[];
        setAddresses(list);
        const def =
          list.find((a) => a.type === "SHIPPING" && a.isDefault) ||
          list.find((a) => a.type === "SHIPPING") ||
          list[0];
        if (def) {
          setSelectedId(def.id);
          applyAddress(def);
        }
      } catch {
        // ignore
      }
    };
    void load();
  }, [API]);

  // Save or update address
  const saveAddress = async () => {
    setError(null);
    try {
      const payload = {
        type: "SHIPPING",
        isDefault: !!saveAsDefault,
        name: shipping.name || null,
        street: shipping.street,
        street2: shipping.street2 || null,
        postalCode: shipping.postalCode,
        city: shipping.city,
        country: shipping.country.toUpperCase(),
        phone: shipping.phone || null,
      };
      let res: Response;
      if (selectedId) {
        res = await fetch(`${API}/address/${selectedId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API}/address`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Cannot save address");
      }
      // refresh list
      const listRes = await fetch(`${API}/address`, { credentials: "include" });
      if (listRes.ok) {
        const list = (await listRes.json()) as Address[];
        setAddresses(list);
        const def =
          list.find((a) => a.type === "SHIPPING" && a.isDefault) ||
          list.find((a) => a.type === "SHIPPING") ||
          list[0];
        if (def) {
          setSelectedId(def.id);
          applyAddress(def);
        }
      }
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cannot save address");
    }
  };

  const canPay =
    !submitting &&
    !!stripe &&
    !!elements &&
    shipping.name.trim().length > 1 &&
    shipping.street.trim().length > 3 &&
    shipping.postalCode.trim().length > 2 &&
    shipping.city.trim().length > 1 &&
    /^[A-Z]{2}$/.test(shipping.country.trim().toUpperCase());

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setMsg(null);
    setError(null);

    const res = await fetch(`${API}/payment/create-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ shipping }),
    });
    if (!res.ok) {
      try {
        setError((await res.text()) || `Create intent failed (${res.status})`);
      } catch {
        setError(`Create intent failed (${res.status})`);
      }
      setSubmitting(false);
      return;
    }
    const { clientSecret, orderId } = (await res.json()) as {
      clientSecret: string;
      orderId: number;
    };

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement)! },
    });

    if (result.error) {
      setError(result.error.message ?? "Payment failed");
      setSubmitting(false);
      return;
    }

    const status = result.paymentIntent?.status;
    if (status === "succeeded") {
      window.location.href = `/checkout/success?order=${orderId}`;
      return;
    }
    if (status === "requires_action") {
      setMsg(
        "Additional authentication required. Please complete the 3D Secure step."
      );
    } else if (status === "processing") {
      setMsg(
        "The payment is being processed. You will receive confirmation shortly."
      );
    } else if (status === "requires_payment_method") {
      setError("Payment method was declined. Please try a different card.");
    } else {
      setError(`Payment status: ${status ?? "unknown"}`);
    }
    setSubmitting(false);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-md space-y-4 rounded-md border border-slate-200 p-6"
    >
      <h1 className="text-xl font-semibold">Checkout</h1>

      {/* Address selector */}
      {addresses.length > 0 && (
        <div className="space-y-2">
          <div className="font-medium text-slate-800">Your addresses</div>
          <ul className="space-y-1">
            {addresses.map((a) => (
              <li key={a.id} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="addr"
                  checked={selectedId === a.id}
                  onChange={() => {
                    setSelectedId(a.id);
                    applyAddress(a);
                    setEditing(false);
                  }}
                />
                <span className="text-sm text-slate-700">
                  {a.name || "—"}, {a.street}
                  {a.street2 ? `, ${a.street2}` : ""}, {a.postalCode} {a.city},{" "}
                  {a.country.toUpperCase()}
                  {a.isDefault && " (default)"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Edit/new address */}
      <fieldset className="space-y-3">
        <legend className="font-medium text-slate-800">Shipping address</legend>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="rounded border px-3 py-2 text-sm"
            onClick={() => setEditing((v) => !v)}
          >
            {editing
              ? "Cancel edit"
              : selectedId
              ? "Edit selected"
              : "Add address"}
          </button>
          {editing && (
            <label className="flex items-center gap-2 justify-end text-sm text-slate-700">
              <input
                type="checkbox"
                checked={saveAsDefault}
                onChange={(e) => setSaveAsDefault(e.target.checked)}
              />
              Save as default
            </label>
          )}
        </div>

        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Full name"
          value={shipping.name}
          onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
          required
          disabled={!editing && !!selectedId}
        />
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Street and number"
          value={shipping.street}
          onChange={(e) => setShipping({ ...shipping, street: e.target.value })}
          required
          disabled={!editing && !!selectedId}
        />
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Address line 2 (optional)"
          value={shipping.street2 ?? ""}
          onChange={(e) =>
            setShipping({ ...shipping, street2: e.target.value })
          }
          disabled={!editing && !!selectedId}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="Postal code"
            value={shipping.postalCode}
            onChange={(e) =>
              setShipping({ ...shipping, postalCode: e.target.value })
            }
            required
            disabled={!editing && !!selectedId}
          />
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="City"
            value={shipping.city}
            onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
            required
            disabled={!editing && !!selectedId}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="Country (ISO2, e.g. DE)"
            value={shipping.country}
            onChange={(e) =>
              setShipping({
                ...shipping,
                country: e.target.value.toUpperCase(),
              })
            }
            required
            disabled={!editing && !!selectedId}
          />
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="Phone (optional)"
            value={shipping.phone ?? ""}
            onChange={(e) =>
              setShipping({ ...shipping, phone: e.target.value })
            }
            disabled={!editing && !!selectedId}
          />
        </div>

        {editing && (
          <button
            type="button"
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
            onClick={saveAddress}
          >
            Save address
          </button>
        )}
      </fieldset>

      <div className="rounded border border-slate-200 p-3">
        <CardElement options={{ hidePostalCode: true }} />
      </div>

      {msg && (
        <div className="rounded border border-amber-200 bg-amber-50 p-2 text-amber-800">
          {msg}
        </div>
      )}
      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-2 text-red-700">
          {error}
        </div>
      )}
      <button
        disabled={!canPay}
        className="w-full rounded-md bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
      >
        {submitting ? "Being processed…" : "Pay"}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-24">
      <Elements stripe={stripePromise}>
        <CheckoutForm />
      </Elements>
    </div>
  );
}
