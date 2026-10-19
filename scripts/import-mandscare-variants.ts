// Importe les visuels de dosage absents sans modifier les produits ni les notices.
// npx tsx scripts/import-mandscare-variants.ts [--apply]
import "dotenv/config";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import source from "../data/mandscare-variants.json";
import { prisma } from "../src/lib/prisma";
import { normalizeDosage } from "../src/lib/product-variants";
import { getR2Bucket, publicUrlFor } from "../src/lib/r2";

const APPLY = process.argv.includes("--apply");
const PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

async function main() {
  const products = await prisma.product.findMany({ include: { variants: true } });
  const pending: { productId: string; slug: string; dosage: string; position: number; primaryImage: string; sourceImage: string }[] = [];
  for (const item of source.products) {
    const product = products.find((entry) => entry.slug === item.slug);
    if (!product) throw new Error(`Produit introuvable : ${item.slug}`);
    for (const [position, variant] of item.variants.entries()) {
      const dosage = product.dosages.find((dose) => normalizeDosage(dose) === normalizeDosage(variant.dosage));
      if (!dosage) throw new Error(`Dosage absent : ${item.slug}, ${variant.dosage}`);
      if (product.variants.some((entry) => normalizeDosage(entry.dosage) === normalizeDosage(dosage))) continue;
      const url = new URL(variant.sourceImageUrl);
      if (url.protocol !== "https:" || url.hostname !== "framerusercontent.com") throw new Error("Source d’image inattendue.");
      pending.push({ productId: product.id, slug: product.slug, dosage, position, primaryImage: product.imageUrl, sourceImage: url.href });
    }
  }
  console.log(`${pending.length} variantes à ajouter pour ${source.products.length} produits.`);
  if (!APPLY || !pending.length) return;

  const directory = path.resolve("public/images/products/variants");
  await mkdir(directory, { recursive: true });
  const rows: { productId: string; dosage: string; imageUrl: string; position: number }[] = [];
  const { client, bucket } = getR2Bucket("images");
  for (const variant of pending) {
    let imageUrl = variant.primaryImage;
    if (variant.position > 0) {
      const fileName = `${variant.slug}-${normalizeDosage(variant.dosage).replace(/[^a-z0-9]+/g, "-")}.png`;
      const file = path.join(directory, fileName);
      let body: Buffer;
      try {
        body = await readFile(file);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        const url = new URL(variant.sourceImage);
        url.searchParams.set("scale-down-to", "1024");
        const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
        if (!response.ok) throw new Error(`Image ${fileName} : HTTP ${response.status}`);
        body = Buffer.from(await response.arrayBuffer());
        if (!body.subarray(0, 8).equals(PNG)) throw new Error(`Image PNG invalide : ${fileName}`);
        await writeFile(file, body, { flag: "wx" });
      }
      if (!body.subarray(0, 8).equals(PNG) || body.length > 10 * 1024 * 1024) throw new Error(`Image invalide : ${fileName}`);
      const hash = createHash("sha256").update(body).digest("hex").slice(0, 12);
      const key = `products/variants/${fileName.replace(/\.png$/, "")}-${hash}.png`;
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: "image/png", CacheControl: "public, max-age=31536000, immutable" }));
      imageUrl = publicUrlFor("images", key);
    }
    rows.push({ productId: variant.productId, dosage: variant.dosage, position: variant.position, imageUrl });
    console.log(`${variant.slug} : ${variant.dosage}`);
  }
  const result = await prisma.productVariant.createMany({ data: rows, skipDuplicates: true });
  console.log(`${result.count} variantes ajoutées. Produits et notices conservés.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Échec de l’import des variantes.");
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
