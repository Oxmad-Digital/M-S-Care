import Image from "next/image";
import { DrawPath, RevealGroup, RevealImage, RevealItem, RevealText } from "@/components/motion/Reveal";

const COMMITMENTS = [
  {
    title: "Qualité",
    description: "Une exigence de qualité et de sécurité à chaque étape.",
    path: "M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3ZM8 12l3 3 5-6",
  },
  {
    title: "Accessibilité",
    description: "Des solutions pensées pour les besoins de santé du quotidien.",
    path: "M12 20S3 15 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 11-9 11Z",
  },
  {
    title: "Proximité",
    description: "Une approche ancrée dans les réalités du terrain à Madagascar.",
    path: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  },
];

export function About() {
  return (
    <section id="apropos" aria-labelledby="about-title" className="mx-auto max-w-[1280px] px-5 py-18 sm:px-8 sm:py-24 lg:px-14">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-20">
        <RevealGroup>
          <RevealItem>
            <p className="mb-[18px] text-xs font-bold tracking-[0.18em] text-ms-accent uppercase">
              Le laboratoire
            </p>
          </RevealItem>
          <h2 id="about-title" className="max-w-[16ch] text-[32px] leading-[1.12] font-extrabold tracking-tight text-ms-primary sm:text-[48px]">
            <RevealText text="La santé pour tous, au cœur de notre engagement" delay={0.1} />
          </h2>
          <RevealItem>
          <p className="mt-6 text-[15.5px] leading-[1.75] text-ms-text-soft sm:text-[17px]">
            M&amp;S Care développe des solutions de santé fiables et accessibles.
            Notre gamme est pensée pour Madagascar, au plus près des besoins
            des patients et des professionnels de santé.
          </p>
          </RevealItem>
          <RevealItem>
          <p className="mt-4 text-[15.5px] leading-[1.75] text-ms-text-soft sm:text-[17px]">
            Notre ambition : apporter des réponses concrètes et adaptées aux
            réalités locales, avec une exigence constante de qualité et de sécurité.
          </p>
          </RevealItem>
          <RevealItem>
          <a
            href="#engagement"
            className="mt-9 inline-flex items-center gap-2.5 border-b border-ms-accent/35 pb-1 text-[15px] font-semibold text-ms-accent transition hover:text-ms-primary"
          >
            Notre engagement sur le terrain <span aria-hidden="true" className="text-[17px]">→</span>
          </a>
          </RevealItem>
        </RevealGroup>
        <RevealImage className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-ms-bg">
          <Image src="/images/about.jpg" alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </RevealImage>
      </div>
      <RevealGroup className="mt-14 grid gap-8 border-t border-ms-border pt-10 sm:grid-cols-3 sm:gap-10">
        {COMMITMENTS.map((commitment) => (
          <RevealItem key={commitment.title}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="mb-4 h-7 w-7 fill-none stroke-ms-accent" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <DrawPath d={commitment.path} />
            </svg>
            <h3 className="mb-2 text-lg font-bold text-ms-primary">{commitment.title}</h3>
            <p className="max-w-[34ch] text-sm leading-[1.75] text-ms-text-soft">{commitment.description}</p>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
