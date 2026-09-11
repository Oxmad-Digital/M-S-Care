import type { ProductCategory } from "@prisma/client";

export type CatalogueProduct = {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  principeActif: string;
  dosages: string[];
  forme: string;
  conditionnement: string;
  classe: string;
  indications: string;
  flavor: string | null;
  imageUrl: string;
  noticeUrl: string;
};

export const CATEGORY_LABEL: Record<ProductCategory, string> = {
  MEDICAMENT: "Medicaments",
  OTC: "Medicaments (OTC)",
  SUPPLEMENT: "Compléments alimentaire",
};
