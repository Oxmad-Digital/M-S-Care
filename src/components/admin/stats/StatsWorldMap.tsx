"use client";

import { useEffect, useRef } from "react";
import { countryLabel } from "@/lib/country-label";

type CountryPoint = { country: string; views: number };

const EMPTY_FILL = "#e3eee8";
const TOOLTIP_CLASS =
  "pointer-events-none absolute z-10 flex min-w-[110px] -translate-x-1/2 -translate-y-[calc(100%+10px)] flex-col gap-0.5 rounded-lg bg-ms-primary-dark px-3 py-2 text-white opacity-0 shadow-lg transition-opacity";

export function StatsWorldMap({ countries }: { countries: CountryPoint[] }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || countries.length === 0) return;

    let cancelled = false;

    (async () => {
      let svgText: string;
      try {
        const res = await fetch("/world-map.min.svg");
        svgText = await res.text();
      } catch {
        return;
      }
      if (cancelled) return;

      host.innerHTML = svgText;
      const svg = host.querySelector("svg");
      if (!svg) return;

      svg.removeAttribute("width");
      svg.removeAttribute("height");
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svg.style.width = "100%";
      svg.style.height = "auto";
      svg.style.display = "block";

      const byCountry = new Map(countries.map((c) => [c.country.toLowerCase(), c.views]));
      const max = Math.max(1, ...countries.map((c) => c.views));

      const tooltip = document.createElement("div");
      tooltip.className = TOOLTIP_CLASS;
      host.appendChild(tooltip);

      svg.querySelectorAll<SVGElement>("path[id], g[id]").forEach((el) => {
        const views = byCountry.get(el.id);
        const paths =
          el.tagName.toLowerCase() === "g"
            ? Array.from(el.querySelectorAll<SVGPathElement>("path"))
            : [el as unknown as SVGPathElement];

        paths.forEach((p) => {
          p.style.stroke = "rgba(23, 52, 46, 0.18)";
          p.style.strokeWidth = "0.35";
          p.style.fill = EMPTY_FILL;
        });
        if (!views) return;

        // Une seule teinte, de clair à foncé selon le volume.
        const intensity = 0.28 + 0.72 * Math.sqrt(views / max);
        paths.forEach((p) => {
          p.style.fill = `rgba(15, 154, 131, ${intensity.toFixed(2)})`;
          p.style.cursor = "pointer";
        });

        const show = (e: PointerEvent) => {
          const rect = host.getBoundingClientRect();
          tooltip.replaceChildren();
          const label = document.createElement("span");
          label.className = "text-[11px] text-white/70";
          label.textContent = countryLabel(el.id.toUpperCase());
          const value = document.createElement("span");
          value.className = "text-[14px] font-bold tabular-nums";
          value.textContent = `${views.toLocaleString("fr-FR")} vues`;
          tooltip.append(label, value);
          tooltip.style.left = `${e.clientX - rect.left}px`;
          tooltip.style.top = `${e.clientY - rect.top}px`;
          tooltip.style.opacity = "1";
          paths.forEach((p) => {
            p.style.filter = "brightness(0.9)";
          });
        };
        const hide = () => {
          tooltip.style.opacity = "0";
          paths.forEach((p) => {
            p.style.filter = "";
          });
        };
        el.addEventListener("pointerenter", show);
        el.addEventListener("pointermove", show);
        el.addEventListener("pointerleave", hide);
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [countries]);

  if (countries.length === 0) {
    return <p className="text-[13.5px] text-ms-text-muted">Aucune donnée pour le moment.</p>;
  }

  return <div ref={hostRef} className="relative min-h-[180px] w-full" />;
}
