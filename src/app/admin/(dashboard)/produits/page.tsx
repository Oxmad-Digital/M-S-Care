import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CATEGORY_LABEL } from "@/lib/types";
import { deleteProduct, toggleProductPublished } from "@/lib/actions/products";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ms-primary">Produits</h1>
        <Link
          href="/admin/produits/nouveau"
          className="rounded-full bg-ms-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ms-primary"
        >
          Nouveau produit
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-ms-border bg-white">
        <table className="w-full text-left text-[14px]">
          <thead>
            <tr className="border-b border-ms-border text-[12px] font-bold tracking-wide text-ms-text-muted uppercase">
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-ms-border last:border-0">
                <td className="px-4 py-3 font-semibold text-ms-primary">
                  {product.name}
                </td>
                <td className="px-4 py-3 text-ms-text">
                  {CATEGORY_LABEL[product.category]}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      product.published
                        ? "bg-ms-badge text-ms-primary"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {product.published ? "Publié" : "Brouillon"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/produits/${product.id}`}
                      className="font-semibold text-ms-accent hover:text-ms-primary"
                    >
                      Modifier
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await toggleProductPublished(product.id, !product.published);
                      }}
                    >
                      <button
                        type="submit"
                        className="font-semibold text-ms-text-soft hover:text-ms-primary"
                      >
                        {product.published ? "Dépublier" : "Publier"}
                      </button>
                    </form>
                    <form
                      action={async () => {
                        "use server";
                        await deleteProduct(product.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="font-semibold text-red-600 hover:text-red-700"
                      >
                        Supprimer
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
