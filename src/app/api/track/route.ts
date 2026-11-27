import { randomUUID } from "node:crypto";
import { NextResponse, userAgent } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { queuePageView } from "@/lib/pending-page-views";
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
  // Opposition exprimée par le navigateur (Global Privacy Control / Do Not Track) : rien n'est enregistré.
  if (request.headers.get("sec-gpc") === "1" || request.headers.get("dnt") === "1") {
    return NextResponse.json({ ok: true });
  }

  let body: { path?: unknown; referrer?: unknown } | null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const path = typeof body?.path === "string" ? body.path.slice(0, 300) : "";
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

  const host = request.headers.get("host");
  let referrer = "";
  if (typeof body?.referrer === "string" && body.referrer) {
    try {
      const refUrl = new URL(body.referrer);
      if (refUrl.host !== host) referrer = refUrl.host.slice(0, 200);
    } catch {
      referrer = "";
    }
  }

  const createdAt = new Date().toISOString();
  const day = createdAt.slice(0, 10);
  const id = `${day}/${randomUUID()}`;
  await queuePageView({
    id,
    day,
    path,
    referrer,
    deviceType: device.type ?? "desktop",
    country: request.headers.get("x-vercel-ip-country") ?? "",
    visitorHash: visitorHash(ip, request.headers.get("user-agent") ?? "", day),
    createdAt,
    duration: null,
  });

  return NextResponse.json({ ok: true, id, token: signViewId(id) });
}
