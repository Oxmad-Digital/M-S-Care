import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { readDatabase } from "@/lib/database-read";
import { utcDay, type Dimension } from "@/lib/stats-rollup";

export const STATS_RANGES = [7, 30, 90, 365] as const;
export type StatsRange = (typeof STATS_RANGES)[number];

export function parseRange(value: unknown): StatsRange {
  const n = Number(value);
  return (STATS_RANGES as readonly number[]).includes(n) ? (n as StatsRange) : 30;
}

const daysAgo = (n: number) => utcDay(-n);

// Les journées consolidées se lisent dans StatDay / StatDimension ; les suivantes
// (aujourd'hui, et hier tant que la tâche de nuit n'est pas passée) dans PageView.
// `after` vaut le dernier jour consolidé : "" (avant toute date) si aucun.
type Window = { from: string; to: string; after: string };

type Totals = { views: number; visitors: number; durationSum: number; durationCount: number };

async function totals({ from, to, after }: Window): Promise<Totals> {
  const [agg, [raw]] = await Promise.all([
    prisma.statDay.aggregate({
      where: { day: { gte: from, lte: to } },
      _sum: { views: true, visitors: true, durationSum: true, durationCount: true },
    }),
    // Le hash change chaque jour : visiteurs distincts par jour, comme dans StatDay.
    prisma.$queryRaw<Totals[]>`
      SELECT COUNT(*)::int AS views,
             COUNT(DISTINCT ("day", "visitorHash"))::int AS visitors,
             COALESCE(SUM("duration") FILTER (WHERE "duration" > 0), 0)::float8 AS "durationSum",
             COUNT(*) FILTER (WHERE "duration" > 0)::int AS "durationCount"
      FROM "PageView" WHERE "day" >= ${from} AND "day" <= ${to} AND "day" > ${after}
    `,
  ]);
  return {
    views: (agg._sum.views ?? 0) + (raw?.views ?? 0),
    visitors: (agg._sum.visitors ?? 0) + (raw?.visitors ?? 0),
    durationSum: (agg._sum.durationSum ?? 0) + (raw?.durationSum ?? 0),
    durationCount: (agg._sum.durationCount ?? 0) + (raw?.durationCount ?? 0),
  };
}

async function daily({ from, to, after }: Window) {
  const [agg, raw] = await Promise.all([
    prisma.statDay.findMany({
      where: { day: { gte: from, lte: to } },
      select: { day: true, views: true, visitors: true },
    }),
    prisma.$queryRaw<{ day: string; views: number; visitors: number }[]>`
      SELECT "day", COUNT(*)::int AS views, COUNT(DISTINCT "visitorHash")::int AS visitors
      FROM "PageView" WHERE "day" >= ${from} AND "day" <= ${to} AND "day" > ${after}
      GROUP BY "day"
    `,
  ]);
  return [...agg, ...raw];
}

// Colonnes autorisées : le nom de colonne est injecté tel quel dans la requête.
const RAW_COLUMNS: Record<Dimension, Prisma.Sql> = {
  path: Prisma.raw('"path"'),
  referrer: Prisma.raw('"referrer"'),
  deviceType: Prisma.raw('"deviceType"'),
  country: Prisma.raw('"country"'),
};

async function dimension(dim: Dimension, { from, to, after }: Window) {
  const column = RAW_COLUMNS[dim];
  const [agg, raw] = await Promise.all([
    prisma.statDimension.groupBy({
      by: ["value"],
      where: { dimension: dim, day: { gte: from, lte: to } },
      _sum: { views: true },
    }),
    prisma.$queryRaw<{ value: string; views: number }[]>`
      SELECT ${column} AS value, COUNT(*)::int AS views
      FROM "PageView" WHERE "day" >= ${from} AND "day" <= ${to} AND "day" > ${after}
      GROUP BY ${column}
    `,
  ]);
  const counts = new Map<string, number>();
  for (const a of agg) counts.set(a.value, (counts.get(a.value) ?? 0) + (a._sum.views ?? 0));
  for (const r of raw) counts.set(r.value, (counts.get(r.value) ?? 0) + r.views);
  return [...counts]
    .map(([value, views]) => ({ value, views }))
    .sort((a, b) => b.views - a.views || a.value.localeCompare(b.value));
}

