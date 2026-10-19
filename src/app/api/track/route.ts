import { NextResponse, userAgent } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-settings";
import {
  getClientIp,
  isSameOrigin,
  isTrackablePath,
  memoryRateLimit,
  signViewId,
  visitorHash,
} from "@/lib/tracking";

export async function POST(request: NextRequest) {
  const { isBot, device } = userAgent(request);
  if (isBot) return NextResponse.json({ ok: true });

  let body: { path?: unknown; referrer?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const path = typeof body.path === "string" ? body.path.slice(0, 300) : "";
  if (!path.startsWith("/")) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  // Chemins inconnus (admin, 404, valeurs forgées) : ignorés sans erreur.
  if (!isTrackablePath(path)) return NextResponse.json({ ok: true });

  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Origine refusée" }, { status: 403 });
  }

  const ip = getClientIp(request);
  if (!memoryRateLimit("track", ip)) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  // Les visites de l'équipe connectée ne faussent pas les statistiques.
  if (await auth()) return NextResponse.json({ ok: true });
  // En maintenance, les visiteurs ne voient que l'écran d'attente : rien à mesurer.
  if ((await getSiteSettings()).maintenance) return NextResponse.json({ ok: true });

  const host = request.headers.get("host");
  let referrer = "";
  if (typeof body.referrer === "string" && body.referrer) {
    try {
      const refUrl = new URL(body.referrer);
      if (refUrl.host !== host) referrer = refUrl.host.slice(0, 200);
    } catch {
      referrer = "";
    }
  }

  const day = new Date().toISOString().slice(0, 10);
  const view = await prisma.pageView.create({
    data: {
      day,
      path,
      referrer,
      deviceType: device.type ?? "desktop",
      country: request.headers.get("x-vercel-ip-country") ?? "",
      visitorHash: visitorHash(ip, request.headers.get("user-agent") ?? "", day),
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: view.id, token: signViewId(view.id) });
}
