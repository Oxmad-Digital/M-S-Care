"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";

export async function markMessageRead(id: string, read: boolean) {
  await requireUser("edit");
  await prisma.contactMessage.update({ where: { id }, data: { read } });
  revalidatePath("/admin", "layout");
}

// Suppression définitive (spam, doublons) : réservée aux rôles autorisés à supprimer.
export async function deleteMessage(id: string) {
  await requireUser("delete");
  await prisma.contactMessage.deleteMany({ where: { id } });
  revalidatePath("/admin", "layout");
}