export type TrafficPoint = { day: string; views: number; visitors: number };

// Lundi de la semaine UTC du jour donné.
function weekStart(day: string) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

export function groupByWeek(points: TrafficPoint[]): TrafficPoint[] {
  const weeks = new Map<string, TrafficPoint>();
  for (const p of points) {
    const key = weekStart(p.day);
    const w = weeks.get(key) ?? { day: key, views: 0, visitors: 0 };
    w.views += p.views;
    w.visitors += p.visitors;
    weeks.set(key, w);
  }
  return [...weeks.values()];
}

export async function getStats(rangeDays: StatsRange) {
  const today = daysAgo(0);
  const startDay = daysAgo(rangeDays - 1);

  const lastRolled = await readDatabase(() => prisma.statDay.aggregate({ _max: { day: true } }));
  const after = lastRolled._max.day ?? "";
  const current: Window = { from: startDay, to: today, after };
  // Période précédente de même durée, pour l'évolution.
  const previousWindow: Window = { from: daysAgo(rangeDays * 2 - 1), to: daysAgo(rangeDays), after };

  const [now, previous, dailyRaw, pages, referrers, devices, countries] = await readDatabase(() =>
    Promise.all([
      totals(current),
      totals(previousWindow),
      daily(current),
      dimension("path", current),
      dimension("referrer", current),
      dimension("deviceType", current),
      dimension("country", current),
    ]),
  );

  const topPages = pages.slice(0, 10);
  // Les fiches produits s'affichent par leur nom plutôt que par leur URL.
  const slugs = topPages.map((p) => p.value.match(/^\/produits\/(.+)$/)?.[1]).filter((s): s is string => !!s);
  const products = slugs.length
    ? await readDatabase(() =>
        prisma.product.findMany({ where: { slug: { in: slugs } }, select: { slug: true, name: true } }),
      )
    : [];
  const nameBySlug = new Map(products.map((p) => [p.slug, p.name]));

  const dailyByDay = new Map(dailyRaw.map((d) => [d.day, d]));
  const dailySeries = Array.from({ length: rangeDays }, (_, i) => {
    const day = daysAgo(rangeDays - 1 - i);
    return dailyByDay.get(day) ?? { day, views: 0, visitors: 0 };
  });
  // Sur un an, 365 points deviennent illisibles : le graphique passe à la semaine.
  const granularity: "day" | "week" = rangeDays > 90 ? "week" : "day";

  return {
    totalViews: now.views,
    totalVisitors: now.visitors,
    previousViews: previous.views,
    previousVisitors: previous.visitors,
    granularity,
    traffic: granularity === "week" ? groupByWeek(dailySeries) : dailySeries,
    topPages: topPages.map((p) => {
      const slug = p.value.match(/^\/produits\/(.+)$/)?.[1];
      const label = p.value === "/" ? "Accueil" : slug ? (nameBySlug.get(slug) ?? p.value) : p.value;
      return { label, path: p.value, views: p.views };
    }),
    topReferrers: referrers
      .filter((r) => r.value !== "")
      .slice(0, 10)
      .map((r) => ({ referrer: r.value, views: r.views })),
    directViews: referrers.find((r) => r.value === "")?.views ?? 0,
    deviceTypes: devices.map((d) => ({ deviceType: d.value, views: d.views })),
    topCountries: countries.filter((c) => c.value !== "").map((c) => ({ country: c.value, views: c.views })),
    avgDurationMs: now.durationCount > 0 ? now.durationSum / now.durationCount : null,
  };
}

export type Stats = Awaited<ReturnType<typeof getStats>>;
