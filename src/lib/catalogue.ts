import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { readDatabase } from "@/lib/database-read";
import type { CatalogueProduct } from "@/lib/types";

export const PRODUCTS_TAG = "products";

// Catalogue public mis en cache entre les requêtes : les visiteurs ne touchent plus la base.
// Les actions produits l'invalident aussitôt ; la limite d'une heure rattrape les
// modifications faites hors de l'admin (seed, console Neon…).
const getCachedProducts = unstable_cache(
  (): Promise<CatalogueProduct[]> =>
    readDatabase(() => prisma.product.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
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
    })),
  ["published-products"],
  { tags: [PRODUCTS_TAG], revalidate: 3600 },
);

export const getPublishedProducts = cache(getCachedProducts);

// Lu dans le catalogue en cache : un slug inventé ne crée pas d'entrée de cache.
export async function getPublishedProduct(slug: string) {
  return (await getPublishedProducts()).find((product) => product.slug === slug) ?? null;
}
