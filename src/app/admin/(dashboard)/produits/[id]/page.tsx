import { notFound } from "next/navigation";
import { Modal } from "@/components/admin/Modal";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductsList } from "@/components/admin/ProductsList";
import { getProductForEdit } from "@/lib/admin-products";
import { updateProduct } from "@/lib/actions/products";
import { requireUser } from "@/lib/current-user";
import { can } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const canEdit = can(user.role, "edit");
  const product = await getProductForEdit(id);

  if (!product) {
    notFound();
  }

  return (
    <>
      <ProductsList />
      <Modal title={canEdit ? `Modifier ${product.name}` : product.name}>
        {canEdit ? (
          <ProductForm action={updateProduct.bind(null, product.id)} product={product} />
        ) : (
          <ProductForm product={product} readOnly />
        )}
      </Modal>
    </>
  );
}
