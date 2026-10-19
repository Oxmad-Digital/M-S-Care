import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { readDatabase } from "@/lib/database-read";

export const getSiteSettings = cache(async () => {
  const settings = await readDatabase(() => prisma.siteSettings.findUnique({ where: { id: 1 } }));
  return { maintenance: settings?.maintenance ?? false, maintenanceMessage: settings?.maintenanceMessage ?? null };
});
