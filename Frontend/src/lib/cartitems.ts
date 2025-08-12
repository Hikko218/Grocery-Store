// Functions for managing cart items (add, update, delete, clear)
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

// Fetches all cart items for a given cart
export async function getCartItems(
  cartId: number
): Promise<ResponseCartItemDto[]> {
  const res = await fetch(`/api/cartitem?cartId=${cartId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`GET /cartitem failed: ${res.status}`);
  return res.json();
}

// Creates a new cart item
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

// Updates the quantity of a cart item
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

// Adds or updates multiple cart items (idempotent merge)
export async function addCartItems(items: AddCartItemDto[]): Promise<void> {
  if (!items.length) return;

  // Group items by cartId and productId, sum quantities
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
          // On error 400/409, reload and update instead
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
        // If exists, update quantity to match local
        try {
          await updateCartItem(found.id, qty);
        } catch (err: unknown) {
          console.error("updateCartItem failed", err);
        }
      }
    }
  }
}

// Deletes a cart item by its ID
async function deleteCartItemById(id: number): Promise<{ success: boolean }> {
  const res = await fetch(`/api/cartitem/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`DELETE /cartitem/${id} failed: ${res.status}`);
  return res.json();
}

/**
 * Sets the server quantity for a cart item (qty 0 = delete). Idempotent.
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
 * Deletes a cart item by cartId and productId if it exists.
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
 * Deletes all items from a cart.
 */
export async function clearServerCartItems(cartId: number): Promise<void> {
  const existing = await getCartItems(cartId);
  if (!existing.length) return;
  await Promise.all(existing.map((x) => deleteCartItemById(x.id)));
}
