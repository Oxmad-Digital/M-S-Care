"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function sendDuration(id: string, token: string, duration: number) {
  const payload = JSON.stringify({ id, token, duration });
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/track/duration", new Blob([payload], { type: "application/json" }));
  } else {
    fetch("/api/track/duration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }
}

// Enregistre chaque page publique vue, puis le temps passé dessus quand on la quitte.
export function Tracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    const startedAt = Date.now();
    let view: { id: string; token: string } | null = null;
    let sent = false;

    const finalize = () => {
      if (sent || !view) return;
      sent = true;
      sendDuration(view.id, view.token, Date.now() - startedAt);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") finalize();
    };

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, referrer: document.referrer }),
      keepalive: true,
    })
      .then((res) => res.json())
      .then((data: { id?: unknown; token?: unknown }) => {
        if (typeof data.id === "string" && typeof data.token === "string") {
          view = { id: data.id, token: data.token };
        }
      })
      .catch(() => {});

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", finalize);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", finalize);
      finalize();
    };
  }, [pathname]);

  return null;
}
