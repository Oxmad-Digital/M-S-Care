// Met à jour et publie les produits de la livraison « Update-1 ».
//
//   npx tsx scripts/import-update-1-products.ts          -> simulation
//   npx tsx scripts/import-update-1-products.ts --apply  -> R2 + base
//
// Les images sont redimensionnées et converties en WebP avant l'envoi. Les
// noms des objets R2 conservent explicitement la marque « M&S-Care ».
import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { ProductCategory } from "@prisma/client";
import sharp from "sharp";
import { prisma } from "../src/lib/prisma";
import { getR2Bucket, publicUrlFor } from "../src/lib/r2";

const APPLY = process.argv.includes("--apply");
const DELIVERY_DIRECTORY = "/home/antoine-ponthieu/Images/M&S-Care/Update-1";
const IMAGE_DIRECTORY = "/home/antoine-ponthieu/Images/M&S-Care";

type Asset = {
  file: string;
  key: string;
};

type ProductInput = {
  slug: string;
  name: string;
  category: ProductCategory;
  principeActif: string;
  dosages: string[];
  forme: string;
  conditionnement: string;
  classe: string;
  indications: string;
  image: Asset;
  variants?: { dosage: string; image: Asset }[];
  notices: { label: string; asset: Asset }[];
};

const image = (file: string, outputName: string): Asset => ({
  file: path.join(file.startsWith("../") ? IMAGE_DIRECTORY : DELIVERY_DIRECTORY, file.replace(/^\.\.\//, "")),
  key: `products/update-1/M&S-Care-${outputName}.webp`,
});

const notice = (file: string, productName: string, dosage: string): Asset => ({
  file: path.join(DELIVERY_DIRECTORY, file),
  key: `update-1/${productName}/M&S-Care-${productName}-${dosage}-Notice.pdf`,
});

const products: ProductInput[] = [
  {
    slug: "esopracare",
    name: "EsopraCare",
    category: ProductCategory.MEDICAMENT,
    principeActif: "Ésoméprazole magnésique trihydraté USP",
    dosages: ["20mg"],
    forme: "Gélule à libération retardée",
    conditionnement: "Boîte de 2×7",
    classe: "Inhibiteur de la pompe à protons",
    indications: "Reflux gastro-œsophagien, ulcères de l’estomac ou du duodénum, éradication d’Helicobacter pylori en association avec des antibiotiques, prévention et traitement des ulcères liés aux anti-inflammatoires non stéroïdiens (AINS), syndrome de Zollinger-Ellison",
    image: image("../3D_Esopracare_20 mg_v2.png", "EsopraCare-20mg"),
    notices: [
      { label: "20mg", asset: notice("N_web_Esopra Care 20mg_gélule_v7.pdf", "EsopraCare", "20mg") },
    ],
  },
  {
    slug: "omepracare",
    name: "OmepraCare",
    category: ProductCategory.MEDICAMENT,
    principeActif: "Oméprazole USP",
    dosages: ["20mg"],
    forme: "Gélule gastro-résistante",
    conditionnement: "Boîte de 10×10",
    classe: "Inhibiteur de la pompe à protons",
    indications: "Reflux gastro-œsophagien, ulcères de l’estomac ou du duodénum, éradication d’Helicobacter pylori en association avec des antibiotiques, prévention et traitement des ulcères liés aux anti-inflammatoires non stéroïdiens (AINS), syndrome de Zollinger-Ellison",
    image: image("3D_Omepra Care_20mg_gelule.png", "OmepraCare-20mg"),
    notices: [
      { label: "20mg", asset: notice("N_Omepra Care_vector_v5.pdf", "OmepraCare", "20mg") },
    ],
  },
  {
    slug: "naprilcare",
    name: "NaprilCare",
    category: ProductCategory.MEDICAMENT,
    principeActif: "Maléate d’énalapril USP",
    dosages: ["5mg", "10mg"],
    forme: "Comprimé pelliculé",
    conditionnement: "Boîte de 10×10 (5mg), boîte de 3×10 (10mg)",
    classe: "Antihypertenseur",
    indications: "Hypertension artérielle, insuffisance cardiaque",
    image: image("3D_Napril care 5 mg.png", "NaprilCare-5mg"),
    variants: [
      { dosage: "5mg", image: image("3D_Napril care 5 mg.png", "NaprilCare-5mg") },
      { dosage: "10mg", image: image("3D_Napril Care 10 mg.png", "NaprilCare-10mg") },
    ],
    notices: [
      { label: "5mg", asset: notice("N_NaprilCare 5 mg_200x200_PRINT.pdf", "NaprilCare", "5mg") },
      { label: "10mg", asset: notice("N_Napril care 10 mg_PRINT.pdf", "NaprilCare", "10mg") },
    ],
  },
  {
    slug: "puricare",
    name: "PuriCare",
    category: ProductCategory.MEDICAMENT,
    principeActif: "Allopurinol USP",
    dosages: ["100mg"],
    forme: "Comprimé pelliculé",
    conditionnement: "Boîte de 3×10",
    classe: "Inhibiteur de la synthèse d’acide urique",
    indications: "Hyperuricémie non contrôlée par un régime diététique, traitement et prévention de la lithiase urique",
    image: image("3D_Puri Care_100mg_comprimé.png", "PuriCare-100mg"),
    notices: [
      { label: "100mg", asset: notice("N_Puri care 100 mg_100x200_web.pdf", "PuriCare", "100mg") },
    ],
  },
  {
    slug: "tadalacare",
    name: "TadalaCare",
    category: ProductCategory.MEDICAMENT,
    principeActif: "Tadalafil USP",
    dosages: ["20mg"],
    forme: "Comprimé pelliculé",
    conditionnement: "Boîte de 1×4",
    classe: "Inhibiteur de la PDE5",
    indications: "Dysfonction érectile chez l’homme adulte",
    image: image("3D_Tadala care.png", "TadalaCare-20mg"),
    notices: [
      { label: "20mg", asset: notice("N_web_Tadala Care_20 mg_comprimé pelliculé.pdf", "TadalaCare", "20mg") },
    ],
  },
  {
    slug: "terbicare",
    name: "TerbiCare",
    category: ProductCategory.MEDICAMENT,
    principeActif: "Chlorhydrate de terbinafine",
    dosages: ["1%"],
    forme: "Crème",
    conditionnement: "Tube de 15g",
    classe: "Antifongique",
    indications: "Infections fongiques cutanées, intertrigo, pityriasis versicolor et infections cutanées dues à Candida",
    image: image("3D_Terbi Care 1%_creme.png", "TerbiCare-1-pourcent"),
    notices: [
      { label: "1%", asset: notice("N_web_Terbi Care_1%_creme.pdf", "TerbiCare", "1-pourcent") },
    ],
  },
];

async function compressImage(asset: Asset) {
  const source = await readFile(asset.file);
  const body = await sharp(source)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 84, alphaQuality: 90, effort: 6 })
    .toBuffer();
  const metadata = await sharp(body).metadata();
  if (metadata.format !== "webp" || !metadata.width || !metadata.height) {
    throw new Error(`Image WebP invalide : ${asset.file}`);
  }
  return { asset, body, width: metadata.width, height: metadata.height, sourceBytes: source.length };
}

