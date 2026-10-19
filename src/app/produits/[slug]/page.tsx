import type { Metadata } from "next";
import { cache, ViewTransition } from "react";
import { notFound } from "next/navigation";
import { getPublishedProduct } from "@/lib/catalogue";
import { ProductDetail } from "@/components/site/ProductDetail";
import { PAGE_TRANSITION } from "@/components/motion/page-transition";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ dosage?: string | string[] }>;
};

const getProduct = cache(async (slug: string) => {
  const product = await getPublishedProduct(slug);
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

  return (
    <ViewTransition {...PAGE_TRANSITION}>
      <div>
        <ProductDetail key={`${product.id}-${initialDosage ?? ""}`} product={product} initialDosage={initialDosage} />
      </div>
    </ViewTransition>
  );
}
