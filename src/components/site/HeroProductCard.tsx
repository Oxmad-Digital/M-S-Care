"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, m } from "motion/react";
import { CATEGORY_LABEL, type CatalogueProduct } from "@/lib/types";
import { productHref, resolveDosage } from "@/lib/product-variants";
import { EASE_OUT_EXPO } from "@/components/motion/tokens";

export function HeroProductCard({ products, className = "" }: { products: CatalogueProduct[]; className?: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const product = products[index];
  if (!product) return null;
  const dosage = resolveDosage(product, null);
  const next = () => setIndex((i) => (i + 1) % products.length);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`group relative hidden w-[380px] flex-none rounded-2xl border border-white/15 bg-white/10 p-4 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.6)] backdrop-blur-xl transition hover:border-white/30 hover:bg-white/15 lg:block ${className}`}
    >
      {/* Les deux produits se superposent dans la même cellule pendant le fondu croisé. */}
      <div className="grid grid-cols-[minmax(0,1fr)]">
        <AnimatePresence initial={false}>
          <m.div
            key={product.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
            className="col-start-1 row-start-1 flex min-w-0 items-center gap-4"
          >
            <div className="relative h-[108px] w-[108px] flex-none overflow-hidden rounded-xl bg-white">
              <Image
                src={product.imageUrl}
                alt=""
                fill
                sizes="108px"
                className="object-contain p-2 transition duration-500 ease-out-expo group-hover:scale-105"
              />
            </div>
            <div className="min-w-0 flex-1 pr-1">
              <p className="mb-1 text-[11px] font-bold tracking-[0.14em] text-ms-mint uppercase">
                {CATEGORY_LABEL[product.category]}
              </p>
              <Link
                href={productHref(product, dosage)}
                transitionTypes={["nav-forward"]}
                className="block truncate text-[18px] font-bold tracking-tight text-white outline-none"
              >
                {/* Toute la carte est cliquable. */}
                <span aria-hidden="true" className="absolute inset-0 rounded-2xl" />
                {product.name}
              </Link>
              <p className="truncate text-[14px] text-white/70">{product.principeActif}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-[14px] font-semibold text-white/90">
                Voir le produit
                <span aria-hidden="true" className="transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
              </p>
            </div>
          </m.div>
        </AnimatePresence>
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
              className={`relative z-10 h-1 cursor-pointer overflow-hidden rounded-full transition-all duration-500 ease-out-expo ${
                i === index ? "w-6 bg-white/35" : "w-2 bg-white/35 hover:bg-white/60"
              }`}
            >
              {/* La fin de la jauge fait passer au produit suivant ; elle se fige au survol.
                  Sans animation (préférence système), la rotation automatique est coupée. */}
              {i === index && (
                <span
                  key={index}
                  onAnimationEnd={next}
                  className="animate-ms-progress absolute inset-0 rounded-full bg-white"
                  style={{ animationPlayState: paused ? "paused" : "running" }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
