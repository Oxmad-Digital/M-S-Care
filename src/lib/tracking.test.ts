import assert from "node:assert/strict";
import test from "node:test";
import type { NextRequest } from "next/server";
import { getClientIp, isSameOrigin, isTrackablePath, memoryRateLimit, signViewId, verifyViewId, visitorHash } from "./tracking";

// Les clés sont dérivées d'AUTH_SECRET à chaque appel.
process.env.AUTH_SECRET = "secret-de-test";

function request(headers: Record<string, string>) {
  return { headers: new Headers(headers) } as unknown as NextRequest;
}

test("visitorHash est stable, anonyme et change chaque jour", () => {
  const a = visitorHash("1.2.3.4", "Firefox", "2026-10-19");
  assert.equal(a, visitorHash("1.2.3.4", "Firefox", "2026-10-19"));
  assert.match(a, /^[0-9a-f]{32}$/);
  assert.ok(!a.includes("1.2.3.4"));
  assert.notEqual(a, visitorHash("1.2.3.4", "Firefox", "2026-10-20"));
  assert.notEqual(a, visitorHash("1.2.3.5", "Firefox", "2026-10-19"));
});

test("verifyViewId accepte uniquement le jeton signé de la vue", () => {
  const token = signViewId("vue-1");
  assert.equal(verifyViewId("vue-1", token), true);
  assert.equal(verifyViewId("vue-2", token), false);
  assert.equal(verifyViewId("vue-1", token.slice(0, -1)), false);
  assert.equal(verifyViewId("vue-1", "x".repeat(32)), false);
  assert.equal(verifyViewId("vue-1", undefined), false);
  assert.equal(verifyViewId("vue-1", 123), false);
});

test("isTrackablePath ne mesure que les pages publiques", () => {
  for (const path of ["/", "/produits/ibucare", "/produits/fizzcare-vitamine-c"]) assert.equal(isTrackablePath(path), true);
  for (const path of ["/admin", "/admin/produits", "/produits/", "/produits/a/b", "/produits/IBU", "/autre", "/produits/x?y=1"])
    assert.equal(isTrackablePath(path), false, path);
});

test("getClientIp lit le premier proxy, puis x-real-ip", () => {
  assert.equal(getClientIp(request({ "x-forwarded-for": " 10.0.0.1 , 10.0.0.2" })), "10.0.0.1");
  assert.equal(getClientIp(request({ "x-real-ip": "10.0.0.3" })), "10.0.0.3");
  assert.equal(getClientIp(request({})), "unknown");
});

test("isSameOrigin refuse un appel venant d’un autre site", () => {
  assert.equal(isSameOrigin(request({ host: "mns.mg", origin: "https://mns.mg" })), true);
  assert.equal(isSameOrigin(request({ host: "mns.mg", origin: "https://evil.com" })), false);
  assert.equal(isSameOrigin(request({ host: "mns.mg", origin: "pas une url" })), false);
  assert.equal(isSameOrigin(request({ host: "mns.mg" })), true);
});

test("memoryRateLimit bloque au-delà de la limite puis se réinitialise", async () => {
  for (let i = 0; i < 3; i++) assert.equal(memoryRateLimit("test", "ip", 3, 50), true);
  assert.equal(memoryRateLimit("test", "ip", 3, 50), false);
  assert.equal(memoryRateLimit("test", "autre-ip", 3, 50), true);
  await new Promise((resolve) => setTimeout(resolve, 60));
  assert.equal(memoryRateLimit("test", "ip", 3, 50), true);
});
