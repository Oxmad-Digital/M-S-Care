import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/ProductForm";
import { updateProduct } from "@/lib/actions/products";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    notFound();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-ms-primary">
        Modifier {product.name}
      </h1>
      <ProductForm action={updateProduct.bind(null, product.id)} product={product} />
    </div>
  );
}
