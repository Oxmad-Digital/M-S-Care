import assert from "node:assert/strict";
import test from "node:test";
import { anonymizeForArchive, archiveKey, buildRollup, utcDay } from "./stats-rollup";
import { groupByWeek } from "./stats";

const view = (over: Partial<Parameters<typeof buildRollup>[0][number]> = {}) => ({
  path: "/",
  referrer: "",
  deviceType: "desktop",
  country: "MU",
  duration: null as number | null,
  visitorHash: "a",
  ...over,
});

test("buildRollup compte vues, visiteurs distincts, durées et critères", () => {
  const r = buildRollup([
    view({ duration: 1000 }),
    view({ path: "/produits/x", duration: 3000 }),
    view({ visitorHash: "b", referrer: "google.com", deviceType: "mobile", duration: 0 }),
  ]);
  assert.equal(r.views, 3);
  assert.equal(r.visitors, 2);
  assert.equal(r.durationSum, 4000);
  assert.equal(r.durationCount, 2);
  const get = (dimension: string, value: string) =>
    r.dimensions.find((d) => d.dimension === dimension && d.value === value)?.views;
  assert.equal(get("path", "/"), 2);
  assert.equal(get("path", "/produits/x"), 1);
  assert.equal(get("referrer", ""), 2);
  assert.equal(get("referrer", "google.com"), 1);
  assert.equal(get("deviceType", "mobile"), 1);
  assert.equal(get("country", "MU"), 3);
});

test("buildRollup ignore les identifiants déjà effacés", () => {
  assert.equal(buildRollup([view({ visitorHash: "" }), view({ visitorHash: "" })]).visitors, 0);
});

test("l'archive ne contient aucun identifiant et n'est pas dans l'ordre chronologique", () => {
  const rows = anonymizeForArchive("2026-08-06", [
    { path: "/produits/z", referrer: "", deviceType: "mobile", country: "FR", duration: 10 },
    { path: "/", referrer: "", deviceType: "desktop", country: "MU", duration: null },
    { ...view({ path: "/produits/a" }) },
  ]);
  for (const row of rows) {
    assert.deepEqual(Object.keys(row).sort(), ["country", "day", "deviceType", "duration", "path", "referrer"]);
    assert.equal(row.day, "2026-08-06");
  }
  assert.deepEqual(rows.map((r) => r.path), ["/", "/produits/a", "/produits/z"]);
});

test("archiveKey range les fichiers par année et mois", () => {
  assert.equal(archiveKey("2026-08-06"), "page-views/2026/08/2026-08-06.ndjson.gz");
});

test("utcDay décale en jours UTC", () => {
  const now = new Date("2026-03-01T23:30:00Z");
  assert.equal(utcDay(0, now), "2026-03-01");
  assert.equal(utcDay(-1, now), "2026-02-28");
  assert.equal(utcDay(-90, now), "2025-12-01");
});

test("groupByWeek regroupe par semaine commençant le lundi", () => {
  const weeks = groupByWeek([
    { day: "2026-11-01", views: 1, visitors: 1 }, // dimanche
    { day: "2026-11-02", views: 2, visitors: 1 }, // lundi
    { day: "2026-11-08", views: 3, visitors: 2 }, // dimanche
    { day: "2026-11-09", views: 4, visitors: 3 }, // lundi
  ]);
  assert.deepEqual(weeks, [
    { day: "2026-10-26", views: 1, visitors: 1 },
    { day: "2026-11-02", views: 5, visitors: 3 },
    { day: "2026-11-09", views: 4, visitors: 3 },
  ]);
});
