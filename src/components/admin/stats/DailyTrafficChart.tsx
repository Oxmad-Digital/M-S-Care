"use client";

import { useMemo, useRef, useState } from "react";

export type DailyPoint = { day: string; views: number; visitors: number };

const WIDTH = 760;
const HEIGHT = 260;
const MARGIN = { top: 16, right: 44, bottom: 30, left: 44 };
const PLOT_WIDTH = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;

// Paire validée (séparation daltonisme et contraste sur fond blanc).
const VIEWS_COLOR = "#0f9a83";
const VISITORS_COLOR = "#c47a14";
const TRAFFIC_SERIES = [
  { key: "views", color: VIEWS_COLOR, label: "Vues", tooltipLabel: "vues" },
  { key: "visitors", color: VISITORS_COLOR, label: "Visiteurs uniques", tooltipLabel: "visiteurs" },
] as const;

const CHART_MODES = [
  { key: "line", label: "Courbes" },
  { key: "bar", label: "Barres" },
] as const;
type ChartMode = (typeof CHART_MODES)[number]["key"];

// Pas entier d'au moins 1 : des comptes n'ont pas de graduations décimales,
// et chaque graduation reste unique (elle sert de clé).
function niceStep(max: number) {
  const rawStep = max / 4;
  if (rawStep <= 1) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const niceNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return niceNorm * mag;
}

// Jours stockés en UTC : formatés en UTC pour que serveur et navigateur affichent la même date.
function formatDate(day: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("fr-FR", { ...opts, timeZone: "UTC" });
}

