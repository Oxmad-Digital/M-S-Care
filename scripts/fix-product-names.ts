// Script ponctuel : met une majuscule au « C » de Care dans les noms de produits
// (Aldacare -> AldaCare, KofcarePhyto -> KofCarePhyto…).
//
//   npx tsx scripts/fix-product-names.ts           -> simulation (aucune écriture)
//   npx tsx scripts/fix-product-names.ts --apply   -> écrit les nouveaux noms
//
// Ne modifie que Product.name ; les slugs (et donc les URL) restent inchangés.
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { formatProductName } from "../src/lib/product-name";

const APPLY = process.argv.includes("--apply");

async function main() {
  const products = await prisma.product.findMany({ select: { id: true, name: true }, orderBy: { order: "asc" } });
  const changes = products
    .map((product) => ({ ...product, next: formatProductName(product.name) }))
    .filter((product) => product.next !== product.name);

  for (const { name, next } of changes) console.log(`${name} -> ${next}`);
  console.log(`${changes.length} nom(s) à corriger.`);

  if (!APPLY || changes.length === 0) return;
  await prisma.$transaction(changes.map(({ id, next }) => prisma.product.update({ where: { id }, data: { name: next } })));
  console.log("Noms mis à jour.");
}

main().finally(() => prisma.$disconnect());
