import Image from "next/image";

export function ProductsIntro() {
  return (
    <section className="bg-ms-primary text-white">
      <div className="mx-auto max-w-[1280px] px-5 py-18 sm:px-8 sm:py-24 lg:px-14 lg:py-33">
        <div className="grid grid-cols-1 items-end gap-9 sm:grid-cols-2 sm:gap-20">
          <div>
            <h2 className="mb-[26px] text-[32px] leading-[1.08] font-extrabold tracking-tight text-white sm:text-[54px]">
              Nos produits
            </h2>
            <p className="mb-5 text-[15.5px] leading-[1.75] text-white/80 sm:text-[17px]">
              Les produits M&amp;S Care couvrent les besoins de santé du
              quotidien, de la prévention au traitement des pathologies
              courantes. Développée pour répondre aux réalités du terrain,
              notamment à Madagascar, la gamme tient compte des usages, des
              conditions d&rsquo;accès et des priorités de santé.
            </p>
            <p className="text-[15.5px] leading-[1.75] text-white/80 sm:text-[17px]">
              Conçus selon des standards de qualité exigeants, les produits
              allient efficacité, sécurité et simplicité d&rsquo;utilisation,
              pour une prise en charge fiable et accessible au quotidien.
            </p>
          </div>
          <div className="relative aspect-[16/11] w-full overflow-hidden rounded-[6px]">
            <Image
              src="/images/about.jpg"
              alt=""
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
