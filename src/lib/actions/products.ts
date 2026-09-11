"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProductCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function parseDosages(raw: string): string[] {
  return raw
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function readProductFields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    category: String(formData.get("category") ?? "") as ProductCategory,
    principeActif: String(formData.get("principeActif") ?? "").trim(),
    dosages: parseDosages(String(formData.get("dosages") ?? "")),
    forme: String(formData.get("forme") ?? "").trim(),
    conditionnement: String(formData.get("conditionnement") ?? "").trim(),
    classe: String(formData.get("classe") ?? "").trim(),
    indications: String(formData.get("indications") ?? "").trim(),
    flavor: String(formData.get("flavor") ?? "").trim() || null,
    imageUrl: String(formData.get("imageUrl") ?? "").trim(),
    noticeUrl: String(formData.get("noticeUrl") ?? "").trim(),
    published: formData.get("published") === "on",
  };
}

export async function createProduct(formData: FormData) {
  const fields = readProductFields(formData);
  const slug = slugify(fields.name);

  const count = await prisma.product.count();

  await prisma.product.create({
    data: { ...fields, slug, order: count },
  });

  revalidatePath("/");
  revalidatePath("/admin/produits");
  redirect("/admin/produits");
}

export async function updateProduct(id: string, formData: FormData) {
  const fields = readProductFields(formData);

  await prisma.product.update({
    where: { id },
    data: fields,
  });

  revalidatePath("/");
  revalidatePath("/admin/produits");
  redirect("/admin/produits");
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/admin/produits");
}

export async function toggleProductPublished(id: string, published: boolean) {
  await prisma.product.update({ where: { id }, data: { published } });
  revalidatePath("/");
  revalidatePath("/admin/produits");
}
