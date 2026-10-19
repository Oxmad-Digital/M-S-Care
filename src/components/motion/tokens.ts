// Langage de mouvement commun au site : mêmes courbes et durées partout.
// Les équivalents CSS sont dans globals.css (--ease-out-expo, --ease-in-out-quart).
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT_QUART = [0.76, 0, 0.24, 1] as const;

export const DURATION = {
  fast: 0.2,
  base: 0.7,
  slow: 1.1,
} as const;

export const STAGGER = 0.08;

// Déclenche une révélation quand l'élément dépasse le bas de l'écran de 12 %.
export const VIEWPORT = { once: true, margin: "0px 0px -12% 0px" } as const;
