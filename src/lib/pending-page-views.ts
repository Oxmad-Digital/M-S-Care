import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getR2ArchiveBucket } from "@/lib/r2";

const PREFIX = "pending-page-views/v1/";
const BATCH_SIZE = 250;
const READ_CONCURRENCY = 25;
export const MAX_DURATION_MS = 30 * 60 * 1000;

export type PendingPageView = {
  id: string;
  day: string;
  path: string;
  referrer: string;
  deviceType: string;
  country: string;
  visitorHash: string;
  createdAt: string;
  duration: number | null;
};

function viewKey(id: string) {
  return `${PREFIX}${id}.json`;
}

// La dernière demi-heure de collecte peut recevoir des durées après minuit UTC.
export function acceptsDuration(id: string, now = new Date()) {
  const day = id.match(/^(\d{4}-\d{2}-\d{2})\/[0-9a-f-]{36}$/)?.[1];
  const oldest = new Date(now.getTime() - MAX_DURATION_MS).toISOString().slice(0, 10);
  return day !== undefined && day >= oldest;
}

// Une demi-heure de marge entre la dernière mise à jour et le début de l'import.
export function collectionCutoff(now: Date) {
  return new Date(now.getTime() - 2 * MAX_DURATION_MS);
}

async function readView(key: string) {
  const { client, bucket } = getR2ArchiveBucket();
  try {
    const { Body, ETag } = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!Body || !ETag) throw new Error(`Vue R2 incomplète : ${key}`);
    const view: PendingPageView = JSON.parse(await Body.transformToString());
    if (viewKey(view.id) !== key || view.day !== view.id.slice(0, 10)) {
      throw new Error(`Vue R2 incohérente : ${key}`);
    }
    return { view, etag: ETag };
  } catch (error) {
    // Un import concurrent a déjà pu acquitter cette vue.
    if (error instanceof Error && error.name === "NoSuchKey") return null;
    throw error;
  }
}

export async function queuePageView(view: PendingPageView) {
  const { client, bucket } = getR2ArchiveBucket();
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: viewKey(view.id),
    Body: JSON.stringify(view),
    ContentType: "application/json",
    IfNoneMatch: "*",
  }));
}

export async function recordPageViewDuration(id: string, duration: number) {
  const key = viewKey(id);
  const pending = await readView(key);
  if (!pending || pending.view.duration !== null) return;

  const { client, bucket } = getR2ArchiveBucket();
  try {
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify({ ...pending.view, duration }),
      ContentType: "application/json",
      IfMatch: pending.etag,
    }));
  } catch (error) {
    // Une seconde mesure ou un import concurrent a déjà modifié ou supprimé l'objet.
    if (error instanceof Error && error.name === "PreconditionFailed") return;
    throw error;
  }
}

// Relit le premier lot après chaque suppression. Les clés commencent par le jour
// UTC, de sorte que les objets des journées ouvertes restent dans R2.
export async function drainPageViews(
  beforeDay: string,
  persist: (views: PendingPageView[]) => Promise<number>,
) {
  const { client, bucket } = getR2ArchiveBucket();
  let imported = 0;

  for (;;) {
    const batch = await client.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: PREFIX,
      MaxKeys: BATCH_SIZE,
    }));
    const keys = (batch.Contents ?? []).flatMap(({ Key }) => Key && Key < `${PREFIX}${beforeDay}` ? [Key] : []);
    if (!keys.length) return imported;

    const views: PendingPageView[] = [];
    for (let index = 0; index < keys.length; index += READ_CONCURRENCY) {
      const pending = await Promise.all(keys.slice(index, index + READ_CONCURRENCY).map(readView));
      for (const row of pending) if (row) views.push(row.view);
    }
    if (views.length) imported += await persist(views);

    const deletion = await client.send(new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
    }));
    if (deletion.Errors?.length) throw new Error("Échec de la suppression du lot de vues dans R2.");
  }
}
