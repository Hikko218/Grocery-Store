export type ResponseCartItemDto = {
  id: number;
  cartId: number;
  productId: string;
  quantity: number;
  createdAt: string;
};

export type AddCartItemDto = {
  cartId: number;
  productId: string;
  quantity: number;
};

type HttpError = Error & { status?: number };

function makeHttpError(message: string, status: number): HttpError {
  const err = new Error(message) as HttpError;
  err.status = status;
  return err;
}

function hasStatus(e: unknown): e is { status?: number } {
  if (typeof e !== "object" || e === null) return false;
  const status = (e as Record<string, unknown>).status;
  return typeof status === "number";
}

export async function getCartItems(
  cartId: number
): Promise<ResponseCartItemDto[]> {
  const res = await fetch(`/api/cartitem?cartId=${cartId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`GET /cartitem failed: ${res.status}`);
  return res.json();
}

async function createCartItem(
  dto: AddCartItemDto
): Promise<ResponseCartItemDto> {
  const res = await fetch(`/api/cartitem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    throw makeHttpError(`POST /cartitem failed: ${res.status}`, res.status);
  }
  return res.json();
}

async function updateCartItem(
  id: number,
  quantity: number
): Promise<ResponseCartItemDto> {
  const res = await fetch(`/api/cartitem/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) {
    throw makeHttpError(
      `PUT /cartitem/${id} failed: ${res.status}`,
      res.status
    );
  }
  return res.json();
}

// Idempotentes Merge: Setzt die Server-Menge auf die lokale Menge (kein Addieren).
export async function addCartItems(items: AddCartItemDto[]): Promise<void> {
  if (!items.length) return;

  // Gruppieren nach cartId und productId, Mengen aufsummieren (falls doppelt in der Liste)
  const byCart = new Map<number, Map<string, number>>();
  for (const it of items) {
    if (!it || typeof it.cartId !== "number" || !it.productId) continue;
    if (it.quantity <= 0) continue;
    let map = byCart.get(it.cartId);
    if (!map) {
      map = new Map<string, number>();
      byCart.set(it.cartId, map);
    }
    map.set(it.productId, (map.get(it.productId) ?? 0) + it.quantity);
  }

  for (const [cartId, map] of byCart) {
    const existing = await getCartItems(cartId);
    const existingByProduct = new Map(
      existing.map((item) => [item.productId, item] as const)
    );

    for (const [productId, qty] of map) {
      const found = existingByProduct.get(productId);
      if (!found) {
        try {
          await createCartItem({ cartId, productId, quantity: qty });
        } catch (err: unknown) {
          // Rennen: bei 400/409 neu laden und dann aktualisieren
          if (!hasStatus(err) || (err.status !== 400 && err.status !== 409)) {
            console.error("createCartItem failed", err);
            continue;
          }
          try {
            const refreshed = await getCartItems(cartId);
            const again = refreshed.find((x) => x.productId === productId);
            if (again && again.quantity !== qty) {
              await updateCartItem(again.id, qty);
            }
          } catch (fallbackErr: unknown) {
            console.error("fallback refresh/update failed", fallbackErr);
          }
        }
      } else if (found.quantity !== qty) {
        // vorhanden -> Menge auf lokalen Stand setzen
        try {
          await updateCartItem(found.id, qty);
        } catch (err: unknown) {
          console.error("updateCartItem failed", err);
        }
      }
    }
  }
}

async function deleteCartItemById(id: number): Promise<{ success: boolean }> {
  const res = await fetch(`/api/cartitem/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`DELETE /cartitem/${id} failed: ${res.status}`);
  return res.json();
}

/**
 * Setzt die Server-Menge auf qty (0 => löschen). Idempotent.
 */
export async function setServerCartItem(
  cartId: number,
  productId: string,
  qty: number
): Promise<void> {
  const existing = await getCartItems(cartId);
  const found = existing.find((x) => x.productId === productId);
  if (qty <= 0) {
    if (found) await deleteCartItemById(found.id);
    return;
  }
  if (!found) {
    await createCartItem({ cartId, productId, quantity: qty });
  } else if (found.quantity !== qty) {
    await updateCartItem(found.id, qty);
  }
}

/**
 * Löscht ein Item (falls vorhanden).
 */
export async function deleteServerCartItem(
  cartId: number,
  productId: string
): Promise<void> {
  const existing = await getCartItems(cartId);
  const found = existing.find((x) => x.productId === productId);
  if (found) await deleteCartItemById(found.id);
}

/**
 * Löscht alle CartItems eines Carts.
 */
export async function clearServerCartItems(cartId: number): Promise<void> {
  const existing = await getCartItems(cartId);
  if (!existing.length) return;
  await Promise.all(existing.map((x) => deleteCartItemById(x.id)));
}
