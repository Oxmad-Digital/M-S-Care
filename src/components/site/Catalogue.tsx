"use client";

import { useMemo, useRef, useState } from "react";
import type { ProductCategory } from "@prisma/client";
import { AnimatePresence, m, useInView, type Variants } from "motion/react";
import { RevealText } from "@/components/motion/Reveal";
import { EASE_OUT_EXPO, VIEWPORT } from "@/components/motion/tokens";
import type { CatalogueProduct } from "@/lib/types";
import { ProductCard } from "./ProductCard";

const TABS: { key: ProductCategory | "all"; label: string }[] = [
  { key: "all", label: "Tous les produits" },
  { key: "MEDICAMENT", label: "Médicaments" },
  { key: "OTC", label: "Médicaments (OTC)" },
  { key: "SUPPLEMENT", label: "Compléments alimentaires" },
];

const PAGE_SIZE = 6;

// Chaque carte arrive avec un léger décalage selon sa place dans son lot de PAGE_SIZE.
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT_EXPO, delay: (i % PAGE_SIZE) * 0.07 },
  }),
};

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
  const gridRef = useRef<HTMLDivElement>(null);
  const gridInView = useInView(gridRef, VIEWPORT);

  return (
    <div>
      <div className="mb-10 grid grid-cols-1 items-end gap-6 lg:grid-cols-2 lg:gap-18">
        <div>
          <p className="mb-[18px] text-xs font-bold tracking-[0.18em] text-ms-accent uppercase">
            Nos produits
          </p>
          <h2 className="max-w-[16ch] text-[32px] leading-[1.12] font-extrabold tracking-tight text-ms-primary sm:text-[48px]">
            <RevealText text="Des solutions pour le quotidien" />
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
                className={`relative isolate rounded-full border px-[18px] py-[10px] text-sm font-semibold transition-colors duration-300 ${
                  active
                    ? "border-ms-accent text-white"
                    : "border-ms-accent/28 bg-transparent text-ms-text hover:border-ms-accent hover:bg-white"
                }`}
              >
                {/* Pastille partagée qui glisse d'un onglet à l'autre. */}
                {active && (
                  <m.span
                    layoutId="catalogue-tab"
                    aria-hidden="true"
                    className="absolute -inset-px -z-10 rounded-full bg-ms-accent"
                    transition={{ type: "spring", bounce: 0.18, duration: 0.55 }}
                  />
                )}
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

      <m.div
        ref={gridRef}
        initial="hidden"
        animate={gridInView ? "visible" : "hidden"}
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {visible.map((p, i) => (
            <m.div
              key={p.id}
              layout
              custom={i}
              variants={cardVariants}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.25 } }}
              transition={{ layout: { duration: 0.6, ease: EASE_OUT_EXPO } }}
              className="flex"
            >
              <ProductCard product={p} />
            </m.div>
          ))}
        </AnimatePresence>
      </m.div>

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
            className="btn-fill rounded-full bg-ms-accent px-[34px] py-[15px] text-[15px] font-semibold text-white"
          >
            Voir plus
          </button>
        </div>
      )}
    </div>
  );
}
