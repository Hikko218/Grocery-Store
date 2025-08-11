import ProductDetails from "@/components/ProductDetails";
import { fetchProductById, type Product } from "@/lib/products";

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product: Product = await fetchProductById(productId);

  return (
    <main className="pt-24">
      <ProductDetails product={product} />
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  try {
    const { productId } = await params;
    const p = await fetchProductById(productId);
    return { title: `${p.name} · Grocery Store` };
  } catch {
    return {};
  }
}
