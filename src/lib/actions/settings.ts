"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { SETTINGS_TAG } from "@/lib/site-settings";
import { requireUser } from "@/lib/current-user";
import type { ActionState } from "@/lib/action-state";

export async function updateMaintenance(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser("manage");
  const maintenance = formData.get("maintenance") === "on";
  const maintenanceMessage = String(formData.get("maintenanceMessage") ?? "").trim() || null;

  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: { maintenance, maintenanceMessage },
    create: { id: 1, maintenance, maintenanceMessage },
  });

  // expire: 0 — l'écran de maintenance s'applique dès la visite suivante.
  revalidateTag(SETTINGS_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: maintenance ? "Le site affiche maintenant l’écran de maintenance." : "Le site est de nouveau accessible.",
  };
}
