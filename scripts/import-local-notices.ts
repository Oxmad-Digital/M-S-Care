// Script ponctuel : complète les fiches avec les PDF du dossier local « Notices_web »,
// après vérification du contenu de chaque PDF.
//
//   npx tsx scripts/import-local-notices.ts <dossier>           -> simulation (aucune écriture)
//   npx tsx scripts/import-local-notices.ts <dossier> --apply   -> R2 + base
//
// Le script peut être relancé : une notice déjà correcte est ignorée.
import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "../src/lib/prisma";
import { getR2Bucket, publicUrlFor, slugifyFileName } from "../src/lib/r2";

const APPLY = process.argv.includes("--apply");
const DIRECTORY = process.argv.slice(2).find((arg) => !arg.startsWith("--"));

// Fichier -> dosage de la fiche. Une notice existante de même libellé voit son URL remplacée.
const UPLOADS: { slug: string; label: string; file: string }[] = [
  { slug: "cefixcare", label: "40mg/5ml", file: "N_web_CEFIXIME 40mg:5ml_SUSPENSION-60ML.pdf" },
  { slug: "cefixcare", label: "100mg/5ml", file: "N_web_CEFIXIME SUSPENSION Mangue-60ML.pdf" },
  { slug: "metrocare", label: "125mg/5ml", file: "N_web_Metro Care_125mg:5ml_suspension buvable_100 ML.pdf" },
  { slug: "fizzcare-vitamine-c", label: "500mg", file: "N_web_Fizz Care_Vitamine C 500 .pdf" },
  // Remplace la notice de FizzCare Cal C 1000, publiée par erreur sur ce dosage.
  { slug: "fizzcare-vitamine-c", label: "1000mg", file: "N_web_Fizz Care_Vitamine C 1000.pdf" },
];

// Notices déjà en ligne, à relier à leurs dosages : le premier reprend la ligne
// « Notice », les suivants réutilisent le même PDF.
const RELABELS: { slug: string; labels: string[] }[] = [
  { slug: "cefixcare", labels: ["200mg"] },
  { slug: "prednicare", labels: ["5mg", "20mg"] },
];

async function main() {
  if (!DIRECTORY) throw new Error("Indiquer le dossier des notices.");
  console.log(APPLY ? "MODE --apply : R2 + base\n" : "MODE SIMULATION : rien n'est écrit\n");

  const slugs = [...new Set([...UPLOADS, ...RELABELS].map((item) => item.slug))];
  const products = await prisma.product.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true, dosages: true, notices: { select: { id: true, label: true, url: true, position: true } } },
  });
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const productOf = (slug: string) => {
    const product = bySlug.get(slug);
    if (!product) throw new Error(`Fiche introuvable : ${slug}`);
    return product;
  };
  const nextPosition = new Map(products.map((p) => [p.id, Math.max(-1, ...p.notices.map((n) => n.position)) + 1]));
  const addPosition = (productId: string) => {
    const position = nextPosition.get(productId)!;
    nextPosition.set(productId, position + 1);
    return position;
  };

  const puts: { key: string; body: Buffer }[] = [];
  const writes: (() => Promise<unknown>)[] = [];

  for (const { slug, label, file } of UPLOADS) {
    const product = productOf(slug);
    if (!product.dosages.includes(label)) throw new Error(`${slug} : dosage inconnu ${label}`);
    const body = readFileSync(join(DIRECTORY, file));
    if (body.subarray(0, 5).toString() !== "%PDF-") throw new Error(`${file} : ce n'est pas un PDF`);

    const key = `${slug}/${slugifyFileName(file)}`;
    const url = publicUrlFor("notices", key);
    const existing = product.notices.find((n) => n.label === label);
    if (existing?.url === url) {
      console.log(`= ${slug.padEnd(22)} ${label} déjà à jour`);
      continue;
    }
    puts.push({ key, body });
    if (existing) {
      console.log(`~ ${slug.padEnd(22)} ${label} : ${existing.url} -> ${url}`);
      writes.push(() => prisma.notice.update({ where: { id: existing.id }, data: { url } }));
    } else {
      console.log(`+ ${slug.padEnd(22)} ${label} : ${url}`);
      const position = addPosition(product.id);
      writes.push(() => prisma.notice.create({ data: { productId: product.id, label, url, position } }));
    }
  }

  for (const { slug, labels } of RELABELS) {
    const product = productOf(slug);
    const general = product.notices.find((n) => n.label === "Notice");
    if (!general) {
      console.log(`= ${slug.padEnd(22)} déjà reliée`);
      continue;
    }
    labels.forEach((label, index) => {
      if (!product.dosages.includes(label)) throw new Error(`${slug} : dosage inconnu ${label}`);
      console.log(`${index ? "+" : "~"} ${slug.padEnd(22)} ${label} : ${general.url}`);
      if (index === 0) {
        writes.push(() => prisma.notice.update({ where: { id: general.id }, data: { label } }));
      } else {
        const position = addPosition(product.id);
        writes.push(() => prisma.notice.create({ data: { productId: product.id, label, url: general.url, position } }));
      }
    });
  }

  console.log(`\n${puts.length} fichier(s) à déposer, ${writes.length} écriture(s) en base.`);
  if (!APPLY) return;

  const { client, bucket } = getR2Bucket("notices");
  for (const { key, body } of puts) {
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: "application/pdf" }));
  }
  for (const write of writes) await write();
  console.log("Import terminé.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
