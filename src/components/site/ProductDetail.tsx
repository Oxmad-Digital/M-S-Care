"use client";

import { useState, ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { CATEGORY_LABEL, type CatalogueProduct } from "@/lib/types";
import { imageForDosage, matchDosageNotices, resolveDosage } from "@/lib/product-variants";
import { DosageSelector } from "./DosageSelector";

export function ProductDetail({ product, initialDosage }: { product: CatalogueProduct; initialDosage?: string }) {
  const [productDosage, setProductDosage] = useState<string | null>(null);
  const { byDosage, otherNotices } = matchDosageNotices(product);
  // Par défaut (état null) : le premier dosage qui a une notice.
  const activeDosage = resolveDosage(product, productDosage ?? initialDosage ?? product.dosages.find((dosage) => byDosage.has(dosage)));
  const imageUrl = imageForDosage(product, activeDosage);
  const activeNotice = activeDosage ? byDosage.get(activeDosage) : undefined;
  return (
    <article>
      <Link
        href="/#nosproduits"
        transitionTypes={["nav-back"]}
        className="group mb-9 inline-flex items-center gap-3 rounded-full text-sm font-semibold text-ms-accent transition-colors hover:text-ms-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ms-accent sm:mb-11"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ms-accent/20 bg-ms-accent/5 transition-colors duration-200 group-hover:border-ms-accent/40 group-hover:bg-ms-accent/10">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-5 w-5 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:-translate-x-0.5"
          >
            <path d="M10 6.5 4.5 12l5.5 5.5" />
            <path d="M5 12h14.5" />
          </svg>
        </span>
        Retour au catalogue
      </Link>
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-18">
        <div className="relative flex flex-col items-center justify-center rounded-2xl border border-ms-border bg-white p-7 sm:p-10">
          {product.dosages.length > 0 && (
            <div aria-label="Dosages disponibles" className="mb-6 flex w-full flex-wrap justify-end gap-2">
              {product.dosages.map((dosage) => (
                <DosageSelector
                  key={dosage}
                  dosage={dosage}
                  selectable={product.dosages.length > 1 || byDosage.has(dosage)}
                  pressed={dosage === activeDosage}
                  onSelect={() => setProductDosage(dosage)}
                />
              ))}
            </div>
          )}
          <ViewTransition name={`product-${product.id}`} share="morph" default="none">
            <div className="relative aspect-square w-full max-w-[380px]">
              <Image
                key={imageUrl}
                src={imageUrl}
                alt={`Boîte de ${product.name} ${activeDosage ?? ""} M&S Care`}
                fill
                sizes="380px"
                className={`object-contain ${productDosage ? "animate-ms-fade" : ""}`}
              />
            </div>
          </ViewTransition>
        </div>
        <div>
          <p className="mb-3.5 text-xs font-bold tracking-[0.18em] text-ms-accent uppercase">
            {CATEGORY_LABEL[product.category]}
          </p>
          <h1 className="mb-2 text-[34px] leading-[1.06] font-extrabold tracking-tight text-ms-primary break-words sm:text-[54px]">
            {product.name}
          </h1>
          <p className="mb-7 text-[17px] font-semibold text-ms-accent sm:text-xl">
            {product.principeActif}
          </p>
          {activeDosage && <p aria-live="polite" className="mb-5 text-sm text-ms-text-soft">Dosage affiché : {activeDosage}</p>}
          <dl className="mb-9 grid gap-0 border-t border-ms-accent/20">
            {[
              { label: "Forme", value: product.forme },
              { label: "Conditionnement", value: product.conditionnement },
              { label: "Classe", value: product.classe },
              { label: "Indications", value: product.indications },
              { label: "Goûts disponibles", value: product.flavor },
            ].filter((spec) => spec.value).map((spec) => (
              <div
                key={spec.label}
                className="grid grid-cols-1 gap-2 border-b border-ms-accent/10 py-4 sm:grid-cols-[minmax(120px,max-content)_1fr] sm:gap-x-6"
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
                className="btn-fill rounded-full bg-ms-accent px-[26px] py-[15px] text-[15px] font-semibold text-white"
              >
                Consulter la notice du produit
              </a>
            )}
            {otherNotices.map((notice) => {
              // Plusieurs notices : le libellé distingue des boutons au texte identique.
              const description =
                product.notices.length > 1
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
                  className="btn-fill rounded-full bg-ms-accent px-[26px] py-[15px] text-[15px] font-semibold text-white"
                >
                  Consulter la notice du produit
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </article>
  );
}
