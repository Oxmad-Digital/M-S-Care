// Ajoute les produits absents du catalogue, sans modifier les fiches existantes.
// npx tsx scripts/import-mandscare-products.ts          -> simulation
// npx tsx scripts/import-mandscare-products.ts --apply  -> images R2 + fiches
import "dotenv/config";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { ProductCategory } from "@prisma/client";
import catalogue from "../data/mandscare-products.json";
import { prisma } from "../src/lib/prisma";
import { getR2Bucket, publicUrlFor } from "../src/lib/r2";
import { formatProductName } from "../src/lib/product-name";

const APPLY = process.argv.includes("--apply");
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

async function main() {
  const existing = await prisma.product.findMany({
    select: { slug: true, name: true, order: true },
  });
  const slugs = new Set(existing.map((product) => product.slug));
  const names = new Set(existing.map((product) => normalize(product.name)));
  const missing = catalogue.products.filter((product) => !slugs.has(product.slug) && !names.has(normalize(product.name)));

  const seen = new Set<string>();
  for (const product of missing) {
    if (seen.has(product.slug)) throw new Error(`Slug en double : ${product.slug}`);
    seen.add(product.slug);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug)) throw new Error(`Slug invalide : ${product.slug}`);
    if (!Object.values(ProductCategory).includes(product.category as ProductCategory)) throw new Error(`Catégorie invalide : ${product.slug}`);
    for (const field of ["name", "principeActif", "forme", "conditionnement", "indications"] as const) {
      if (!product[field].trim()) throw new Error(`Champ ${field} absent : ${product.slug}`);
    }
    const image = new URL(product.sourceImageUrl);
    if (image.protocol !== "https:" || image.hostname !== "framerusercontent.com") throw new Error(`Source image inattendue : ${product.slug}`);
  }

  console.log(`${existing.length} fiches existantes ; ${missing.length} produits à ajouter depuis ${catalogue.source}.`);
  for (const product of missing) console.log(`+ ${product.name} (${product.slug})`);
  if (!APPLY || missing.length === 0) return;

  const directory = path.resolve("public/images/products");
  await mkdir(directory, { recursive: true });
  const assets: { body: Buffer; key: string }[] = [];

  // Prépare et valide toutes les images avant d'écrire dans R2 ou dans la base.
  for (const product of missing) {
    const file = path.join(directory, `${product.slug}.png`);
    let body: Buffer;
    try {
      body = await readFile(file);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const url = new URL(product.sourceImageUrl);
      url.searchParams.set("scale-down-to", "1024");
      const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error(`Image ${product.slug} : HTTP ${response.status}`);
      body = Buffer.from(await response.arrayBuffer());
      if (!body.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error(`Image PNG invalide : ${product.slug}`);
      await writeFile(file, body, { flag: "wx" });
    }
    if (!body.subarray(0, 8).equals(PNG_SIGNATURE) || body.length > 10 * 1024 * 1024) throw new Error(`Image invalide : ${product.slug}`);
    const hash = createHash("sha256").update(body).digest("hex").slice(0, 12);
    assets.push({ body, key: `products/mandscare/${product.slug}-${hash}.png` });
  }

  const { client, bucket } = getR2Bucket("images");
  for (const asset of assets) {
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: asset.key,
      Body: asset.body,
      ContentType: "image/png",
      CacheControl: "public, max-age=31536000, immutable",
    }));
  }

  const firstOrder = Math.max(-1, ...existing.map((product) => product.order)) + 1;
  const result = await prisma.product.createMany({
    skipDuplicates: true,
    data: missing.map((product, index) => ({
      slug: product.slug,
      name: formatProductName(product.name),
      category: product.category as ProductCategory,
      principeActif: product.principeActif,
      dosages: product.dosages,
      forme: product.forme,
      conditionnement: product.conditionnement,
      classe: product.classe,
      indications: product.indications,
      flavor: product.flavor,
      imageUrl: publicUrlFor("images", assets[index].key),
      published: true,
      order: firstOrder + index,
    })),
  });
  // Le site source renvoie vers une page Notion commune, sans PDF propre au
  // produit : aucune notice fictive n'est créée lors de cet import.
  console.log(`Import terminé : ${result.count} fiches ajoutées, fiches existantes conservées.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Échec de l'import.");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
