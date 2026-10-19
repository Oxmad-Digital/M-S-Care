"use client";

import { useMemo, useState } from "react";
import type { ProductCategory } from "@prisma/client";
import type { CatalogueProduct } from "@/lib/types";
import { ProductCard } from "./ProductCard";

const TABS: { key: ProductCategory | "all"; label: string }[] = [
  { key: "all", label: "Tous les produits" },
  { key: "MEDICAMENT", label: "Médicaments" },
  { key: "OTC", label: "Médicaments (OTC)" },
  { key: "SUPPLEMENT", label: "Compléments alimentaires" },
];

const PAGE_SIZE = 6;

export function Catalogue({ products }: { products: CatalogueProduct[] }) {
  const [filter, setFilter] = useState<ProductCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (filter !== "all" && p.category !== filter) return false;
      if (!q) return true;
      return `${p.name} ${p.principeActif}`.toLowerCase().includes(q);
    });
  }, [products, filter, query]);

  const visible = filtered.slice(0, limit);

  return (
    <div>
      <div className="mb-10 grid grid-cols-1 items-end gap-6 lg:grid-cols-2 lg:gap-18">
        <div>
          <p className="mb-[18px] text-xs font-bold tracking-[0.18em] text-ms-accent uppercase">
            Nos produits
          </p>
          <h2 className="max-w-[16ch] text-[32px] leading-[1.12] font-extrabold tracking-tight text-ms-primary sm:text-[48px]">
            Des solutions pour le quotidien
          </h2>
        </div>
        <p className="text-[15.5px] leading-[1.75] text-ms-text-soft sm:text-[17px]">
          Retrouvez nos produits par nom ou principe actif, puis consultez
          leur fiche pour les dosages, les caractéristiques et les notices.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-ms-accent/20 pb-5 sm:mb-9">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setFilter(tab.key);
                  setLimit(PAGE_SIZE);
                }}
                className={`rounded-full border px-[18px] py-[10px] text-sm font-semibold transition ${
                  active
                    ? "border-ms-accent bg-ms-accent text-white"
                    : "border-ms-accent/28 bg-transparent text-ms-text hover:border-ms-accent hover:bg-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <label className="flex h-12 min-w-0 flex-1 basis-full items-center gap-3 rounded-full border border-ms-accent/22 bg-white px-5 focus-within:border-ms-accent lg:basis-[320px]">
          <span className="sr-only">Rechercher par nom ou principe actif</span>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0 fill-none stroke-ms-text-soft" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE_SIZE);
            }}
            placeholder="Nom ou principe actif"
            className="min-w-0 w-full border-0 bg-transparent text-sm text-ms-ink outline-none placeholder:text-ms-text-soft"
          />
        </label>
      </div>

      <p role="status" className="mb-6 text-[12.5px] font-medium tracking-wide text-ms-text-soft">
        {filtered.length === 0
          ? "Aucun résultat"
          : `${filtered.length} ${filtered.length > 1 ? "produits" : "produit"}`}
      </p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-lg border border-dashed border-ms-accent/35 bg-white px-6 py-14 text-center">
          <p className="mb-1.5 text-[17px] font-bold text-ms-primary">
            Aucun produit dans cette catégorie
          </p>
          <p className="text-[14.5px] text-ms-text-soft">
            Modifiez votre recherche ou sélectionnez une autre catégorie.
          </p>
        </div>
      )}

      {filtered.length > visible.length && (
        <div className="mt-9 flex justify-center sm:mt-13">
          <button
            type="button"
            onClick={() => setLimit(filtered.length)}
            className="rounded-full border border-ms-accent/40 bg-transparent px-[34px] py-[15px] text-[15px] font-semibold text-ms-primary transition hover:bg-ms-accent hover:text-white hover:border-ms-accent"
          >
            Voir plus
          </button>
        </div>
      )}
    </div>
  );
}
