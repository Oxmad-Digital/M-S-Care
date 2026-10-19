"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";

export async function markMessageRead(id: string, read: boolean) {
  await requireUser("edit");
  await prisma.contactMessage.update({ where: { id }, data: { read } });
  revalidatePath("/admin/messages");
}
