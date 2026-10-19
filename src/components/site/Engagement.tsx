import Image from "next/image";

export function Engagement() {
  return (
    <section id="engagement" aria-labelledby="engagement-title" className="bg-ms-bg">
      <div className="mx-auto max-w-[1280px] px-5 py-18 sm:px-8 sm:py-24 lg:px-14">
        <div className="grid grid-cols-1 items-center gap-9 lg:grid-cols-2 lg:gap-20">
          <figure className="m-0">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
              <Image
                src="/images/engagement.jpeg"
                alt="Équipe Interpharma × M&S Care, CCI Ivato Madagascar"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-3 text-[12.5px] tracking-wide text-ms-text-muted">
              Équipe Interpharma × M&amp;S Care — CCI Ivato, Madagascar
            </figcaption>
          </figure>
          <div>
            <p className="mb-[18px] text-xs font-bold tracking-[0.18em] text-ms-accent uppercase">
              À vos côtés, à Madagascar
            </p>
            <h2 id="engagement-title" className="mb-[26px] text-[28px] leading-[1.12] font-extrabold tracking-tight text-ms-primary sm:text-[44px]">
              Agir au plus près du terrain
            </h2>
            <p className="mb-5 text-[15.5px] leading-[1.75] text-ms-text-soft sm:text-[17px]">
              M&amp;S Care s&rsquo;implique dans des actions de santé menées aux
              côtés des professionnels et des acteurs locaux.
            </p>
            <p className="text-[15.5px] leading-[1.75] text-ms-text-soft sm:text-[17px]">
              Avec Interpharma, notre distributeur à Madagascar, nous accompagnons
              les besoins de santé au plus près des populations.
            </p>
            <a href="#contacts" className="mt-8 inline-flex items-center gap-3 rounded-full bg-ms-accent px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-ms-primary">
              Échangeons sur vos besoins
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
