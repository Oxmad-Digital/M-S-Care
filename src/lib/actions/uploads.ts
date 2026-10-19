"use server";

import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getCurrentUser } from "@/lib/current-user";
import { can } from "@/lib/permissions";
import {
  getR2Bucket,
  publicUrlFor,
  slugifyFileName,
  type R2BucketKind,
} from "@/lib/r2";

const RULES: Record<R2BucketKind, { types: string[]; maxBytes: number }> = {
  notices: { types: ["application/pdf"], maxBytes: 20 * 1024 * 1024 },
  images: {
    types: ["image/png", "image/jpeg", "image/webp", "image/avif"],
    maxBytes: 10 * 1024 * 1024,
  },
};

export type UploadTarget =
  | { ok: true; uploadUrl: string; publicUrl: string }
  | { ok: false; error: string };

// Le fichier ne transite pas par le serveur : on renvoie une URL signée,
// valable quelques minutes, vers laquelle le navigateur envoie le fichier.
export async function createUploadUrl(
  kind: R2BucketKind,
  fileName: string,
  contentType: string,
  size: number,
): Promise<UploadTarget> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "edit")) return { ok: false, error: "Non autorisé." };

  const rules = RULES[kind];
  if (!rules) return { ok: false, error: "Type d'upload inconnu." };
  if (!rules.types.includes(contentType)) {
    return { ok: false, error: "Format de fichier non accepté." };
  }
  if (size > rules.maxBytes) {
    const maxMb = rules.maxBytes / 1024 / 1024;
    return { ok: false, error: `Fichier trop lourd (${maxMb} Mo maximum).` };
  }

  // Préfixe aléatoire : deux fichiers du même nom ne s'écrasent jamais.
  const key = `${randomUUID().slice(0, 8)}-${slugifyFileName(fileName)}`;
  const { client, bucket } = getR2Bucket(kind);
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn: 300 },
  );

  return { ok: true, uploadUrl, publicUrl: publicUrlFor(kind, key) };
}
