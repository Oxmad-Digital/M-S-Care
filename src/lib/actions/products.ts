"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { ProductCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PRODUCTS_TAG } from "@/lib/catalogue";
import { normalizeDosage } from "@/lib/product-variants";
import { formatProductName } from "@/lib/product-name";
import { requireUser } from "@/lib/current-user";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Un produit dupliqué peut garder le même nom : on suffixe le slug pour qu'il reste unique.
async function uniqueSlug(name: string) {
  const base = slugify(name);
  for (let n = 1; ; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    if (!(await prisma.product.findUnique({ where: { slug }, select: { id: true } }))) return slug;
  }
}

function readProductFields(formData: FormData) {
  return {
    name: formatProductName(String(formData.get("name") ?? "").trim()),
    category: String(formData.get("category") ?? "") as ProductCategory,
    principeActif: String(formData.get("principeActif") ?? "").trim(),
    forme: String(formData.get("forme") ?? "").trim(),
    conditionnement: String(formData.get("conditionnement") ?? "").trim(),
    classe: String(formData.get("classe") ?? "").trim(),
    indications: String(formData.get("indications") ?? "").trim(),
    flavor: String(formData.get("flavor") ?? "").trim() || null,
    published: formData.get("published") === "on",
  };
}

// Chaque ligne « dosage » porte son image et sa notice (optionnelles) ; les notices
// de dosage prennent le dosage comme libellé, ce qui les relie sur la fiche produit.
function readDosages(formData: FormData) {
  const labels = formData.getAll("dosage").map((value) => String(value).trim());
  const images = formData.getAll("dosageImageUrl").map((value) => String(value).trim());
  const noticeUrls = formData.getAll("dosageNoticeUrl").map((value) => String(value).trim());
  const rows = labels
    .map((dosage, index) => ({ dosage, imageUrl: images[index] ?? "", noticeUrl: noticeUrls[index] ?? "" }))
    .filter((row) => row.dosage);

  const seen = new Set<string>();
  for (const { dosage } of rows) {
    if (seen.has(normalizeDosage(dosage))) throw new Error(`Le dosage « ${dosage} » est saisi deux fois.`);
    seen.add(normalizeDosage(dosage));
  }

  const otherLabels = formData.getAll("noticeLabel").map((v) => String(v).trim());
  const otherNotices = formData
    .getAll("noticeUrl")
    .map((v, index) => ({ label: otherLabels[index] || "Notice", url: String(v).trim() }))
    .filter((notice) => notice.url);

  // L'image du produit est celle du premier dosage (ou le champ unique s'il n'y a aucun dosage).
  const imageUrl = rows.length ? rows[0].imageUrl : String(formData.get("imageUrl") ?? "").trim();
  if (!imageUrl) throw new Error("L’image du premier dosage est obligatoire.");

  return {
    imageUrl,
    dosages: rows.map((row) => row.dosage),
    variants: rows
      .filter((row) => row.imageUrl)
      .map((row, position) => ({ dosage: row.dosage, imageUrl: row.imageUrl, position })),
    notices: [
      ...rows.filter((row) => row.noticeUrl).map((row) => ({ label: row.dosage, url: row.noticeUrl })),
      ...otherNotices,
    ].map((notice, position) => ({ ...notice, position })),
  };
}

export async function createProduct(formData: FormData) {
  await requireUser("edit");
  const fields = readProductFields(formData);
  const { imageUrl, dosages, variants, notices } = readDosages(formData);
  const slug = await uniqueSlug(fields.name);

  const count = await prisma.product.count();

  await prisma.product.create({
    data: { ...fields, imageUrl, dosages, slug, order: count, notices: { create: notices }, variants: { create: variants } },
  });

  revalidateProducts();
  redirect("/admin/produits?ok=cree");
}

export async function updateProduct(id: string, formData: FormData) {
  await requireUser("edit");
  const fields = readProductFields(formData);
  const { imageUrl, dosages, variants, notices } = readDosages(formData);

  await prisma.product.update({
    where: { id },
    data: { ...fields, imageUrl, dosages, notices: { deleteMany: {}, create: notices }, variants: { deleteMany: {}, create: variants } },
  });

  revalidateProducts();
  redirect("/admin/produits?ok=modifie");
}

// expire: 0 — la prochaine visite relit la base au lieu de servir l'ancien catalogue.
function revalidateProducts() {
  revalidateTag(PRODUCTS_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/produits/[slug]", "page");
  revalidatePath("/admin/produits");
}

export async function deleteProducts(ids: string[]) {
  await requireUser("delete");
  await prisma.product.deleteMany({ where: { id: { in: ids } } });
  revalidateProducts();
}

export async function setProductsPublished(ids: string[], published: boolean) {
  await requireUser("edit");
  await prisma.product.updateMany({ where: { id: { in: ids } }, data: { published } });
  revalidateProducts();
}

// Échange le produit avec son voisin, puis renumérote tout le catalogue pour
// effacer les doublons éventuels de `order`.
export async function moveProduct(id: string, direction: "up" | "down") {
  await requireUser("edit");
  const products = await prisma.product.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, order: true },
  });
  const index = products.findIndex((product) => product.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= products.length) return;

  [products[index], products[target]] = [products[target], products[index]];
  await prisma.$transaction(
    products
      .map((product, order) => ({ ...product, newOrder: order }))
      .filter((product) => product.order !== product.newOrder)
      .map((product) => prisma.product.update({ where: { id: product.id }, data: { order: product.newOrder } })),
  );
  revalidateProducts();
}
