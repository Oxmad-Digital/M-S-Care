import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIp, isSameOrigin, memoryRateLimit, verifyViewId } from "@/lib/tracking";

const MAX_DURATION_MS = 30 * 60 * 1000;

export async function POST(request: NextRequest) {
  if (!memoryRateLimit("track-duration", getClientIp(request))) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  let body: { id?: unknown; token?: unknown; duration?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  const duration = typeof body.duration === "number" ? body.duration : NaN;

  if (!id || !verifyViewId(id, body.token) || !Number.isFinite(duration) || duration <= 0) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Origine refusée" }, { status: 403 });
  }

  await prisma.pageView.updateMany({
    where: { id },
    data: { duration: Math.round(Math.min(duration, MAX_DURATION_MS)) },
  });

  return NextResponse.json({ ok: true });
}
