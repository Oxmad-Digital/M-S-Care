"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { ProductCategory } from "@prisma/client";
import { CATEGORY_LABEL, type CatalogueProduct } from "@/lib/types";

const TABS: { key: ProductCategory | "all"; label: string }[] = [
  { key: "all", label: "Tous les produits" },
  { key: "MEDICAMENT", label: "Medicaments" },
  { key: "OTC", label: "Medicaments (OTC)" },
  { key: "SUPPLEMENT", label: "Compléments alimentaire" },
];

const PAGE_SIZE = 6;

type Notice = CatalogueProduct["notices"][number];

const normalize = (value: string) => value.replace(/\s+/g, "").toLowerCase();

// Associe chaque dosage à la première notice (par position) de même libellé.
function matchDosageNotices(product: CatalogueProduct) {
  const byDosage = new Map<string, Notice>();
  for (const dosage of product.dosages) {
    const notice = product.notices.find(
      (n) => normalize(n.label) === normalize(dosage),
    );
    if (notice) byDosage.set(dosage, notice);
  }
  const linkedIds = new Set([...byDosage.values()].map((n) => n.id));
  const otherNotices = product.notices.filter((n) => !linkedIds.has(n.id));
  return { byDosage, otherNotices };
}

const DOSAGE_BADGE_CLASS =
  "rounded-md px-[15px] py-[9px] text-[13.5px] font-semibold";

function DosageSelector({
  dosage,
  selectable,
  pressed,
  onSelect,
}: {
  dosage: string;
  selectable: boolean;
  pressed: boolean;
  onSelect: () => void;
}) {
  if (!selectable) {
    return (
      <span className={`${DOSAGE_BADGE_CLASS} bg-ms-badge text-ms-primary`}>
        {dosage}
      </span>
    );
  }
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onSelect}
      className={`${DOSAGE_BADGE_CLASS} cursor-pointer ring-1 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ms-accent ${
        pressed
          ? "bg-ms-accent text-white ring-ms-accent"
          : "bg-ms-badge text-ms-primary ring-ms-accent/30 hover:ring-ms-accent"
      }`}
    >
      {dosage}
    </button>
  );
}

