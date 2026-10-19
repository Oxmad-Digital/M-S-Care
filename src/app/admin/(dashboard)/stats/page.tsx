import { requireUser } from "@/lib/current-user";
import { getStats, parseRange } from "@/lib/stats";
import { StatsView } from "@/components/admin/stats/StatsView";

export const dynamic = "force-dynamic";

export default async function AdminStatsPage({ searchParams }: PageProps<"/admin/stats">) {
  await requireUser();
  const { periode } = await searchParams;
  const rangeDays = parseRange(periode);
  const stats = await getStats(rangeDays);

  return <StatsView stats={stats} rangeDays={rangeDays} />;
}
