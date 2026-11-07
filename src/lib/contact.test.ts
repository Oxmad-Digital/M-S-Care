import { test } from "node:test";
import assert from "node:assert/strict";
import { detectSpam, MIN_FILL_MS } from "./contact";

const now = 1_000_000;
const human = { honeypot: "", startedAt: String(now - 20_000), email: "client@gmail.com", now };

test("laisse passer un envoi normal", () => {
  assert.equal(detectSpam(human), null);
});

test("rejette le champ piège rempli", () => {
  assert.equal(detectSpam({ ...human, honeypot: "https://spam.example" }), "honeypot");
});

test("rejette un envoi sans horodatage ou trop rapide", () => {
  assert.equal(detectSpam({ ...human, startedAt: "" }), "no-timestamp");
  assert.equal(detectSpam({ ...human, startedAt: "abc" }), "no-timestamp");
  assert.equal(detectSpam({ ...human, startedAt: String(now - MIN_FILL_MS + 1) }), "too-fast");
  assert.equal(detectSpam({ ...human, startedAt: String(now - MIN_FILL_MS) }), null);
});

test("rejette les adresses du domaine de la marque", () => {
  assert.equal(detectSpam({ ...human, email: "benny@mandscare.com" }), "own-domain");
  assert.equal(detectSpam({ ...human, email: "x@MAIL.MandsCare.com" }), "own-domain");
  assert.equal(detectSpam({ ...human, email: "x@notmandscare.com" }), null);
});
