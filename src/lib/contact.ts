// Objets proposés dans le formulaire de contact, réutilisés pour le filtre de l'admin.
export const CONTACT_SUBJECTS = [
  "Service commercial",
  "Service commande",
  "Service livraison",
  "Autre",
] as const;

// Champ piège invisible pour un humain : les robots qui remplissent tout le renseignent.
export const HONEYPOT_FIELD = "website";
// Horodatage posé au chargement du formulaire par le navigateur.
export const STARTED_AT_FIELD = "startedAt";
// En dessous, personne n'a pu remplir le formulaire à la main.
export const MIN_FILL_MS = 3000;

// Domaines de la marque : un visiteur n'écrit pas depuis ces adresses, ce sont des expéditeurs usurpés
// (et l'accusé de réception partirait vers notre propre domaine).
const OWN_DOMAINS = ["mandscare.com"];

export type SpamCheck = {
  honeypot: string;
  startedAt: string;
  email: string;
  now?: number;
};

// Renvoie la raison du rejet, ou null si l'envoi semble venir d'un humain.
export function detectSpam({ honeypot, startedAt, email, now = Date.now() }: SpamCheck): string | null {
  if (honeypot.trim()) return "honeypot";

  const started = Number(startedAt);
  if (!startedAt || !Number.isFinite(started)) return "no-timestamp";
  if (now - started < MIN_FILL_MS) return "too-fast";

  const domain = email.split("@").pop()?.toLowerCase() ?? "";
  if (OWN_DOMAINS.some((own) => domain === own || domain.endsWith(`.${own}`))) return "own-domain";

  return null;
}
