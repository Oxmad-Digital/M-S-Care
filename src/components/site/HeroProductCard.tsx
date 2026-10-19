"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CATEGORY_LABEL, type CatalogueProduct } from "@/lib/types";
import { productHref, resolveDosage } from "@/lib/product-variants";

// Durée d'affichage de chaque produit avant de passer au suivant.
const ROTATION_MS = 5000;

export function HeroProductCard({ products }: { products: CatalogueProduct[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || products.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % products.length), ROTATION_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused, products.length]);

  const product = products[index];
  if (!product) return null;
  const dosage = resolveDosage(product, null);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="group relative hidden w-[340px] flex-none animate-ms-rise rounded-2xl border border-white/15 bg-white/10 p-3 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.6)] backdrop-blur-xl transition hover:border-white/30 hover:bg-white/15 lg:block"
    >
      <div key={product.id} className="flex animate-ms-rise items-center gap-4">
        <div className="relative h-[92px] w-[92px] flex-none overflow-hidden rounded-xl bg-white">
          <Image
            src={product.imageUrl}
            alt=""
            fill
            sizes="92px"
            className="object-contain p-2 transition duration-300 group-hover:scale-105"
          />
        </div>
        <div className="min-w-0 flex-1 pr-1">
          <p className="mb-1 text-[10px] font-bold tracking-[0.14em] text-ms-mint uppercase">
            {CATEGORY_LABEL[product.category]}
          </p>
          <Link
            href={productHref(product, dosage)}
            className="block truncate text-[17px] font-bold tracking-tight text-white outline-none"
          >
            {/* Toute la carte est cliquable. */}
            <span aria-hidden="true" className="absolute inset-0 rounded-2xl" />
            {product.name}
          </Link>
          <p className="truncate text-[13px] text-white/70">{product.principeActif}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-white/90">
            Voir le produit
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
          </p>
        </div>
      </div>

      {products.length > 1 && (
        <div className="relative mt-3 flex items-center gap-1.5 px-1">
          {products.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Afficher ${p.name}`}
              aria-current={i === index ? "true" : undefined}
              className={`relative z-10 h-1 cursor-pointer rounded-full transition-all duration-300 ${
                i === index ? "w-6 bg-white" : "w-2 bg-white/35 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
