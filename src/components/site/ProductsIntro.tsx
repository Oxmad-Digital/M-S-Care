import Image from "next/image";
import { RevealGroup, RevealImage, RevealItem, RevealText } from "@/components/motion/Reveal";

export function ProductsIntro() {
  return (
    <section id="presentation-produits" aria-labelledby="products-intro-title" className="bg-ms-badge">
      <div className="mx-auto max-w-[1280px] px-5 py-18 sm:px-8 sm:py-24 lg:px-14 lg:py-33">
        <div className="grid grid-cols-1 items-end gap-9 sm:grid-cols-2 sm:gap-20">
          <RevealGroup>
            <h2 id="products-intro-title" className="mb-[26px] text-[32px] leading-[1.08] font-extrabold tracking-tight text-ms-primary sm:text-[54px]">
              <RevealText text="Nos produits" />
            </h2>
            <RevealItem>
            <p className="mb-5 text-[15.5px] leading-[1.75] text-ms-text-soft sm:text-[17px]">
              Les produits M&amp;S Care couvrent les besoins de santé du
              quotidien, de la prévention au traitement des pathologies
              courantes. Développée pour répondre aux réalités du terrain,
              notamment à Madagascar, la gamme tient compte des usages, des
              conditions d&rsquo;accès et des priorités de santé.
            </p>
            </RevealItem>
            <RevealItem>
            <p className="text-[15.5px] leading-[1.75] text-ms-text-soft sm:text-[17px]">
              Conçus selon des standards de qualité exigeants, les produits
              allient efficacité, sécurité et simplicité d&rsquo;utilisation,
              pour une prise en charge fiable et accessible au quotidien.
            </p>
            </RevealItem>
          </RevealGroup>
          <RevealImage className="relative aspect-[16/11] w-full overflow-hidden rounded-[6px]">
            <Image
              src="/images/about.jpg"
              alt=""
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          </RevealImage>
        </div>
      </div>
    </section>
  );
}
