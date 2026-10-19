"use client";

import { LazyMotion, MotionConfig, domMax } from "motion/react";

// reducedMotion="user" : si le visiteur demande moins d'animations, les déplacements
// sont supprimés et seuls les fondus restent.
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
