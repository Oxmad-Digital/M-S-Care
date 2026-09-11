import { ProductForm } from "@/components/admin/ProductForm";
import { createProduct } from "@/lib/actions/products";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-ms-primary">
        Nouveau produit
      </h1>
      <ProductForm action={createProduct} />
    </div>
  );
}
