import { Modal } from "@/components/admin/Modal";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductsList } from "@/components/admin/ProductsList";
import { getProductForEdit } from "@/lib/admin-products";
import { redirect } from "next/navigation";
import { createProduct } from "@/lib/actions/products";
import { requireUser } from "@/lib/current-user";
import { can } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ depuis?: string | string[] }>;
}) {
  const user = await requireUser();
  if (!can(user.role, "edit")) redirect("/admin/produits");
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