async function readNotice(asset: Asset) {
  const body = await readFile(asset.file);
  if (body.subarray(0, 5).toString() !== "%PDF-") {
    throw new Error(`Notice PDF invalide : ${asset.file}`);
  }
  return { asset, body };
}

async function main() {
  const uniqueImages = new Map<string, Asset>();
  const uniqueNotices = new Map<string, Asset>();
  for (const product of products) {
    uniqueImages.set(product.image.key, product.image);
    product.variants?.forEach(({ image }) => uniqueImages.set(image.key, image));
    product.notices.forEach(({ asset }) => uniqueNotices.set(asset.key, asset));
  }

  const compressedImages = await Promise.all([...uniqueImages.values()].map(compressImage));
  const noticeFiles = await Promise.all([...uniqueNotices.values()].map(readNotice));
  const existing = await prisma.product.findMany({
    where: { slug: { in: products.map(({ slug }) => slug) } },
    select: { slug: true, order: true },
  });

  console.log(APPLY ? "MODE --apply : R2 + base\n" : "MODE SIMULATION : aucune écriture\n");
  for (const product of products) {
    console.log(`${existing.some(({ slug }) => slug === product.slug) ? "~" : "+"} ${product.name} (${product.dosages.join(", ")})`);
  }
  for (const { asset, body, sourceBytes, width, height } of compressedImages) {
    const reduction = Math.round((1 - body.length / sourceBytes) * 100);
    console.log(`  image ${path.basename(asset.key)} : ${width}×${height}, ${(body.length / 1024).toFixed(0)} Ko (${reduction}% de réduction)`);
  }
  console.log(`\n${products.length} produits, ${compressedImages.length} images WebP, ${noticeFiles.length} notices PDF.`);
  if (!APPLY) return;

  const imageBucket = getR2Bucket("images");
  for (const { asset, body } of compressedImages) {
    await imageBucket.client.send(new PutObjectCommand({
      Bucket: imageBucket.bucket,
      Key: asset.key,
      Body: body,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }));
  }

  const noticeBucket = getR2Bucket("notices");
  for (const { asset, body } of noticeFiles) {
    await noticeBucket.client.send(new PutObjectCommand({
      Bucket: noticeBucket.bucket,
      Key: asset.key,
      Body: body,
      ContentType: "application/pdf",
    }));
  }

  let nextOrder = Math.max(-1, ...(await prisma.product.findMany({ select: { order: true } })).map(({ order }) => order)) + 1;
  await prisma.$transaction(async (tx) => {
    for (const product of products) {
      const existingProduct = await tx.product.findUnique({ where: { slug: product.slug }, select: { id: true } });
      const data = {
        name: product.name,
        category: product.category,
        principeActif: product.principeActif,
        dosages: product.dosages,
        forme: product.forme,
        conditionnement: product.conditionnement,
        classe: product.classe,
        indications: product.indications,
        flavor: null,
        imageUrl: publicUrlFor("images", product.image.key),
        published: true,
        notices: {
          deleteMany: {},
          create: product.notices.map(({ label, asset }, position) => ({
            label,
            url: publicUrlFor("notices", asset.key),
            position,
          })),
        },
        variants: {
          deleteMany: {},
          create: (product.variants ?? []).map(({ dosage, image }, position) => ({
            dosage,
            imageUrl: publicUrlFor("images", image.key),
            position,
          })),
        },
      };

      if (existingProduct) {
        await tx.product.update({ where: { id: existingProduct.id }, data });
      } else {
        await tx.product.create({ data: { slug: product.slug, order: nextOrder++, ...data } });
      }
    }
  }, { maxWait: 15_000, timeout: 60_000 });

  console.log("\nImport terminé : produits publiés, médias R2 et variantes mis à jour.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
