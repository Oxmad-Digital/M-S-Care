import { prisma } from "@/lib/prisma";
import { readDatabase } from "@/lib/database-read";

export function getProductForEdit(id: string) {
  return readDatabase(() => prisma.product.findUnique({
    where: { id },
    include: {
      notices: { orderBy: { position: "asc" } },
      variants: { orderBy: { position: "asc" } },
    },
  }));
}
