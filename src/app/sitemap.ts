import type { MetadataRoute } from "next";
import { getPublishedProducts } from "@/lib/catalogue";
import { SITE_URL } from "@/lib/site-url";

// Régénéré toutes les heures pour suivre les produits publiés.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getPublishedProducts();

  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    ...products.map((product) => ({
      url: `${SITE_URL}/produits/${encodeURIComponent(product.slug)}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${SITE_URL}/mentions-legales`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
