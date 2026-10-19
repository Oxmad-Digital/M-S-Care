// Glissement directionnel entre l'accueil et les fiches produit. Les liens portent le type
// (transitionTypes) ; sans type (bouton retour du navigateur…), pas d'animation de page.
// Les animations correspondantes sont dans globals.css (.nav-forward, .nav-back).
const DIRECTIONAL = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  default: "none",
};

export const PAGE_TRANSITION = {
  enter: DIRECTIONAL,
  exit: DIRECTIONAL,
  default: "none",
} as const;
