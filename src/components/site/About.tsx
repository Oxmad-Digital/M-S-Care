export function About() {
  return (
    <section id="apropos" className="mx-auto max-w-[1280px] px-5 py-18 sm:px-8 sm:py-24 lg:px-14 lg:py-37">
      <div className="grid grid-cols-1 items-start gap-8 sm:grid-cols-2 sm:gap-20">
        <div>
          <p className="mb-[18px] text-xs font-bold tracking-[0.18em] text-ms-accent uppercase">
            A propos de nous
          </p>
          <h2 className="text-[32px] leading-[1.08] font-extrabold tracking-tight text-ms-primary sm:text-[54px]">
            Un laboratoire engagé
          </h2>
          <div className="mt-6 h-[3px] w-14 bg-ms-accent" />
        </div>
        <div>
          <p className="mb-5 text-[15.5px] leading-[1.75] text-ms-text-soft sm:text-[17px]">
            M&amp;S Care est un laboratoire dédié à la santé du quotidien, qui
            développe des solutions fiables, accessibles et adaptées aux
            réalités des marchés locaux. Dans cette dynamique, le laboratoire
            a conçu une gamme spécifiquement pensée pour Madagascar, en
            tenant compte des besoins de santé, des usages et des contraintes
            propres au terrain.
          </p>
          <p className="text-[15.5px] leading-[1.75] text-ms-text-soft sm:text-[17px]">
            Portée par une exigence constante de qualité et de sécurité,
            M&amp;S Care propose des produits conçus pour être à la fois
            efficaces, simples d&rsquo;utilisation et accessibles au plus
            grand nombre. Son approche pragmatique et ancrée dans le réel
            vise à apporter des réponses concrètes, durables et adaptées aux
            patients comme aux professionnels de santé.
          </p>
          <a
            href="#nosproduits"
            className="mt-9 inline-flex items-center gap-2.5 border-b border-ms-accent/35 pb-1 text-[15px] font-semibold text-ms-accent transition hover:text-ms-primary"
          >
            Voir la gamme <span className="text-[17px]">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
