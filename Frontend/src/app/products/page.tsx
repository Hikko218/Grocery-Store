import ProductsBanner from "@/components/ProductsBanner";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const toStr = (v: unknown) =>
    typeof v === "string" ? v : Array.isArray(v) ? v[0] ?? "" : "";

  const searchTerm = toStr(params.searchTerm);
  const sortByRaw = toStr(params.sortBy);
  const sortOrderRaw = toStr(params.sortOrder);

  const sortBy = (
    sortByRaw === "price" || sortByRaw === "name" ? sortByRaw : "name"
  ) as "name" | "price";
  const sortOrder = (sortOrderRaw === "desc" ? "desc" : "asc") as
    | "asc"
    | "desc";

  return (
    <main className="mx-auto max-w-7xl px-4 pt-24">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Products</h1>
      <ProductsBanner
        searchTerm={searchTerm}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </main>
  );
}
