export type Product = {
  id: number;
  productId: string;
  name: string;
  description?: string;
  brand?: string | null;
  category?: string;
  quantity?: string;
  packaging?: string;
  country?: string;
  ingredients?: string;
  calories?: string;
  price: number;
  imageUrl?: string | null;
};

type Params = {
  searchTerm?: string;
  sortBy?: "name" | "price";
  sortOrder?: "asc" | "desc";
  take?: number; 
  skip?: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL

export async function fetchProducts(params: Params = {}): Promise<Product[]> {
  const qs = new URLSearchParams();
  const term = params.searchTerm?.trim();
  if (term) qs.set("searchTerm", term);
  if (params.sortBy) qs.set("sortBy", params.sortBy);
  if (params.sortOrder) qs.set("sortOrder", params.sortOrder);
  if (typeof params.take === "number") qs.set("take", String(params.take));
  if (typeof params.skip === "number") qs.set("skip", String(params.skip)); 

  const url = `${API_URL}/products${qs.size ? `?${qs.toString()}` : ""}`;
  const res = await fetch(url, { cache: "no-store", credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch products (${res.status})`);
  return res.json() as Promise<Product[]>;
}

// Fetch a single product by productId (or numeric id)
export async function fetchProductById(
  productId: string | number
): Promise<Product> {
  const id = encodeURIComponent(String(productId));
  const url = `${SITE_URL}/products/${id}`;
  const res = await fetch(url, {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to fetch product (${res.status})`);
  return res.json() as Promise<Product>;
}
