import Image from "next/image";
import type { CatalogueProduct } from "@/lib/types";
import { HeroParallax, HeroScrollFade } from "@/components/motion/HeroScroll";
import { HeroProductCard } from "./HeroProductCard";
import styles from "./Hero.module.css";

const TITLE = "Acteur de la santé pour tous";

export function Hero({ products }: { products: CatalogueProduct[] }) {
  return (
    <section
      id="top"
      className={`${styles.hero} relative flex items-end overflow-hidden bg-ms-primary`}
    >
      <HeroParallax className="absolute inset-0">
        <Image
          src="/images/hero.jpeg"
          alt=""
          fill
          preload
          sizes="100vw"
          className={styles.image}
        />
      </HeroParallax>
      <div className={`${styles.overlay} absolute inset-0`} />
      <div aria-hidden="true" className={`${styles.veil} pointer-events-none absolute inset-0`} />
      <svg
        viewBox="0 0 1000 1000"
        aria-hidden="true"
        className={`${styles.rings} pointer-events-none absolute top-1/2 left-[52%] h-auto w-[116%] aspect-square -translate-x-1/2 -translate-y-1/2 fill-none stroke-white/[0.06]`}
        style={{ strokeWidth: 1.2, vectorEffect: "non-scaling-stroke" }}
      >
        <circle cx="500" cy="305" r="305" />
        <circle cx="500" cy="695" r="305" />
        <circle cx="305" cy="500" r="305" />
        <circle cx="695" cy="500" r="305" />
        <path d="M500 0V265.5M500 734.5V1000M0 500H265.5M734.5 500H1000" />
      </svg>
      <HeroScrollFade className={`${styles.content} relative mx-auto flex w-full max-w-[1920px] items-end justify-between gap-10 px-5 sm:px-8 lg:px-14 xl:px-20 2xl:px-24`}>
        <div className="max-w-[660px]">
          <p className={`${styles.eyebrow} mb-5 text-xs font-bold tracking-[0.2em] text-ms-mint uppercase`}>
            Laboratoire pharmaceutique
          </p>
          <h1 className={`${styles.title} font-extrabold tracking-tight text-white`}>
            {TITLE.split(" ").map((word, i) => (
              <span key={i}>
                <span className={styles.word}>
                  <span style={{ "--i": i } as React.CSSProperties}>{word}</span>
                </span>{" "}
              </span>
            ))}
          </h1>
          <p className={`${styles.lead} mt-6 max-w-[480px] text-[17px] leading-[1.65] text-[#E3F2EE] sm:text-[19px]`}>
            Des solutions de santé fiables et accessibles, pensées pour
            le quotidien à Madagascar.
          </p>
          <div className={`${styles.actions} mt-8 flex flex-wrap gap-3 sm:mt-12`}>
            <a
              href="#nosproduits"
              className="btn-fill group inline-flex items-center justify-center gap-4 rounded-full bg-ms-accent px-7 py-4 text-[15px] font-semibold text-white transition-colors duration-300 [--btn-fill:white] hover:text-ms-primary"
            >
              Découvrir la gamme
              <span aria-hidden="true" className="transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
            </a>
          </div>
        </div>
        <HeroProductCard products={products} className={styles.card} />
      </HeroScrollFade>
      <div
        aria-hidden="true"
        className={`${styles.cue} pointer-events-none absolute bottom-0 left-1/2 hidden h-12 w-px -translate-x-1/2 overflow-hidden bg-white/20 xl:block`}
      />
    </section>
  );
}
