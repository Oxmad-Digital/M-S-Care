import { timingSafeEqual } from "node:crypto";
import { monthEmails, monthVisitors } from "@/lib/stats";

// Route d'usage lue chaque nuit par l'ERP Oxmad Digital (suivi du contrat de maintenance).
// Ne renvoie que des totaux anonymes : visiteurs uniques par jour additionnés sur le mois,
// et e-mails envoyés via Plunk dans le mois.
// Jours en UTC, comme les statistiques du site (le hash visiteur change chaque jour UTC).

export const dynamic = "force-dynamic";

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function authorized(request: Request) {
  const token = process.env.OXMAD_USAGE_TOKEN ?? "";
  if (token.length < 20) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${token}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
  if (!authorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const month = new URL(request.url).searchParams.get("month") ?? "";
  if (!MONTH_RE.test(month)) return Response.json({ error: "month" }, { status: 400 });
  const [visits, emails] = await Promise.all([monthVisitors(month), monthEmails(month)]);
  return Response.json({ month, visits, emails }, { headers: { "Cache-Control": "no-store" } });
}
