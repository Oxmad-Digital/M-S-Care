// Applique une migration Prisma via la connexion Neon de l'app (WebSocket),
// quand le port 5432 n'est pas joignable pour `prisma migrate deploy`.
// Usage : npx tsx scripts/apply-migration.ts <nom_du_dossier_de_migration>
import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { prisma } from "../src/lib/prisma";

async function main() {
  const name = process.argv[2];
  if (!name) throw new Error("Usage : npx tsx scripts/apply-migration.ts <migration>");
  const sql = await readFile(`prisma/migrations/${name}/migration.sql`, "utf8");
  const checksum = createHash("sha256").update(sql).digest("hex");

  await prisma.$transaction(async (tx) => {
    const existing = await tx.$queryRaw<{ checksum: string; finished_at: Date | null }[]>`
      SELECT checksum, finished_at FROM "_prisma_migrations"
      WHERE migration_name = ${name} AND rolled_back_at IS NULL
    `;
    if (existing.length) {
      if (existing[0].checksum !== checksum || !existing[0].finished_at) throw new Error("La migration existante doit être vérifiée.");
      console.log(`Migration ${name} déjà appliquée.`);
      return;
    }
    for (const statement of sql.split(";").map((part) => part.trim()).filter(Boolean)) {
      await tx.$executeRawUnsafe(statement);
    }
    await tx.$executeRaw`
      INSERT INTO "_prisma_migrations" (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
      VALUES (${randomUUID()}, ${checksum}, ${name}, NOW(), NOW(), 1)
    `;
    console.log(`Migration ${name} appliquée et enregistrée.`);
  }, { timeout: 30_000 });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Échec de la migration.");
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
