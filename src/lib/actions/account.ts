"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { MIN_PASSWORD_LENGTH, type ActionState } from "@/lib/action-state";

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  if (!firstName || !lastName) return { error: "Le prénom et le nom sont obligatoires." };

  await prisma.user.update({ where: { id: user.id }, data: { firstName, lastName } });
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Profil mis à jour." };
}

export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (next.length < MIN_PASSWORD_LENGTH) {
    return { error: `Le nouveau mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.` };
  }
  if (next !== confirm) return { error: "Les deux nouveaux mots de passe ne correspondent pas." };

  const { passwordHash } = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { passwordHash: true } });
  if (!(await bcrypt.compare(current, passwordHash))) return { error: "Le mot de passe actuel est incorrect." };

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 12) } });
  return { ok: true, message: "Mot de passe modifié." };
}
