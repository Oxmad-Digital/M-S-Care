"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findValidInvitation } from "@/lib/invitations";
import { MIN_PASSWORD_LENGTH, type ActionState } from "@/lib/action-state";

export async function acceptInvitation(token: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const invitation = await findValidInvitation(token);
  if (!invitation) return { error: "Cette invitation n’est plus valide. Demandez-en une nouvelle." };

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");
  if (!firstName || !lastName) return { error: "Le prénom et le nom sont obligatoires." };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.` };
  }
  if (password !== confirm) return { error: "Les deux mots de passe ne correspondent pas." };
  if (await prisma.user.findFirst({ where: { email: { equals: invitation.email, mode: "insensitive" } } })) {
    return { error: "Un compte existe déjà pour cette adresse. Connectez-vous." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.create({ data: { email: invitation.email, firstName, lastName, role: invitation.role, passwordHash } }),
    prisma.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } }),
  ]);

  try {
    await signIn("credentials", { email: invitation.email, password, redirectTo: "/admin/produits" });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Compte créé, mais la connexion a échoué. Connectez-vous." };
    throw error;
  }
  return {};
}
