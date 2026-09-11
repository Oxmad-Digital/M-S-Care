import Image from "next/image";

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[560px] items-center overflow-hidden bg-ms-primary md:min-h-[82vh] lg:min-h-[820px]"
    >
      <Image
        src="/images/hero.jpeg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[60%_30%] scale-[1.28] translate-x-[9%]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,47,41,0.94)_0%,rgba(13,58,50,0.82)_38%,rgba(16,74,64,0.42)_68%,rgba(20,87,75,0.28)_100%)]" />
      <svg
        viewBox="0 0 1000 1000"
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-[52%] h-auto w-[116%] aspect-square -translate-x-1/2 -translate-y-1/2 fill-none stroke-white/[0.18]"
        style={{ strokeWidth: 1.2, vectorEffect: "non-scaling-stroke" }}
      >
        <circle cx="500" cy="305" r="305" />
        <circle cx="500" cy="695" r="305" />
        <circle cx="305" cy="500" r="305" />
        <circle cx="695" cy="500" r="305" />
        <path d="M500 0V265.5M500 734.5V1000M0 500H265.5M734.5 500H1000" />
      </svg>
      <div className="relative mx-auto w-full max-w-[1280px] px-5 py-16 sm:px-8 sm:py-24 lg:px-14 lg:py-30">
        <div className="max-w-[620px] animate-ms-rise">
          <p className="mb-5 text-xs font-bold tracking-[0.2em] text-ms-mint uppercase">
            Laboratoire pharmaceutique
          </p>
          <h1 className="text-[42px] leading-[1.04] font-extrabold tracking-tight text-white sm:text-[60px] lg:text-[82px]">
            Acteur de la santé pour tous
          </h1>
          <p className="mt-6 max-w-[520px] text-[17px] leading-[1.55] text-[#E3F2EE] sm:text-[21px]">
            M&amp;S Care développe des solutions de santé fiables et
            accessibles, pensées pour les réalités du terrain à Madagascar.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 sm:mt-12">
            <a
              href="#nosproduits"
              className="rounded-full bg-white px-7 py-4 text-[15px] font-semibold text-ms-primary transition hover:bg-ms-mint hover:text-ms-primary-dark"
            >
              Découvrir la gamme
            </a>
            <a
              href="#apropos"
              className="rounded-full border border-white/55 px-7 py-4 text-[15px] font-semibold text-white transition hover:bg-white/16"
            >
              Le laboratoire
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
