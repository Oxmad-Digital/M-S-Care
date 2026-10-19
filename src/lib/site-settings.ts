import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { readDatabase } from "@/lib/database-read";

export const SETTINGS_TAG = "settings";

// Lu sur chaque page publique et chaque vue enregistrée : mis en cache, invalidé par
// updateMaintenance, et relu au plus tard après une heure.
const getCachedSettings = unstable_cache(
  async () => {
    const settings = await readDatabase(() => prisma.siteSettings.findUnique({ where: { id: 1 } }));
    return { maintenance: settings?.maintenance ?? false, maintenanceMessage: settings?.maintenanceMessage ?? null };
  },
  ["site-settings"],
  { tags: [SETTINGS_TAG], revalidate: 3600 },
);

export const getSiteSettings = cache(getCachedSettings);
