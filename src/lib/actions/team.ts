"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { displayName, requireUser, type CurrentUser } from "@/lib/current-user";
import { appUrl, sendEmail } from "@/lib/email";
import { invitationEmail } from "@/lib/email-templates";
import { isRole, ROLE_DESCRIPTION, ROLE_LABEL } from "@/lib/permissions";
import { hashToken, INVITATION_DAYS } from "@/lib/invitations";
import type { ActionState } from "@/lib/action-state";

// Génère un nouveau jeton (seul son hash est stocké) et envoie le lien d'invitation.
async function sendInvitation(invitationId: string, email: string, role: Role, inviter: CurrentUser) {
  const token = randomBytes(32).toString("base64url");
  await prisma.invitation.update({
    where: { id: invitationId },
    data: { tokenHash: hashToken(token), expiresAt: new Date(Date.now() + INVITATION_DAYS * 86_400_000) },
  });

  const siteUrl = await appUrl();
  await sendEmail({
    to: email,
    ...invitationEmail({
      siteUrl,
      inviterName: displayName(inviter),
      roleLabel: ROLE_LABEL[role],
      roleDescription: ROLE_DESCRIPTION[role],
      link: `${siteUrl}/admin/invitation/${token}`,
      days: INVITATION_DAYS,
    }),
  });
}

function revalidateSettings() {
  revalidatePath("/admin/parametres");
}

export async function inviteMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const inviter = await requireUser("manage");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = formData.get("role");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Adresse email invalide." };
  if (!isRole(role)) return { error: "Rôle invalide." };

  if (await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } })) {
    return { error: "Cette personne a déjà un compte." };
  }

  // Une nouvelle invitation remplace celles encore en attente pour la même adresse.
  await prisma.invitation.deleteMany({ where: { email, acceptedAt: null } });
  const invitation = await prisma.invitation.create({
    data: { email, role, invitedById: inviter.id, tokenHash: randomBytes(32).toString("hex"), expiresAt: new Date() },
  });

  try {
    await sendInvitation(invitation.id, email, role, inviter);
  } catch (error) {
    await prisma.invitation.delete({ where: { id: invitation.id } });
    console.error(error);
    return { error: "L’email d’invitation n’a pas pu être envoyé. Réessayez plus tard." };
  }

  revalidateSettings();
  return { ok: true, message: `Invitation envoyée à ${email}.` };
}

// Les actions suivantes renvoient leur erreur plutôt que de la lever :
// en production, le message d'une exception n'est pas transmis au navigateur.

export async function resendInvitation(id: string): Promise<ActionState> {
  const inviter = await requireUser("manage");
  const invitation = await prisma.invitation.findUnique({ where: { id } });
  if (!invitation || invitation.acceptedAt) return { error: "Cette invitation n’existe plus." };
  try {
    await sendInvitation(invitation.id, invitation.email, invitation.role, inviter);
  } catch (error) {
    console.error(error);
    return { error: "L’email d’invitation n’a pas pu être envoyé. Réessayez plus tard." };
  }
  revalidateSettings();
  return { ok: true, message: `Invitation renvoyée à ${invitation.email}.` };
}

export async function revokeInvitation(id: string): Promise<ActionState> {
  await requireUser("manage");
  await prisma.invitation.deleteMany({ where: { id, acceptedAt: null } });
  revalidateSettings();
  return { ok: true, message: "Invitation annulée." };
}

// Garde-fou : l'espace doit toujours garder au moins un administrateur.
async function hasOtherAdmin(userId: string) {
  return (await prisma.user.count({ where: { role: "ADMIN", id: { not: userId } } })) > 0;
}

export async function updateUserRole(userId: string, role: Role): Promise<ActionState> {
  const admin = await requireUser("manage");
  if (!isRole(role)) return { error: "Rôle invalide." };
  if (userId === admin.id) return { error: "Vous ne pouvez pas modifier votre propre rôle." };
  if (role !== "ADMIN" && !(await hasOtherAdmin(userId))) return { error: "Il doit rester au moins un administrateur." };
  const user = await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidateSettings();
  return { ok: true, message: `${displayName(user)} est maintenant ${ROLE_LABEL[role].toLowerCase()}.` };
}

export async function removeUser(userId: string): Promise<ActionState> {
  const admin = await requireUser("manage");
  if (userId === admin.id) return { error: "Vous ne pouvez pas retirer votre propre compte." };
  if (!(await hasOtherAdmin(userId))) return { error: "Il doit rester au moins un administrateur." };
  const user = await prisma.user.delete({ where: { id: userId } });
  revalidateSettings();
  return { ok: true, message: `${displayName(user)} n’a plus accès à l’admin.` };
}
