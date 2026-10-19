import Link from "next/link";
import { countryLabel } from "@/lib/country-label";
import { STATS_RANGES, type Stats, type StatsRange } from "@/lib/stats";
import { DailyTrafficChart } from "./DailyTrafficChart";
import { MagnitudeBarList } from "./MagnitudeBarList";
import { StatsWorldMap } from "./StatsWorldMap";

const DEVICE_LABELS: Record<string, string> = {
  desktop: "Ordinateur",
  mobile: "Mobile",
  tablet: "Tablette",
  console: "Console",
  smarttv: "TV connectée",
  wearable: "Montre connectée",
  embedded: "Autre",
};

function formatDuration(ms: number | null) {
  if (ms == null) return "—";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes} min ${seconds.toString().padStart(2, "0")}` : `${seconds} s`;
}

function Delta({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const change = Math.round(((current - previous) / previous) * 100);
  const tone = change > 0 ? "text-emerald-700" : change < 0 ? "text-red-700" : "text-ms-text-muted";
  const arrow = change > 0 ? "↑" : change < 0 ? "↓" : "→";
  return (
    <p className={`mt-1 text-[12px] font-medium ${tone}`}>
      {arrow} {change > 0 ? "+" : ""}
      {change} % vs période précédente
    </p>
  );
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-ms-border bg-white p-5 sm:p-6 ${className}`}>
      <h2 className="mb-4 text-[15px] font-bold text-ms-primary">{title}</h2>
      {children}
    </section>
  );
}

function Kpi({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-ms-border bg-white px-5 py-4">
      <p className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-ms-text-muted uppercase">{label}</p>
      <p className="text-[28px] font-extrabold text-ms-ink tabular-nums">{value}</p>
      {children}
    </div>
  );
}

export function StatsView({ stats, rangeDays }: { stats: Stats; rangeDays: StatsRange }) {
  const avgPerDay = Math.round(stats.totalViews / rangeDays);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ms-primary">Statistiques</h1>
          <p className="mt-1 text-[13px] text-ms-text-muted">
            Fréquentation du site public, sans cookie. Les visites de l’équipe connectée ne sont pas comptées.
          </p>
        </div>
        <nav className="flex rounded-full border border-ms-border bg-white p-1" aria-label="Période">
          {STATS_RANGES.map((range) => (
            <Link
              key={range}
              href={`/admin/stats?periode=${range}`}
              aria-current={range === rangeDays ? "page" : undefined}
              className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition ${
                range === rangeDays ? "bg-ms-accent text-white" : "text-ms-text hover:text-ms-primary"
              }`}
            >
              {range} jours
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Vues" value={stats.totalViews.toLocaleString("fr-FR")}>
          <Delta current={stats.totalViews} previous={stats.previousViews} />
        </Kpi>
        <Kpi label="Visiteurs uniques" value={stats.totalVisitors.toLocaleString("fr-FR")}>
          <Delta current={stats.totalVisitors} previous={stats.previousVisitors} />
        </Kpi>
        <Kpi label="Moyenne / jour" value={avgPerDay.toLocaleString("fr-FR")} />
        <Kpi label="Durée moyenne / page" value={formatDuration(stats.avgDurationMs)} />
      </div>

      <Card title="Trafic quotidien">
        <DailyTrafficChart daily={stats.daily} />
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-[1.2fr_0.9fr_0.7fr]">
        <Card title="Pages les plus vues">
          <MagnitudeBarList items={stats.topPages.map((p) => ({ label: p.label, hint: p.path, value: p.views }))} />
        </Card>
        <Card title="Provenance">
          <MagnitudeBarList
            items={[
              ...(stats.directViews > 0 ? [{ label: "Accès direct", value: stats.directViews }] : []),
              ...stats.topReferrers.map((r) => ({ label: r.referrer, value: r.views })),
            ]}
          />
        </Card>
        <Card title="Appareils">
          <MagnitudeBarList
            items={stats.deviceTypes.map((d) => ({
              label: DEVICE_LABELS[d.deviceType] ?? d.deviceType,
              value: d.views,
            }))}
          />
        </Card>
      </div>

      <Card title="Origine géographique">
        <div className="grid grid-cols-1 items-center gap-7 lg:grid-cols-[280px_1fr]">
          <MagnitudeBarList
            items={stats.topCountries.slice(0, 10).map((c) => ({ label: countryLabel(c.country), value: c.views }))}
          />
          <StatsWorldMap countries={stats.topCountries} />
        </div>
      </Card>
    </div>
  );
}
