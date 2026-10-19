import type { Role } from "@prisma/client";

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrateur",
  MEMBER: "Membre",
  VIEWER: "Visiteur",
};

export const ROLE_DESCRIPTION: Record<Role, string> = {
  ADMIN: "Accès complet : produits, suppression, paramètres et équipe.",
  MEMBER: "Crée, modifie, publie ou passe en brouillon les fiches, sans pouvoir les supprimer.",
  VIEWER: "Consulte l’espace admin sans rien modifier.",
};

export const ROLES: Role[] = ["ADMIN", "MEMBER", "VIEWER"];

// edit : créer, modifier, publier/dépublier, réordonner les produits et traiter les messages.
// delete : supprimer définitivement des produits.
// manage : maintenance du site, invitations et droits de l'équipe.
export type Permission = "edit" | "delete" | "manage";

const GRANTS: Record<Role, Permission[]> = {
  ADMIN: ["edit", "delete", "manage"],
  MEMBER: ["edit"],
  VIEWER: [],
};

export function can(role: Role, permission: Permission) {
  return GRANTS[role].includes(permission);
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as string[]).includes(value);
}
