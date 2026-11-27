import { gzipSync } from "node:zlib";
import { HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { getR2ArchiveBucket } from "@/lib/r2";
import { collectionCutoff, drainPageViews } from "@/lib/pending-page-views";

// Cycle de vie des vues de page (minimisation RGPD) :
// 1. Jour J : R2 reçoit la vue et son identifiant pseudonyme (visitorHash).
// 2. Nuit suivante : les vues sont importées en base et consolidées en compteurs
//    anonymes (StatDay, StatDimension), puis visitorHash est effacé.
// 3. Après RAW_RETENTION_DAYS : les vues détaillées, déjà anonymes, partent dans une archive
//    R2 privée et sont supprimées de la base.
export const RAW_RETENTION_DAYS = 90;

// Nombre de journées archivées par exécution, pour rester loin du délai maximal de la fonction.
const MAX_ARCHIVE_DAYS_PER_RUN = 30;

export const DIMENSIONS = ["path", "referrer", "deviceType", "country"] as const;
export type Dimension = (typeof DIMENSIONS)[number];

export function utcDay(offsetDays = 0, now = new Date()) {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

type RawView = {
  path: string;
  referrer: string;
  deviceType: string;
  country: string;
  duration: number | null;
  visitorHash: string;
};

export function buildRollup(rows: RawView[]) {
  const visitors = new Set<string>();
  let durationSum = 0;
  let durationCount = 0;
  const counts = new Map<string, { dimension: Dimension; value: string; views: number }>();

  for (const row of rows) {
    if (row.visitorHash) visitors.add(row.visitorHash);
    if (row.duration != null && row.duration > 0) {
      durationSum += row.duration;
      durationCount += 1;
    }
    for (const dimension of DIMENSIONS) {
      const value = row[dimension];
      const key = `${dimension}\u0000${value}`;
      const entry = counts.get(key);
      if (entry) entry.views += 1;
      else counts.set(key, { dimension, value, views: 1 });
    }
  }

  return {
    views: rows.length,
    visitors: visitors.size,
    durationSum,
    durationCount,
    dimensions: [...counts.values()],
  };
}

// Archive anonyme : ni identifiant visiteur, ni id, ni heure exacte (seulement le jour),
// et lignes triées par contenu pour qu'aucun ordre chronologique ne permette de
// reconstituer le parcours d'une personne.
export function anonymizeForArchive(day: string, rows: Omit<RawView, "visitorHash">[]) {
  return rows
    .map((r) => ({
      day,
      path: r.path,
      referrer: r.referrer,
      deviceType: r.deviceType,
      country: r.country,
      duration: r.duration,
    }))
    .sort((a, b) =>
      [a.path, a.referrer, a.deviceType, a.country].join("|").localeCompare(
        [b.path, b.referrer, b.deviceType, b.country].join("|"),
      ) || (a.duration ?? -1) - (b.duration ?? -1),
    );
}

export function archiveKey(day: string) {
  const [year, month] = day.split("-");
  return `page-views/${year}/${month}/${day}.ndjson.gz`;
}

const RAW_SELECT = {
  path: true,
  referrer: true,
  deviceType: true,
  country: true,
  duration: true,
  visitorHash: true,
} as const;

// Consolide chaque journée close (avant aujourd'hui UTC) pas encore traitée, dans l'ordre.
// Chaque journée est traitée dans une transaction : compteurs créés et visitorHash effacé
// ensemble, ou pas du tout. S'arrête à la première erreur pour ne jamais laisser de trou,
// ce qui garantit que tous les jours jusqu'au dernier StatDay sont consolidés.
async function rollupClosedDays(before: Date) {
  const today = utcDay(0, before);
  const yesterday = utcDay(-1, before);
  const pending = await prisma.$queryRaw<{ day: string }[]>`
    SELECT days."day"
    FROM (
      SELECT pv."day" FROM "PageView" pv WHERE pv."day" < ${today}
      UNION SELECT ${yesterday}::text
    ) days
    WHERE NOT EXISTS (SELECT 1 FROM "StatDay" sd WHERE sd."day" = days."day")
    ORDER BY days."day"
  `;

  const done: string[] = [];
  for (const { day } of pending) {
    const consolidated = await prisma.$transaction(
      async (tx) => {
        const rows = await tx.pageView.findMany({ where: { day }, select: RAW_SELECT });
        const rollup = buildRollup(rows);
        // Une journée vide marque aussi la date jusqu'à laquelle les chiffres sont disponibles.
        const claim = await tx.statDay.createMany({
          data: {
            day,
            views: rollup.views,
            visitors: rollup.visitors,
            durationSum: rollup.durationSum,
            durationCount: rollup.durationCount,
          },
          skipDuplicates: true,
        });
        if (!claim.count) return false;
        if (!rows.length) return true;

        await tx.statDimension.createMany({
          data: rollup.dimensions.map((d) => ({ day, ...d })),
        });
        await tx.pageView.updateMany({ where: { day }, data: { visitorHash: "" } });
        return true;
      },
      { timeout: 30_000 },
    );
    if (consolidated) done.push(day);
  }
  return done;
}

export async function importAndRollupClosedDays(now = new Date()) {
  const cutoff = collectionCutoff(now);
  const imported = await drainPageViews(utcDay(0, cutoff), (views) => prisma.$executeRaw`
    INSERT INTO "PageView" ("id", "day", "path", "referrer", "deviceType", "country", "visitorHash", "createdAt", "duration")
    SELECT v."id", v."day", v."path", v."referrer", v."deviceType", v."country", v."visitorHash", v."createdAt", v."duration"
    FROM jsonb_to_recordset(${JSON.stringify(views)}::jsonb) AS v(
      "id" text, "day" text, "path" text, "referrer" text, "deviceType" text, "country" text,
      "visitorHash" text, "createdAt" timestamp(3), "duration" integer
    )
    WHERE NOT EXISTS (SELECT 1 FROM "StatDay" sd WHERE sd."day" = v."day")
    ON CONFLICT ("id") DO NOTHING
  `);
  const rolledUp = await rollupClosedDays(cutoff);
  return { imported, rolledUp };
}

// Déplace dans R2 les vues détaillées de plus de RAW_RETENTION_DAYS jours (déjà consolidées),
// un fichier par jour, puis les supprime de la base une fois l'envoi vérifié.
// Rejouable sans risque : un fichier réécrit contient exactement les mêmes lignes.
export async function archiveOldDays(now = new Date()) {
  const cutoff = utcDay(-RAW_RETENTION_DAYS, now);
  const days = await prisma.$queryRaw<{ day: string }[]>`
    SELECT DISTINCT pv."day" FROM "PageView" pv
    WHERE pv."day" < ${cutoff}
      AND EXISTS (SELECT 1 FROM "StatDay" sd WHERE sd."day" = pv."day")
    ORDER BY pv."day"
    LIMIT ${MAX_ARCHIVE_DAYS_PER_RUN}
  `;
  if (days.length === 0) return [];

  const { client, bucket } = getR2ArchiveBucket();
  const done: string[] = [];

  for (const { day } of days) {
    const rows = await prisma.pageView.findMany({
      where: { day },
      select: { path: true, referrer: true, deviceType: true, country: true, duration: true },
    });
    if (!rows.length) continue;
    const body = gzipSync(
      anonymizeForArchive(day, rows).map((r) => JSON.stringify(r)).join("\n") + "\n",
    );
    const key = archiveKey(day);

    await client.send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: "application/gzip" }),
    );
    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    if (head.ContentLength !== body.length) {
      throw new Error(`Archive ${key} incomplète : suppression annulée.`);
    }

    await prisma.pageView.deleteMany({ where: { day } });
    done.push(day);
  }
  return done;
}