export function Catalogue({ products }: { products: CatalogueProduct[] }) {
  const [filter, setFilter] = useState<ProductCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDosage, setSelectedDosage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (filter !== "all" && p.category !== filter) return false;
      if (!q) return true;
      return `${p.name} ${p.principeActif}`.toLowerCase().includes(q);
    });
  }, [products, filter, query]);

  const visible = filtered.slice(0, limit);
  const selected = selectedId
    ? products.find((p) => p.id === selectedId) ?? null
    : null;

  const scrollToCatalog = () => {
    const el = document.getElementById("nosproduits");
    if (el) {
      window.scrollTo({ top: el.offsetTop - 60, behavior: "smooth" });
    }
  };

  const openProduct = (id: string) => {
    setSelectedId(id);
    setSelectedDosage(null);
    scrollToCatalog();
  };

  const closeDetail = () => {
    setSelectedId(null);
    setSelectedDosage(null);
    scrollToCatalog();
  };

  if (selected) {
    const { byDosage, otherNotices } = matchDosageNotices(selected);
    // Par défaut (état null) : le premier dosage qui a une notice.
    const activeDosage =
      selectedDosage && byDosage.has(selectedDosage)
        ? selectedDosage
        : selected.dosages.find((d) => byDosage.has(d)) ?? null;
    const activeNotice = activeDosage ? byDosage.get(activeDosage) : undefined;
    return (
      <div className="animate-ms-rise">
        <button
          type="button"
          onClick={closeDetail}
          className="mb-9 inline-flex items-center gap-2 text-sm font-semibold text-ms-accent transition hover:text-ms-primary sm:mb-11"
        >
          <span className="text-base">←</span> Retour à la gamme
        </button>
        <div className="grid grid-cols-1 items-start gap-8 sm:grid-cols-2 sm:gap-18">
          <div className="relative flex items-center justify-center rounded-lg border border-ms-border bg-white p-7 sm:p-14">
            <div className="relative aspect-square w-full max-w-[380px]">
              <Image
                src={selected.imageUrl}
                alt={`Boîte de ${selected.name} M&S Care`}
                fill
                sizes="380px"
                className="object-contain"
              />
            </div>
            {selected.flavor && (
              <span className="absolute bottom-5 left-5 rounded-full bg-ms-accent px-[14px] py-[8px] text-[12.5px] font-semibold text-white">
                {selected.flavor}
              </span>
            )}
          </div>
          <div>
            <p className="mb-3.5 text-xs font-bold tracking-[0.18em] text-ms-accent uppercase">
              {CATEGORY_LABEL[selected.category]}
            </p>
            <h2 className="mb-2 text-[34px] leading-[1.06] font-extrabold tracking-tight text-ms-primary sm:text-[54px]">
              {selected.name}
            </h2>
            <p className="mb-7 text-[17px] font-semibold text-ms-accent sm:text-xl">
              {selected.principeActif}
            </p>
            <div className="mb-[34px] flex flex-wrap gap-2">
              {selected.dosages.map((d) => (
                <DosageSelector
                  key={d}
                  dosage={d}
                  selectable={byDosage.has(d)}
                  pressed={d === activeDosage}
                  onSelect={() => setSelectedDosage(d)}
                />
              ))}
            </div>
            <dl className="mb-9 grid gap-0 border-t border-ms-accent/20">
              {[
                { label: "Forme", value: selected.forme },
                { label: "Conditionnement", value: selected.conditionnement },
                { label: "Classe", value: selected.classe },
                { label: "Indications", value: selected.indications },
              ].map((spec) => (
                <div
                  key={spec.label}
                  className="grid grid-cols-[minmax(150px,max-content)_1fr] gap-2 gap-x-6 border-b border-ms-accent/10 py-4"
                >
                  <dt className="pt-1 text-[11px] font-bold tracking-[0.09em] text-ms-text-muted uppercase">
                    {spec.label}
                  </dt>
                  <dd className="text-[15.5px] leading-[1.6] text-ms-text">
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-3">
              {activeDosage && activeNotice && (
                <a
                  href={activeNotice.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Consulter la notice du produit, dosage ${activeDosage}`}
                  className="rounded-full bg-ms-accent px-[26px] py-[15px] text-[15px] font-semibold text-white transition hover:bg-ms-primary"
                >
                  Consulter la notice du produit
                </a>
              )}
              {otherNotices.map((notice) => {
                // Plusieurs notices : le libellé distingue des boutons au texte identique.
                const description =
                  selected.notices.length > 1
                    ? `Consulter la notice du produit, ${notice.label}`
                    : undefined;
                return (
                  <a
                    key={notice.id}
                    href={notice.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={description}
                    title={description}
                    className="rounded-full bg-ms-accent px-[26px] py-[15px] text-[15px] font-semibold text-white transition hover:bg-ms-primary"
                  >
                    Consulter la notice du produit
                  </a>
                );
              })}
              <a
                href="#contacts"
                className="rounded-full border border-ms-accent/40 px-[26px] py-[15px] text-[15px] font-semibold text-ms-primary transition hover:bg-ms-accent/10"
              >
                Contacter le service commercial
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-10 grid grid-cols-1 items-end gap-7 sm:grid-cols-2 sm:gap-18 sm:mb-16">
        <div>
          <p className="mb-[18px] text-xs font-bold tracking-[0.18em] text-ms-accent uppercase">
            Nos produits
          </p>
          <h2 className="text-[28px] leading-[1.1] font-extrabold tracking-tight text-ms-primary sm:text-[48px]">
            Une gamme conçue avec exigence au service de la santé pour tous
          </h2>
        </div>
        <p className="text-[15.5px] leading-[1.75] text-ms-text-soft sm:text-[17px]">
          Traitement et prévention : des solutions fiables et accessibles,
          conçues pour répondre aux besoins essentiels du quotidien.
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
                onClick={() => {
                  setFilter(tab.key);
                  setLimit(PAGE_SIZE);
                }}
                className={`rounded-full border px-[18px] py-[10px] text-sm font-semibold transition ${
                  active
                    ? "border-ms-accent bg-ms-accent text-white"
                    : "border-ms-accent/28 bg-transparent text-ms-text"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="flex h-[46px] min-w-[240px] flex-1 basis-[380px] items-center gap-2.5 rounded-full border border-ms-accent/22 bg-white px-[18px]">
          <span className="block h-[13px] w-[13px] flex-none rounded-full border-[1.6px] border-[#8AA9A1]" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE_SIZE);
            }}
            placeholder="Recherche par nom commercial & principe actif"
            className="w-full border-0 bg-transparent text-[14.5px] text-ms-ink outline-none placeholder:text-[#9BB3AC]"
          />
        </div>
      </div>

      <p className="mb-6 text-[12.5px] font-medium tracking-wide text-ms-text-muted">
        {filtered.length === 0
          ? "Aucun résultat"
          : `${filtered.length} ${filtered.length > 1 ? "produits" : "produit"}`}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((p) => (
          <article
            key={p.id}
            onClick={() => openProduct(p.id)}
            className="group flex cursor-pointer flex-col overflow-hidden rounded-lg border border-ms-accent/18 bg-white transition hover:border-ms-accent hover:-translate-y-[3px] hover:shadow-[0_20px_46px_-30px_rgba(20,87,75,0.5)]"
          >
            <div className="relative flex min-h-[210px] items-center justify-center border-b-2 border-ms-accent/35 bg-ms-bg p-[26px]">
              <div className="relative aspect-square w-full max-w-[200px]">
                <Image
                  src={p.imageUrl}
                  alt={`Boîte de ${p.name} ${p.dosages[0] ?? ""} M&S Care`}
                  fill
                  sizes="200px"
                  className="object-contain"
                />
              </div>
              <div className="absolute top-[14px] right-[14px] flex max-w-[70%] flex-wrap justify-end gap-1.5">
                {p.dosages.map((d) => (
                  <span
                    key={d}
                    className="rounded-md bg-ms-badge px-[10px] py-[5px] text-[11.5px] font-semibold text-ms-primary"
                  >
                    {d}
                  </span>
                ))}
              </div>
              {p.flavor && (
                <span className="absolute bottom-[14px] left-[14px] rounded-full bg-ms-accent px-3 py-1.5 text-[11.5px] font-semibold text-white">
                  {p.flavor}
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col px-[24px] pt-[22px] pb-[24px]">
              <h3 className="mb-1 text-[22px] font-bold tracking-tight text-ms-primary">
                {p.name}
              </h3>
              <p className="mb-5 text-[14.5px] font-semibold text-ms-accent">
                {p.principeActif}
              </p>
              <dl className="grid gap-0 border-t border-ms-accent/14">
                {[
                  { label: "Dosages", value: p.dosages.join(", ") },
                  { label: "Forme", value: p.forme },
                  { label: "Conditionnement", value: p.conditionnement },
                  { label: "Classe", value: p.classe },
                  { label: "Indications", value: p.indications },
                ].map((spec) => (
                  <div
                    key={spec.label}
                    className="grid grid-cols-[118px_1fr] gap-3.5 border-b border-ms-accent/10 py-[11px]"
                  >
                    <dt className="pt-0.5 text-[10.5px] font-bold tracking-[0.09em] text-ms-text-muted uppercase">
                      {spec.label}
                    </dt>
                    <dd className="text-sm leading-[1.55] text-ms-text">
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <span className="mt-auto flex items-center gap-2 pt-5 text-sm font-semibold text-ms-accent">
                Voir la fiche produit <span className="text-base">→</span>
              </span>
            </div>
          </article>
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
