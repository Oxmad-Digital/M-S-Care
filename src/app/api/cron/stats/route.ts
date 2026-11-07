import crypto from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { archiveOldDays, rollupClosedDays } from "@/lib/stats-rollup";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Vercel Cron envoie « Authorization: Bearer <CRON_SECRET> ». Sans secret configuré,
// la route reste fermée.
function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

// Tâche de nuit : consolide les journées closes (et efface les identifiants visiteurs),
// puis archive dans R2 les vues détaillées de plus de 90 jours.
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const rolledUp = await rollupClosedDays();

  // Un problème d'archivage (R2 indisponible) n'empêche pas la consolidation, déjà faite :
  // les vues restent en base et seront archivées à la prochaine exécution.
  let archived: string[] = [];
  let archiveError: string | undefined;
  try {
    archived = await archiveOldDays();
  } catch (error) {
    archiveError = error instanceof Error ? error.message : "Échec de l'archivage";
    console.error("[cron/stats] archivage", error);
  }

  return NextResponse.json(
    { ok: !archiveError, rolledUp, archived, archiveError },
    { status: archiveError ? 500 : 200 },
  );
}
