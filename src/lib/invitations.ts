import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { readDatabase } from "@/lib/database-read";

export const INVITATION_DAYS = 7;

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function findValidInvitation(token: string) {
  const invitation = await readDatabase(() => prisma.invitation.findUnique({ where: { tokenHash: hashToken(token) } }));
  if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) return null;
  return invitation;
}
