"use client";

import { m, useReducedMotion, useScroll, useTransform } from "motion/react";

type Props = { children: React.ReactNode; className?: string };

// Le fond du hero défile plus lentement que la page (parallaxe).
export function HeroParallax({ children, className }: Props) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 300], { clamp: false });
  return (
    <m.div className={className} style={reduce ? undefined : { y }}>
      {children}
    </m.div>
  );
}

// Le contenu du hero s'estompe en remontant quand on quitte l'écran d'accueil.
export function HeroScrollFade({ children, className }: Props) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 650], [1, 0]);
  const y = useTransform(scrollY, [0, 650], [0, -60]);
  return (
    <m.div className={className} style={reduce ? undefined : { opacity, y }}>
      {children}
    </m.div>
  );
}
