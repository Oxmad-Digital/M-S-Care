import { Modal } from "@/components/admin/Modal";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductsList } from "@/components/admin/ProductsList";
import { getProductForEdit } from "@/lib/admin-products";
import { createProduct } from "@/lib/actions/products";

export const dynamic = "force-dynamic";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ depuis?: string | string[] }>;
}) {
  const { depuis } = await searchParams;
  const source = typeof depuis === "string" ? await getProductForEdit(depuis) : null;
  // Une copie part toujours en brouillon pour être relue avant publication.
  const product = source ? { ...source, name: `${source.name} (copie)`, published: false } : undefined;

  return (
    <>
      <ProductsList />
      <Modal title={source ? `Dupliquer ${source.name}` : "Nouveau produit"}>
        <ProductForm action={createProduct} product={product} />
      </Modal>
    </>
  );
}
