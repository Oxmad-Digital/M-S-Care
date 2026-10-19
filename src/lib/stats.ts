import { prisma } from "@/lib/prisma";
import { readDatabase } from "@/lib/database-read";

export const STATS_RANGES = [7, 30, 90] as const;
export type StatsRange = (typeof STATS_RANGES)[number];

export function parseRange(value: unknown): StatsRange {
  const n = Number(value);
  return (STATS_RANGES as readonly number[]).includes(n) ? (n as StatsRange) : 30;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

type Totals = { views: number; visitors: number };

async function totalsBetween(from: string, to: string) {
  const [row] = await prisma.$queryRaw<Totals[]>`
    SELECT COUNT(*)::int AS views, COUNT(DISTINCT "visitorHash")::int AS visitors
    FROM "PageView" WHERE "day" >= ${from} AND "day" <= ${to}
  `;
  return row ?? { views: 0, visitors: 0 };
}

export async function getStats(rangeDays: StatsRange) {
  const today = daysAgo(0);
  const startDay = daysAgo(rangeDays - 1);
  const where = { day: { gte: startDay } };

  const [totals, previous, dailyRaw, pages, referrers, directViews, devices, countries, duration] =
    await readDatabase(() =>
      Promise.all([
        totalsBetween(startDay, today),
        // Période précédente de même durée, pour l'évolution.
        totalsBetween(daysAgo(rangeDays * 2 - 1), daysAgo(rangeDays)),
        prisma.$queryRaw<{ day: string; views: number; visitors: number }[]>`
          SELECT "day", COUNT(*)::int AS views, COUNT(DISTINCT "visitorHash")::int AS visitors
          FROM "PageView" WHERE "day" >= ${startDay}
          GROUP BY "day" ORDER BY "day"
        `,
        prisma.pageView.groupBy({
          by: ["path"],
          where,
          _count: { _all: true },
          orderBy: { _count: { path: "desc" } },
          take: 10,
        }),
        prisma.pageView.groupBy({
          by: ["referrer"],
          where: { ...where, referrer: { not: "" } },
          _count: { _all: true },
          orderBy: { _count: { referrer: "desc" } },
          take: 10,
        }),
        prisma.pageView.count({ where: { ...where, referrer: "" } }),
        prisma.pageView.groupBy({
          by: ["deviceType"],
          where,
          _count: { _all: true },
          orderBy: { _count: { deviceType: "desc" } },
        }),
        prisma.pageView.groupBy({
          by: ["country"],
          where: { ...where, country: { not: "" } },
          _count: { _all: true },
          orderBy: { _count: { country: "desc" } },
        }),
        prisma.pageView.aggregate({
          where: { ...where, duration: { gt: 0 } },
          _avg: { duration: true },
        }),
      ]),
    );

  // Les fiches produits s'affichent par leur nom plutôt que par leur URL.
  const slugs = pages.map((p) => p.path.match(/^\/produits\/(.+)$/)?.[1]).filter((s): s is string => !!s);
  const products = slugs.length
    ? await readDatabase(() =>
        prisma.product.findMany({ where: { slug: { in: slugs } }, select: { slug: true, name: true } }),
      )
    : [];
  const nameBySlug = new Map(products.map((p) => [p.slug, p.name]));

  const dailyByDay = new Map(dailyRaw.map((d) => [d.day, d]));
  const daily = Array.from({ length: rangeDays }, (_, i) => {
    const day = daysAgo(rangeDays - 1 - i);
    return dailyByDay.get(day) ?? { day, views: 0, visitors: 0 };
  });

  return {
    totalViews: totals.views,
    totalVisitors: totals.visitors,
    previousViews: previous.views,
    previousVisitors: previous.visitors,
    daily,
    topPages: pages.map((p) => {
      const slug = p.path.match(/^\/produits\/(.+)$/)?.[1];
      const label = p.path === "/" ? "Accueil" : slug ? (nameBySlug.get(slug) ?? p.path) : p.path;
      return { label, path: p.path, views: p._count._all };
    }),
    topReferrers: referrers.map((r) => ({ referrer: r.referrer, views: r._count._all })),
    directViews,
    deviceTypes: devices.map((d) => ({ deviceType: d.deviceType, views: d._count._all })),
    topCountries: countries.map((c) => ({ country: c.country, views: c._count._all })),
    avgDurationMs: duration._avg.duration,
  };
}

export type Stats = Awaited<ReturnType<typeof getStats>>;
