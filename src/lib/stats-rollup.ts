import { gzipSync } from "node:zlib";
import { HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { getR2ArchiveBucket } from "@/lib/r2";

// Cycle de vie des vues de page (minimisation RGPD) :
// 1. Jour J : la vue est enregistrée avec un identifiant visiteur pseudonyme (visitorHash).
// 2. Nuit suivante : la journée est consolidée en compteurs anonymes (StatDay, StatDimension),
//    puis visitorHash est effacé. Plus aucune donnée personnelle ne reste en base.
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
export async function rollupClosedDays(now = new Date()) {
  const today = utcDay(0, now);
  const pending = await prisma.$queryRaw<{ day: string }[]>`
    SELECT DISTINCT pv."day" FROM "PageView" pv
    WHERE pv."day" < ${today}
      AND NOT EXISTS (SELECT 1 FROM "StatDay" sd WHERE sd."day" = pv."day")
    ORDER BY pv."day"
  `;

  const done: string[] = [];
  for (const { day } of pending) {
    await prisma.$transaction(
      async (tx) => {
        const rows = await tx.pageView.findMany({ where: { day }, select: RAW_SELECT });
        const rollup = buildRollup(rows);
        await tx.statDay.create({
          data: {
            day,
            views: rollup.views,
            visitors: rollup.visitors,
            durationSum: rollup.durationSum,
            durationCount: rollup.durationCount,
          },
        });
        await tx.statDimension.createMany({
          data: rollup.dimensions.map((d) => ({ day, ...d })),
        });
        await tx.pageView.updateMany({ where: { day }, data: { visitorHash: "" } });
      },
      { timeout: 30_000 },
    );
    done.push(day);
  }
  return done;
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
