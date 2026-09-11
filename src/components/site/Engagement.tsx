import Image from "next/image";

export function Engagement() {
  return (
    <section className="mx-auto max-w-[1280px] px-5 py-18 sm:px-8 sm:py-24 lg:px-14 lg:py-37">
      <div className="grid grid-cols-1 items-center gap-9 sm:grid-cols-2 sm:gap-20">
        <figure className="m-0">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[6px]">
            <Image
              src="/images/engagement.jpeg"
              alt="Équipe Interpharma × M&S Care, CCI Ivato Madagascar"
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <figcaption className="mt-3 text-[12.5px] tracking-wide text-ms-text-muted">
            Équipe Interpharma × M&amp;S Care — CCI Ivato, Madagascar
          </figcaption>
        </figure>
        <div>
          <p className="mb-[18px] text-xs font-bold tracking-[0.18em] text-ms-accent uppercase">
            Engagement
          </p>
          <h2 className="mb-[26px] text-[28px] leading-[1.12] font-extrabold tracking-tight text-ms-primary sm:text-[44px]">
            Agir au plus près du terrain
          </h2>
          <p className="mb-5 text-[15.5px] leading-[1.75] text-ms-text-soft sm:text-[17px]">
            M&amp;S Care s&rsquo;implique dans des actions de santé menées aux
            côtés des professionnels et des acteurs locaux.
          </p>
          <p className="text-[15.5px] leading-[1.75] text-ms-text-soft sm:text-[17px]">
            À travers des initiatives de terrain, la marque traduit une
            volonté concrète d&rsquo;accompagner les besoins de santé au plus
            près des populations, avec une approche engagée et responsable.
          </p>
        </div>
      </div>
    </section>
  );
}
