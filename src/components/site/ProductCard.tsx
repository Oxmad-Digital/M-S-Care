"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CATEGORY_LABEL, type CatalogueProduct } from "@/lib/types";
import { imageForDosage, productHref, resolveDosage } from "@/lib/product-variants";
import { DosageSelector } from "./DosageSelector";

export function ProductCard({ product }: { product: CatalogueProduct }) {
  const [dosage, setDosage] = useState<string | null>(null);
  const activeDosage = resolveDosage(product, dosage);
  const imageUrl = imageForDosage(product, activeDosage);

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-ms-accent/18 bg-white transition hover:-translate-y-1 hover:border-ms-accent/50 hover:shadow-[0_20px_46px_-30px_rgba(20,87,75,0.5)] focus-within:ring-2 focus-within:ring-ms-accent focus-within:ring-offset-4"
    >
      <div className="relative flex items-center justify-center bg-ms-bg/65 px-7 pt-16 pb-6">
        {product.dosages.length > 0 && (
          <div aria-label="Dosages disponibles" className="absolute top-4 right-4 left-4 z-10 flex flex-wrap justify-end gap-1.5">
            {product.dosages.map((dosage) => (
              <DosageSelector
                key={dosage}
                dosage={dosage}
                compact
                selectable={product.dosages.length > 1}
                pressed={dosage === activeDosage}
                onSelect={() => setDosage(dosage)}
              />
            ))}
          </div>
        )}
        <div className="relative aspect-square w-full max-w-[220px]">
          <Image
            key={imageUrl}
            src={imageUrl}
            alt={`Boîte de ${product.name} ${activeDosage ?? ""} M&S Care`}
            fill
            sizes="220px"
            className="object-contain transition duration-300 group-hover:scale-105"
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="mb-3 text-[10px] font-bold tracking-[0.12em] text-ms-text-soft uppercase">
          {CATEGORY_LABEL[product.category]}
        </p>
        <h3 className="mb-1.5 text-[23px] font-bold tracking-tight text-ms-primary">
          {product.name}
        </h3>
        <p className="mb-5 text-sm leading-relaxed text-ms-text">
          {product.principeActif}
        </p>
        {activeDosage && (
          <p aria-live="polite" className="mb-4 text-xs text-ms-text-soft">Dosage : {activeDosage}</p>
        )}
        {product.flavor && (
          <p className="mb-6 text-sm leading-relaxed text-ms-text-soft">
            <span className="font-semibold">Goûts disponibles : </span>{product.flavor}
          </p>
        )}
        <Link
          href={productHref(product, activeDosage)}
          aria-label={`Voir la fiche produit de ${product.name}`}
          className="mt-auto flex cursor-pointer items-center justify-between gap-2 border-t border-ms-border pt-5 text-left text-sm font-semibold text-ms-primary outline-none"
        >
          <span aria-hidden="true" className="absolute inset-0" />
          Voir la fiche produit
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-5 w-5 shrink-0 fill-none stroke-current"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5Z" />
            <path d="M14 3v5h5M9 12h6M9 16h6" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
