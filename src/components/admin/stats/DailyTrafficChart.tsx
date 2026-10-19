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

export function DailyTrafficChart({ daily }: { daily: DailyPoint[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number; wrapWidth: number } | null>(null);

  const n = daily.length;

  const { xAt, yAt, viewsPath, visitorsPath, ticks, labelIndices } = useMemo(() => {
    const dataMax = Math.max(1, ...daily.map((d) => Math.max(d.views, d.visitors)));
    const step = niceStep(dataMax);
    const tickCount = Math.max(1, Math.ceil(dataMax / step));
    const max = tickCount * step;

    const xAt = (i: number) => (n <= 1 ? MARGIN.left + PLOT_WIDTH / 2 : MARGIN.left + (i / (n - 1)) * PLOT_WIDTH);
    const yAt = (v: number) => MARGIN.top + PLOT_HEIGHT - (v / max) * PLOT_HEIGHT;

    const toPath = (key: "views" | "visitors") =>
      daily.map((d, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(d[key]).toFixed(1)}`).join(" ");

    const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i * step);
    const labelStep = Math.max(1, Math.ceil(n / 6));
    const labelIndices = daily.map((_, i) => i).filter((i) => i % labelStep === 0 || i === n - 1);

    return { xAt, yAt, viewsPath: toPath("views"), visitorsPath: toPath("visitors"), ticks, labelIndices };
  }, [daily, n]);

  if (n === 0) {
    return <p className="text-[13.5px] text-ms-text-muted">Aucune donnée pour le moment.</p>;
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const ratio = (relX - MARGIN.left) / PLOT_WIDTH;
    setHoverIndex(Math.min(n - 1, Math.max(0, Math.round(ratio * (n - 1)))));
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

  return (
    <div>
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

          {hoverIndex !== null && (
            <line
              x1={xAt(hoverIndex)}
              x2={xAt(hoverIndex)}
              y1={MARGIN.top}
              y2={HEIGHT - MARGIN.bottom}
              stroke="rgba(23, 52, 46, 0.25)"
              strokeDasharray="3 3"
            />
          )}

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
              {formatDate(hovered.day, { weekday: "short", day: "2-digit", month: "long" })}
            </div>
            {[
              { color: VIEWS_COLOR, value: hovered.views, label: "vues" },
              { color: VISITORS_COLOR, value: hovered.visitors, label: "visiteurs" },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-2 text-[13px]">
                <span className="size-2.5 rounded-sm" style={{ background: row.color }} />
                <span className="font-bold tabular-nums">{row.value.toLocaleString("fr-FR")}</span>
                <span className="text-white/70">{row.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-5 text-[12.5px] text-ms-text">
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-4 rounded" style={{ background: VIEWS_COLOR }} />
          Vues
        </span>
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-4 rounded" style={{ background: VISITORS_COLOR }} />
          Visiteurs uniques
        </span>
      </div>

      <table className="sr-only">
        <caption>Trafic quotidien</caption>
        <thead>
          <tr>
            <th>Jour</th>
            <th>Vues</th>
            <th>Visiteurs uniques</th>
          </tr>
        </thead>
        <tbody>
          {daily.map((d) => (
            <tr key={d.day}>
              <td>{formatDate(d.day, { day: "2-digit", month: "long" })}</td>
              <td>{d.views}</td>
              <td>{d.visitors}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
