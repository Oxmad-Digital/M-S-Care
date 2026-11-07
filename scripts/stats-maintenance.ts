// Lance à la main la tâche de nuit des statistiques : consolidation des journées closes
// (rattrape tout l'historique au premier passage), puis archivage R2 des vues de plus de 90 jours.
// Usage : npx tsx scripts/stats-maintenance.ts [--sans-archive]
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { archiveOldDays, rollupClosedDays } from "../src/lib/stats-rollup";

async function main() {
  const rolledUp = await rollupClosedDays();
  console.log(`Journées consolidées : ${rolledUp.length}${rolledUp.length ? ` (${rolledUp[0]} → ${rolledUp.at(-1)})` : ""}`);

  if (process.argv.includes("--sans-archive")) return;
  // Archive par lots de 30 jours jusqu'à épuisement.
  let total = 0;
  for (let batch = await archiveOldDays(); batch.length; batch = await archiveOldDays()) total += batch.length;
  console.log(`Journées archivées dans R2 : ${total}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
