import { S3Client } from "@aws-sdk/client-s3";

// Un bucket R2 par type de fichier : les notices (PDF) et les images du site.
export type R2BucketKind = "notices" | "images";

type R2Bucket = { client: S3Client; bucket: string; publicUrl: string };

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`);
  return value;
}

const buckets = new Map<R2BucketKind, R2Bucket>();

export function getR2Bucket(kind: R2BucketKind): R2Bucket {
  const cached = buckets.get(kind);
  if (cached) return cached;

  const prefix = kind === "notices" ? "R2_NOTICES" : "R2_IMAGES";
  const bucket: R2Bucket = {
    client: new S3Client({
      region: "auto",
      endpoint: requireEnv("R2_ENDPOINT"),
      credentials: {
        accessKeyId: requireEnv(`${prefix}_ACCESS_KEY_ID`),
        secretAccessKey: requireEnv(`${prefix}_SECRET_ACCESS_KEY`),
      },
    }),
    bucket: requireEnv(`${prefix}_BUCKET`),
    publicUrl: requireEnv(`${prefix}_PUBLIC_URL`).replace(/\/+$/, ""),
  };
  buckets.set(kind, bucket);
  return bucket;
}

export function publicUrlFor(kind: R2BucketKind, key: string): string {
  const encoded = key.split("/").map(encodeURIComponent).join("/");
  return `${getR2Bucket(kind).publicUrl}/${encoded}`;
}

// « Notice Amdicare 5 mg.PDF » -> « notice-amdicare-5-mg.pdf »
export function slugifyFileName(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  const base = dot > 0 ? fileName.slice(0, dot) : fileName;
  const ext = dot > 0 ? fileName.slice(dot + 1).toLowerCase() : "";
  const slug =
    base
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "fichier";
  return ext ? `${slug}.${ext}` : slug;
}
