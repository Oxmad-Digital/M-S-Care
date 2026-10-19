"use client";

import { Fragment } from "react";
import { m, useReducedMotion, type Variants } from "motion/react";
import { DURATION, EASE_IN_OUT_QUART, EASE_OUT_EXPO, STAGGER, VIEWPORT } from "./tokens";

type WrapperProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  // Pas de clé delay sans délai explicite : elle écraserait le décalage d'un RevealGroup.
  visible: (delay?: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE_OUT_EXPO, ...(delay ? { delay } : {}) },
  }),
};

// Fondu avec légère montée, déclenché à l'entrée dans l'écran.
export function Reveal({ children, className, delay = 0 }: WrapperProps) {
  return (
    <m.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={fadeUp}
      custom={delay}
    >
      {children}
    </m.div>
  );
}

// Révèle ses <RevealItem> les uns après les autres.
export function RevealGroup({ children, className, delay = 0 }: WrapperProps) {
  return (
    <m.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: STAGGER, delayChildren: delay } } }}
    >
      {children}
    </m.div>
  );
}

export function RevealItem({ children, className }: Omit<WrapperProps, "delay">) {
  return (
    <m.div className={className} variants={fadeUp}>
      {children}
    </m.div>
  );
}

// Tracé d'icône qui se dessine, à placer dans un <svg> sous un RevealGroup.
export function DrawPath({ d }: { d: string }) {
  return (
    <m.path
      d={d}
      variants={{
        hidden: { pathLength: 0 },
        visible: { pathLength: 1, transition: { duration: 1.2, ease: EASE_IN_OUT_QUART, delay: 0.15 } },
      }}
    />
  );
}

// Titre dévoilé mot par mot, chaque mot montant derrière un masque.
export function RevealText({ text, delay = 0 }: { text: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <m.span
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: delay } } }}
    >
      {words.map((word, i) => (
        <Fragment key={i}>
          <span className="-mb-[0.14em] inline-block overflow-hidden pb-[0.14em] align-top">
            <m.span
              className="inline-block"
              variants={{
                hidden: { y: "110%" },
                visible: { y: "0%", transition: { duration: 0.9, ease: EASE_OUT_EXPO } },
              }}
            >
              {word}
            </m.span>
          </span>
          {i < words.length - 1 && " "}
        </Fragment>
      ))}
    </m.span>
  );
}

// Image révélée par un rideau qui remonte, pendant qu'elle se dézoome.
// La classe reçue doit positionner le conteneur (relative, ratio, arrondis…).
export function RevealImage({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <m.div
      className={className}
      initial={reduce ? false : { clipPath: "inset(100% 0% 0% 0%)" }}
      whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
      viewport={VIEWPORT}
      transition={{ duration: DURATION.slow, ease: EASE_IN_OUT_QUART }}
    >
      <m.div
        className="absolute inset-0"
        initial={{ scale: 1.15 }}
        whileInView={{ scale: 1 }}
        viewport={VIEWPORT}
        transition={{ duration: 1.6, ease: EASE_OUT_EXPO }}
      >
        {children}
      </m.div>
    </m.div>
  );
}
