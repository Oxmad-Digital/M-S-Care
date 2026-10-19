import crypto from "node:crypto";
import type { NextRequest } from "next/server";

// Clés dérivées d'AUTH_SECRET avec un libellé par usage : le secret de session n'est
// jamais utilisé tel quel pour autre chose, et les usages ne se recoupent pas.
function derivedKey(label: string) {
  return crypto
    .createHmac("sha256", process.env.AUTH_SECRET ?? "")
    .update(`mns-care:${label}`)
    .digest();
}

// Identifiant visiteur anonyme : IP + navigateur + jour, haché avec un poivre secret.
// Rien n'est stocké côté navigateur et l'IP n'est jamais enregistrée en clair.
export function visitorHash(ip: string, userAgent: string, day: string) {
  return crypto
    .createHmac("sha256", derivedKey("visitor-hash"))
    .update(`${ip}|${userAgent}|${day}`)
    .digest("hex")
    .slice(0, 32);
}

// Jeton renvoyé avec l'id d'une vue : prouve que l'appelant est celui qui l'a créée
// (sans lui, n'importe qui pourrait écraser la durée de n'importe quelle vue).
export function signViewId(id: string) {
  return crypto.createHmac("sha256", derivedKey("view-id")).update(id).digest("hex").slice(0, 32);
}

export function verifyViewId(id: string, token: unknown) {
  if (typeof token !== "string") return false;
  const expected = Buffer.from(signViewId(id));
  const given = Buffer.from(token);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

// Pages publiques réelles uniquement : l'admin, les 404 et les valeurs forgées sont ignorés.
export function isTrackablePath(path: string) {
  return path === "/" || /^\/produits\/[a-z0-9-]{1,200}$/.test(path);
}

export function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Refuse les appels envoyés depuis un autre site.
export function isSameOrigin(request: NextRequest) {
  const host = request.headers.get("host");
  const origin = request.headers.get("origin");
  if (!origin || !host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

// Limite en mémoire, propre à chaque instance : aucun coût base de données pour un
// endpoint appelé à chaque page vue. Best-effort seulement.
const hits = new Map<string, { count: number; resetAt: number }>();

export function memoryRateLimit(bucket: string, id: string, limit = 120, windowMs = 60_000) {
  const now = Date.now();
  const key = `${bucket}:${id}`;

  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }

  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}
