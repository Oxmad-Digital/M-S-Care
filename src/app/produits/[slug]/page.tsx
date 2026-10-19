import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { readDatabase } from "@/lib/database-read";
import { ProductDetail } from "@/components/site/ProductDetail";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ dosage?: string | string[] }>;
};

const getProduct = cache(async (slug: string) => {
  const product = await readDatabase(() => prisma.product.findFirst({
    where: { slug, published: true },
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      principeActif: true,
      dosages: true,
      forme: true,
      conditionnement: true,
      classe: true,
      indications: true,
      flavor: true,
      imageUrl: true,
      variants: {
        orderBy: { position: "asc" },
        select: { dosage: true, imageUrl: true },
      },
      notices: {
        orderBy: { position: "asc" },
        select: { id: true, label: true, url: true },
      },
    },
  }));

  if (!product) notFound();
  return product;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  return {
    title: `${product.name} — M&S Care`,
    description: `${product.name} — ${product.principeActif}. Consultez les dosages, les caractéristiques et les notices du produit M&S Care.`,
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  const { dosage } = await searchParams;
  const initialDosage = typeof dosage === "string" ? dosage : undefined;

  return <ProductDetail key={`${product.id}-${initialDosage ?? ""}`} product={product} initialDosage={initialDosage} />;
}
