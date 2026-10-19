import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readDatabase } from "@/lib/database-read";
import { can, type Permission } from "@/lib/permissions";

// Relu en base à chaque requête : un rôle modifié ou un compte retiré prend effet immédiatement.
export const getCurrentUser = cache(async () => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return readDatabase(() =>
    prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    }),
  );
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser(permission?: Permission): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (permission && !can(user.role, permission)) {
    throw new Error("Votre rôle ne permet pas cette action.");
  }
  return user;
}

export function displayName(user: { firstName: string; lastName: string; email: string }) {
  return `${user.firstName} ${user.lastName}`.trim() || user.email;
}
