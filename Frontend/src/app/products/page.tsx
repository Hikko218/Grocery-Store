// Products page. Fetches query params and renders the products banner with filters.
import ProductsBanner from "@/components/ProductsBanner";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  // Helper to normalize query param values to string
  const toStr = (v: unknown) =>
    typeof v === "string" ? v : Array.isArray(v) ? v[0] ?? "" : "";

  const searchTerm = toStr(params.searchTerm);
  const category = toStr(params.category);
  const sortByRaw = toStr(params.sortBy);
  const sortOrderRaw = toStr(params.sortOrder);

  const sortBy = (
    sortByRaw === "price" || sortByRaw === "name" ? sortByRaw : "name"
  ) as "name" | "price";
  const sortOrder = (sortOrderRaw === "desc" ? "desc" : "asc") as
    | "asc"
    | "desc";

  return (
    <div className="mx-auto max-w-7xl pt-24">
      <h1 className="ml-4 text-3xl font-bold text-slate-900">Products</h1>
      {/* Products banner with search, category, and sorting */}
      <ProductsBanner
        searchTerm={searchTerm}
        category={category || undefined}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </div>
  );
}
