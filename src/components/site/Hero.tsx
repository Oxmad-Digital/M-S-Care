import Image from "next/image";
import type { CatalogueProduct } from "@/lib/types";
import { HeroProductCard } from "./HeroProductCard";
import styles from "./Hero.module.css";

export function Hero({ products }: { products: CatalogueProduct[] }) {
  return (
    <section
      id="top"
      className={`${styles.hero} relative flex items-end overflow-hidden bg-ms-primary`}
    >
      <Image
        src="/images/hero.jpeg"
        alt=""
        fill
        preload
        sizes="100vw"
        className={styles.image}
      />
      <div className={`${styles.overlay} absolute inset-0`} />
      <svg
        viewBox="0 0 1000 1000"
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-[52%] h-auto w-[116%] aspect-square -translate-x-1/2 -translate-y-1/2 fill-none stroke-white/[0.06]"
        style={{ strokeWidth: 1.2, vectorEffect: "non-scaling-stroke" }}
      >
        <circle cx="500" cy="305" r="305" />
        <circle cx="500" cy="695" r="305" />
        <circle cx="305" cy="500" r="305" />
        <circle cx="695" cy="500" r="305" />
        <path d="M500 0V265.5M500 734.5V1000M0 500H265.5M734.5 500H1000" />
      </svg>
      <div className={`${styles.content} relative mx-auto flex w-full max-w-[1920px] items-end justify-between gap-10 px-5 sm:px-8 lg:px-14 xl:px-20 2xl:px-24`}>
        <div className="max-w-[660px] animate-ms-rise">
          <p className="mb-5 text-xs font-bold tracking-[0.2em] text-ms-mint uppercase">
            Laboratoire pharmaceutique
          </p>
          <h1 className={`${styles.title} font-extrabold tracking-tight text-white`}>
            Acteur de la santé pour tous
          </h1>
          <p className="mt-6 max-w-[480px] text-[17px] leading-[1.65] text-[#E3F2EE] sm:text-[19px]">
            Des solutions de santé fiables et accessibles, pensées pour
            le quotidien à Madagascar.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 sm:mt-12">
            <a
              href="#nosproduits"
              className="inline-flex items-center justify-center gap-4 rounded-full bg-ms-accent px-7 py-4 text-[15px] font-semibold text-white transition hover:bg-white hover:text-ms-primary"
            >
              Découvrir la gamme
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
        <HeroProductCard products={products} />
      </div>
    </section>
  );
}
