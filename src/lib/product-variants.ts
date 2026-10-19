import type { CatalogueProduct } from "./types";

export function normalizeDosage(dosage: string) {
  return dosage.replace(/\s+/g, "").toLowerCase();
}

export function resolveDosage(product: CatalogueProduct, requested?: string | null) {
  return product.dosages.find((dosage) => requested && normalizeDosage(dosage) === normalizeDosage(requested))
    ?? product.dosages[0]
    ?? null;
}

export function imageForDosage(product: CatalogueProduct, dosage: string | null) {
  return product.variants.find((variant) => dosage && normalizeDosage(variant.dosage) === normalizeDosage(dosage))?.imageUrl
    ?? product.imageUrl;
}

export function productHref(product: CatalogueProduct, dosage: string | null) {
  const path = `/produits/${encodeURIComponent(product.slug)}`;
  return dosage ? `${path}?${new URLSearchParams({ dosage })}` : path;
}

// Associe chaque dosage à la première notice (par position) de même libellé.
export function matchDosageNotices<N extends { label: string }>(product: { dosages: string[]; notices: N[] }) {
  const byDosage = new Map<string, N>();
  for (const dosage of product.dosages) {
    const notice = product.notices.find((n) => normalizeDosage(n.label) === normalizeDosage(dosage));
    if (notice) byDosage.set(dosage, notice);
  }
  const linked = new Set(byDosage.values());
  const otherNotices = product.notices.filter((n) => !linked.has(n));
  return { byDosage, otherNotices };
}
