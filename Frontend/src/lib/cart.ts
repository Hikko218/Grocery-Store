export type SyncItem = { productId: string; quantity: number };
export type SyncResponse = {
  id: number;
  items: SyncItem[];
  totalPrice: number;
};

export type ResponseCartDto = {
  id: number;
  userId: number;
  createdAt: string;
  totalPrice: number;
};

async function getCartByUserId(
  userId: number
): Promise<ResponseCartDto | null> {
  const res = await fetch(`/api/cart?userId=${userId}`, {
    credentials: "include",
  });
  if (res.ok) return res.json();
  if (res.status === 404) return null;
  throw new Error(`GET /cart failed: ${res.status}`);
}

async function createCart(userId: number): Promise<ResponseCartDto> {
  const res = await fetch(`/api/cart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error(`POST /cart failed: ${res.status}`);
  return res.json();
}

export async function ensureCart(userId: number): Promise<ResponseCartDto> {
  const existing = await getCartByUserId(userId);
  if (existing) return existing;
  return createCart(userId);
}

export async function recalculateCart(
  cartId: number
): Promise<{ total: number }> {
  const res = await fetch(`/api/cart/${cartId}/recalculate`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok)
    throw new Error(`POST /cart/${cartId}/recalculate failed: ${res.status}`);
  return res.json();
}

export async function syncCart(items: SyncItem[]): Promise<SyncResponse> {
  const res = await fetch("/api/cart/sync", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    throw new Error(`Cart sync failed: ${res.status}`);
  }
  return res.json();
}