export function DailyTrafficChart({
  daily,
  granularity = "day",
}: {
  daily: DailyPoint[];
  granularity?: "day" | "week";
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<ChartMode>("line");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number; wrapWidth: number } | null>(null);

  const n = daily.length;
  const showBars = mode === "bar";
  const bucketWidth = PLOT_WIDTH / Math.max(1, n);
  const barGap = Math.min(4, bucketWidth * 0.1);
  const barWidth = Math.min(24, (bucketWidth * 0.8 - barGap) / 2);

  const { xAt, yAt, viewsPath, visitorsPath, ticks, labelIndices } = useMemo(() => {
    const dataMax = Math.max(1, ...daily.map((d) => Math.max(d.views, d.visitors)));
    const step = niceStep(dataMax);
    const tickCount = Math.max(1, Math.ceil(dataMax / step));
    const max = tickCount * step;

    const xAt = (i: number) => {
      if (showBars) return MARGIN.left + (i + 0.5) * bucketWidth;
      return n <= 1 ? MARGIN.left + PLOT_WIDTH / 2 : MARGIN.left + (i / (n - 1)) * PLOT_WIDTH;
    };
    const yAt = (v: number) => MARGIN.top + PLOT_HEIGHT - (v / max) * PLOT_HEIGHT;

    const toPath = (key: "views" | "visitors") =>
      daily.map((d, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(d[key]).toFixed(1)}`).join(" ");

    const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i * step);
    const labelStep = Math.max(1, Math.ceil(n / 6));
    const labelIndices = daily.map((_, i) => i).filter((i) => i % labelStep === 0 || i === n - 1);

    return { xAt, yAt, viewsPath: toPath("views"), visitorsPath: toPath("visitors"), ticks, labelIndices };
  }, [daily, n, showBars, bucketWidth]);

  if (n === 0) {
    return <p className="text-[13.5px] text-ms-text-muted">Aucune donnée pour le moment.</p>;
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const ratio = (relX - MARGIN.left) / PLOT_WIDTH;
    const index = showBars ? Math.floor(ratio * n) : Math.round(ratio * (n - 1));
    setHoverIndex(Math.min(n - 1, Math.max(0, index)));
    setPointer({ x: e.clientX - rect.left, y: e.clientY - rect.top, wrapWidth: rect.width });
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
    setPointer(null);
  };

  const hovered = hoverIndex !== null ? daily[hoverIndex] : null;
  const last = daily[n - 1];
  const lastViewsY = yAt(last.views);
  const lastVisitorsY = yAt(last.visitors);
  const endLabelsCollide = Math.abs(lastViewsY - lastVisitorsY) < 16;
  const flipTooltip = pointer ? pointer.x / pointer.wrapWidth > 0.65 : false;
  const baseline = yAt(0);

  return (
    <div>
      <div role="group" aria-label="Type de graphique" className="mb-3 flex w-fit rounded-lg border border-ms-border p-1">
        {CHART_MODES.map((option) => (
          <button
            key={option.key}
            type="button"
            aria-pressed={mode === option.key}
            onClick={() => {
              if (mode === option.key) return;
              setMode(option.key);
              handlePointerLeave();
            }}
            className="rounded-md px-3 py-1.5 text-[13px] font-semibold text-ms-text transition hover:text-ms-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ms-primary aria-pressed:bg-ms-accent aria-pressed:text-white"
          >
            {option.label}
          </button>
        ))}
      </div>

      <div
        ref={wrapRef}
        className="relative touch-pan-y"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        aria-hidden
      >
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block h-auto w-full overflow-visible">
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={MARGIN.left}
                x2={WIDTH - MARGIN.right}
                y1={yAt(t)}
                y2={yAt(t)}
                stroke="rgba(23, 52, 46, 0.08)"
              />
              <text
                x={MARGIN.left - 8}
                y={yAt(t)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-ms-text-muted text-[11px] tabular-nums"
              >
                {t.toLocaleString("fr-FR")}
              </text>
            </g>
          ))}

          {labelIndices.map((i) => (
            <text
              key={daily[i].day}
              x={xAt(i)}
              y={HEIGHT - MARGIN.bottom + 18}
              textAnchor="middle"
              className="fill-ms-text-muted text-[11px] tabular-nums"
            >
              {formatDate(daily[i].day, { day: "2-digit", month: "2-digit" })}
            </text>
          ))}

          {hovered && hoverIndex !== null && (
            <line
              x1={xAt(hoverIndex)}
              x2={xAt(hoverIndex)}
              y1={MARGIN.top}
              y2={HEIGHT - MARGIN.bottom}
              stroke="rgba(23, 52, 46, 0.25)"
              strokeDasharray="3 3"
            />
          )}

          {showBars ? (
            daily.map((day, i) => (
              <g key={day.day} transform={`translate(${xAt(i) - barWidth - barGap / 2} 0)`}>
                {TRAFFIC_SERIES.map(({ key, color }, seriesIndex) => (
                  <rect
                    key={key}
                    x={seriesIndex * (barWidth + barGap)}
                    y={yAt(day[key])}
                    width={barWidth}
                    height={baseline - yAt(day[key])}
                    fill={color}
                  />
                ))}
              </g>
            ))
          ) : (
            <>
              <path d={visitorsPath} fill="none" stroke={VISITORS_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              <path d={viewsPath} fill="none" stroke={VIEWS_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

              <circle cx={xAt(n - 1)} cy={lastVisitorsY} r={4} fill={VISITORS_COLOR} stroke="#fff" strokeWidth={2} />
              <circle cx={xAt(n - 1)} cy={lastViewsY} r={4} fill={VIEWS_COLOR} stroke="#fff" strokeWidth={2} />

              {!endLabelsCollide && (
                <>
                  <text x={xAt(n - 1) + 8} y={lastViewsY} dominantBaseline="middle" className="fill-ms-ink text-[11px] font-semibold tabular-nums">
                    {last.views.toLocaleString("fr-FR")}
                  </text>
                  <text x={xAt(n - 1) + 8} y={lastVisitorsY} dominantBaseline="middle" className="fill-ms-ink text-[11px] font-semibold tabular-nums">
                    {last.visitors.toLocaleString("fr-FR")}
                  </text>
                </>
              )}

              {hovered && hoverIndex !== null && (
                <>
                  <circle cx={xAt(hoverIndex)} cy={yAt(hovered.views)} r={4} fill={VIEWS_COLOR} stroke="#fff" strokeWidth={2} />
                  <circle cx={xAt(hoverIndex)} cy={yAt(hovered.visitors)} r={4} fill={VISITORS_COLOR} stroke="#fff" strokeWidth={2} />
                </>
              )}
            </>
          )}
        </svg>

        {hovered && pointer && (
          <div
            className="pointer-events-none absolute z-10 min-w-[140px] rounded-lg bg-ms-primary-dark px-3 py-2 text-white shadow-lg"
            style={{
              left: flipTooltip ? undefined : pointer.x + 12,
              right: flipTooltip ? pointer.wrapWidth - pointer.x + 12 : undefined,
              top: Math.max(0, pointer.y - 44),
            }}
          >
            <div className="mb-1 text-[11px] text-white/70">
              {granularity === "week"
                ? `Semaine du ${formatDate(hovered.day, { day: "2-digit", month: "long", year: "numeric" })}`
                : formatDate(hovered.day, { weekday: "short", day: "2-digit", month: "long" })}
            </div>
            {TRAFFIC_SERIES.map(({ key, color, tooltipLabel }) => (
              <div key={key} className="flex items-center gap-2 text-[13px]">
                <span className="size-2.5 rounded-sm" style={{ background: color }} />
                <span className="font-bold tabular-nums">{hovered[key].toLocaleString("fr-FR")}</span>
                <span className="text-white/70">{tooltipLabel}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-5 text-[12.5px] text-ms-text">
        {TRAFFIC_SERIES.map(({ key, color, label }) => (
          <span key={key} className="flex items-center gap-2">
            <span className={showBars ? "size-2.5 rounded-sm" : "h-0.5 w-4 rounded"} style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>

      <table className="sr-only">
        <caption>{granularity === "week" ? "Trafic hebdomadaire" : "Trafic quotidien"}</caption>
        <thead>
          <tr>
            <th>{granularity === "week" ? "Semaine du" : "Jour"}</th>
            <th>Vues</th>
            <th>Visiteurs uniques</th>
          </tr>
        </thead>
        <tbody>
          {daily.map((d) => (
            <tr key={d.day}>
              <td>{formatDate(d.day, { day: "2-digit", month: "long", year: granularity === "week" ? "numeric" : undefined })}</td>
              <td>{d.views}</td>
              <td>{d.visitors}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
