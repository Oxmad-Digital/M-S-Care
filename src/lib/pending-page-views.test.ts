import assert from "node:assert/strict";
import test from "node:test";
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  acceptsDuration,
  collectionCutoff,
  drainPageViews,
  queuePageView,
  recordPageViewDuration,
  type PendingPageView,
} from "./pending-page-views";

test("les durées reçues après minuit sont acceptées avant l'import", () => {
  const id = "2026-11-26/02000000-0000-4000-8000-000000000000";
  assert.equal(acceptsDuration(id, new Date("2026-11-27T00:29:59Z")), true);
  assert.equal(acceptsDuration(id, new Date("2026-11-27T00:30:00Z")), false);
  assert.equal(collectionCutoff(new Date("2026-11-27T00:59:59Z")).toISOString().slice(0, 10), "2026-11-26");
  assert.equal(collectionCutoff(new Date("2026-11-27T01:00:00Z")).toISOString().slice(0, 10), "2026-11-27");
});

test("un lot est rejouable après une écriture SQL ou une suppression R2 en échec", async (t) => {
  process.env.R2_ENDPOINT = "https://r2.example.test";
  process.env.R2_ARCHIVE_BUCKET = "test";
  process.env.R2_ARCHIVE_ACCESS_KEY_ID = "test";
  process.env.R2_ARCHIVE_SECRET_ACCESS_KEY = "test";

  const objects = new Map<string, { body: string; etag: string }>();
  let refuseDeletion = false;
  let version = 0;
  t.mock.method(S3Client.prototype, "send", async (command: unknown) => {
    if (command instanceof PutObjectCommand) {
      const { Key: key, Body: body, IfMatch } = command.input;
      assert.ok(key && typeof body === "string");
      if (IfMatch) assert.equal(objects.get(key)?.etag, IfMatch);
      else assert.equal(command.input.IfNoneMatch, "*");
      objects.set(key, { body, etag: String(++version) });
      return {};
    }
    if (command instanceof GetObjectCommand) {
      const object = objects.get(command.input.Key!);
      if (!object) throw Object.assign(new Error(), { name: "NoSuchKey" });
      return { Body: { transformToString: async () => object.body }, ETag: object.etag };
    }
    if (command instanceof ListObjectsV2Command) {
      const { Prefix, MaxKeys } = command.input;
      const keys = [...objects.keys()].filter((key) => key.startsWith(Prefix!)).sort();
      return { Contents: keys.slice(0, MaxKeys).map((Key) => ({ Key })) };
    }
    if (command instanceof DeleteObjectsCommand) {
      const keys = command.input.Delete!.Objects!.map(({ Key }) => Key!);
      if (refuseDeletion) return { Errors: [{ Key: keys[0] }] };
      for (const key of keys) objects.delete(key);
      return {};
    }
    throw new Error("Commande R2 inattendue");
  });

  const day = "2026-11-26";
  const openDay = "2026-11-27";
  const view = {
    id: "",
    day,
    path: "/",
    referrer: "",
    deviceType: "desktop",
    country: "MG",
    visitorHash: "visitor",
    createdAt: `${day}T12:00:00Z`,
    duration: null,
  } satisfies PendingPageView;
  const id = `${day}/02000000-0000-4000-8000-000000000000`;
  await queuePageView({ ...view, id });
  await recordPageViewDuration(id, 1500);
  await recordPageViewDuration(id, 2000);
  for (let index = 1; index <= 250; index++) {
    const otherId = `${day}/02000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
    await queuePageView({ ...view, id: otherId });
  }
  await queuePageView({
    ...view,
    id: `${openDay}/02000000-0000-4000-8000-000000000000`,
    day: openDay,
    createdAt: `${openDay}T00:10:00Z`,
  });

  const stored = new Map<string, PendingPageView>();
  const batchSizes: number[] = [];
  const persist = async (views: PendingPageView[]) => {
    batchSizes.push(views.length);
    const oldSize = stored.size;
    for (const row of views) if (!stored.has(row.id)) stored.set(row.id, row);
    return stored.size - oldSize;
  };

  await assert.rejects(drainPageViews(openDay, async () => { throw new Error("SQL indisponible"); }), /SQL indisponible/);
  assert.equal(objects.size, 252);
  refuseDeletion = true;
  await assert.rejects(drainPageViews(openDay, persist), /suppression/);
  assert.equal(stored.size, 250);
  assert.equal(objects.size, 252);

  refuseDeletion = false;
  assert.equal(await drainPageViews(openDay, persist), 1);
  assert.deepEqual(batchSizes, [250, 250, 1]);
  assert.equal(stored.size, 251);
  assert.equal(stored.get(id)?.duration, 1500);
  assert.equal(objects.size, 1);
  assert.equal(await drainPageViews(openDay, persist), 0);
});
