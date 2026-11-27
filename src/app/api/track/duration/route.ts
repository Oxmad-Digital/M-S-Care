import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { acceptsDuration, MAX_DURATION_MS, recordPageViewDuration } from "@/lib/pending-page-views";
import { getClientIp, isSameOrigin, memoryRateLimit, verifyViewId } from "@/lib/tracking";

export async function POST(request: NextRequest) {
  if (request.headers.get("sec-gpc") === "1" || request.headers.get("dnt") === "1") {
    return NextResponse.json({ ok: true });
  }

  if (!memoryRateLimit("track-duration", getClientIp(request))) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  let body: { id?: unknown; token?: unknown; duration?: unknown } | null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const id = typeof body?.id === "string" ? body.id : "";
  const duration = typeof body?.duration === "number" ? body.duration : NaN;

  if (!id || id.length > 47 || !verifyViewId(id, body?.token) || !Number.isFinite(duration) || duration <= 0) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Origine refusée" }, { status: 403 });
  }

  if (acceptsDuration(id)) {
    await recordPageViewDuration(id, Math.round(Math.min(duration, MAX_DURATION_MS)));
  }

  return NextResponse.json({ ok: true });
}
