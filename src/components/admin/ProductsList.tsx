import { prisma } from "@/lib/prisma";
import { readDatabase } from "@/lib/database-read";
import { matchDosageNotices, normalizeDosage } from "@/lib/product-variants";
import { requireUser } from "@/lib/current-user";
import { can } from "@/lib/permissions";
import { ProductsTable, type AdminProductRow } from "./ProductsTable";

export async function ProductsList() {
  const user = await requireUser();
  const products = await readDatabase(() => prisma.product.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: {
      notices: { select: { label: true }, orderBy: { position: "asc" } },
      variants: { select: { dosage: true } },
    },
  }));

  const rows: AdminProductRow[] = products.map((product) => {
    const withImage = new Set(product.variants.map((variant) => normalizeDosage(variant.dosage)));
    const { byDosage, otherNotices } = matchDosageNotices(product);
    const warnings: string[] = [];

    // Le premier dosage utilise l'image du produit ; les suivants retombent dessus s'ils n'en ont pas.
    const missingImages = product.dosages.slice(1).filter((dosage) => !withImage.has(normalizeDosage(dosage)));
    if (missingImages.length) warnings.push(`Image manquante : ${missingImages.join(", ")}`);

    if (product.category !== "SUPPLEMENT" && otherNotices.length === 0) {
      const missingNotices = product.dosages.filter((dosage) => !byDosage.has(dosage));
      if (product.notices.length === 0) warnings.push("Aucune notice");
      else if (missingNotices.length) warnings.push(`Notice manquante : ${missingNotices.join(", ")}`);
    }

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category,
      principeActif: product.principeActif,
      dosages: product.dosages,
      imageUrl: product.imageUrl,
      noticeCount: product.notices.length,
      published: product.published,
      warnings,
    };
  });

  return <ProductsTable products={rows} canEdit={can(user.role, "edit")} canDelete={can(user.role, "delete")} />;
}
