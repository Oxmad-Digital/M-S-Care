// Script ponctuel : envoie sur le bucket R2 des images les images produits
// encore servies depuis public/ (« /images/... ») et met à jour Product.imageUrl.
//
//   npx tsx scripts/upload-product-images.ts           -> simulation (aucune écriture)
//   npx tsx scripts/upload-product-images.ts --apply   -> envoie les fichiers et met à jour la base
//
// Les fichiers de public/ ne sont pas supprimés.
import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "../src/lib/prisma";
import { getR2Bucket, publicUrlFor } from "../src/lib/r2";

const APPLY = process.argv.includes("--apply");

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

async function main() {
  const products = await prisma.product.findMany({
    where: { imageUrl: { startsWith: "/" } },
    select: { id: true, slug: true, imageUrl: true },
  });

  if (products.length === 0) {
    console.log("Aucune image locale à envoyer.");
    return;
  }

  const { client, bucket } = getR2Bucket("images");

  for (const product of products) {
    // « /images/products/aldacare.png » -> clé « products/aldacare.png »
    const key = product.imageUrl.replace(/^\/images\//, "").replace(/^\//, "");
    const contentType = CONTENT_TYPES[path.extname(key).toLowerCase()];
    const url = publicUrlFor("images", key);

    if (!contentType) {
      console.log(`! ${product.slug} : extension non gérée (${product.imageUrl}), ignoré`);
      continue;
    }

    console.log(`${product.slug} : ${product.imageUrl} -> ${url}`);
    if (!APPLY) continue;

    const body = await readFile(path.join("public", product.imageUrl));
    await client.send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
    );
    await prisma.product.update({ where: { id: product.id }, data: { imageUrl: url } });
  }

  console.log(APPLY ? "Terminé." : "\nSimulation. Relancer avec --apply pour écrire.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
