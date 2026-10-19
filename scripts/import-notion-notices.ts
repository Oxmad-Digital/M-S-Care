// Récupère les PDF de la base Notion « Notices produits », les dépose dans le
// bucket R2 des notices et les ajoute aux fiches correspondantes.
//
//   npx tsx scripts/import-notion-notices.ts           -> simulation (aucune écriture)
//   npx tsx scripts/import-notion-notices.ts --apply   -> R2 + base
//
// Une notice dont le fichier figure déjà sur la fiche est ignorée : le script
// peut être relancé sans créer de doublon. Les notices existantes sont conservées.
import "dotenv/config";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "../src/lib/prisma";
import { getR2Bucket, publicUrlFor, slugifyFileName } from "../src/lib/r2";

const APPLY = process.argv.includes("--apply");
const MAX_BYTES = 20 * 1024 * 1024;

const NOTION = {
  spaceId: "dedec75d-7650-81e9-9b82-000376804392",
  collectionId: "320ec75d-7650-8020-af54-000b61cdcadd",
  viewId: "320ec75d-7650-808a-8c8d-000c5e9401ff",
  filesProperty: "XXYM", // « Notice format PDF »
};

// Nom de la ligne Notion -> slug de la fiche.
const PRODUCTS: Record<string, string> = {
  "Aldacare": "aldacare",
  "Amdicare": "amdicare",
  "Azithromycine M&S CARE": "azithcare",
  "Cotrimcare": "cotrimcare",
  "Cefixcare": "cefixcare",
  "Ceftricare": "ceftricare",
  "Ciflocare": "ciflocare",
  "Fizzcare paracetamol": "fizzcare-paracetamol",
  "Ibucare": "ibucare",
  "Ketocare": "ketocare",
  "KofcarePhyto pastille": "kofcarephyto-pastille",
  "KofcarePhyto sirop": "kofcarephyto-sirop",
  "Losarcare": "losarcare",
  "LosarcareH": "losarcareh",
  "Metrocare": "metrocare",
  "Ofloxcare": "ofloxcare",
  "Paracare": "paracare",
  "Prédnicare": "prednicare",
  "SRO M&S CARE": "sro",
  "Vastacare": "vastacare",
  "Fizzacare vitamine C": "fizzcare-vitamine-c",
  "Fizzacare Cal - D3": "fizzcare-cal-d3",
  "Fizzacare énergie": "fizzcare-energie",
  "Fizzacare immunité": "fizzcare-immunite",
  "Fizzacare neuro": "fizzcare-neuro",
  "Fizzacare osteo": "fizzcare-osteo",
  "Fizzacare Zinc": "fizzcare-zinc",
  "Vitalcare beauté": "vitalcare-beaute",
  "Vitalcare sommeil": "vitalcare-sommeil",
};

// Libellé par fichier lorsqu'il désigne un dosage de la fiche (ce qui relie la
// notice au dosage sur le site) ; sinon « Notice ». Vérifié dans le contenu des PDF.
const LABELS: Record<string, string> = {
  "N_MetroCare_notice_vector.pdf": "Solution pour perfusion 5 mg/ml",
  "B_Metro Care 250 mg_comprimé_NEW format_VECTOR_PRINT.pdf": "250mg",
  "N_web_Para Care 10mg_solution perf_250x200.pdf": "10mg/ml",
  "N_web_Para Care_Suspension buvable_NOTICE_new_200x240_v6.pdf": "125mg/5ml",
  "N_Vasta care 10_180x240.pdf": "10mg",
  "N_web__Vasta care 20.pdf": "20mg",
  "N_Vasta care 40_180x240.pdf": "40mg",
  "N_Fizz Care_Cal C 1000 MG_Strip 2x4 comprimés effervescent_PRINT.pdf": "1000mg",
};

type NotionFile = { row: string; blockId: string; name: string; source: string };

async function notion<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await fetch(`https://www.notion.so/api/v3/${endpoint}`, {
    method: "POST",
    // Sans User-Agent, Notion répond 403 aux requêtes de Node.
    headers: { "content-type": "application/json", "user-agent": "curl/8" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Notion ${endpoint} : HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

type Block = { value: { id: string; properties?: Record<string, unknown[][]> } & { value?: Block["value"] } };

async function listNotionFiles(): Promise<NotionFile[]> {
  const data = await notion<{
    result: { reducerResults: { collection_group_results: { blockIds: string[] } } };
    recordMap: { block: Record<string, Block> };
  }>("queryCollection", {
    collection: { id: NOTION.collectionId, spaceId: NOTION.spaceId },
    collectionView: { id: NOTION.viewId, spaceId: NOTION.spaceId },
    loader: {
      type: "reducer",
      reducers: { collection_group_results: { type: "results", limit: 500 } },
      searchQuery: "",
      userTimeZone: "Indian/Antananarivo",
    },
  });

  const files: NotionFile[] = [];
  for (const id of data.result.reducerResults.collection_group_results.blockIds) {
    const raw = data.recordMap.block[id].value;
    const block = raw.value ?? raw;
    const properties = block.properties ?? {};
    const row = (properties.title ?? []).map((segment) => segment[0]).join("");
    for (const segment of properties[NOTION.filesProperty] ?? []) {
      const [name, decorations] = segment as [string, [string, string][] | undefined];
      const link = decorations?.find((decoration) => decoration[0] === "a");
      if (link) files.push({ row, blockId: block.id, name, source: link[1] });
    }
  }
  return files;
}

async function download(file: NotionFile): Promise<Buffer> {
  const { signedUrls } = await notion<{ signedUrls: string[] }>("getSignedFileUrls", {
    urls: [{
      url: file.source,
      permissionRecord: { table: "block", id: file.blockId, spaceId: NOTION.spaceId },
    }],
  });
  const response = await fetch(signedUrls[0], { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`${file.name} : HTTP ${response.status}`);
  const body = Buffer.from(await response.arrayBuffer());
  if (body.subarray(0, 5).toString() !== "%PDF-") throw new Error(`${file.name} : ce n'est pas un PDF`);
  if (body.length > MAX_BYTES) throw new Error(`${file.name} : fichier trop lourd`);
  return body;
}

const fileNameOf = (url: string) => {
  const path = new URL(url).pathname;
  return decodeURIComponent(path.slice(path.lastIndexOf("/") + 1));
};

async function main() {
  const files = await listNotionFiles();
  const unknownRows = [...new Set(files.map((f) => f.row))].filter((row) => !PRODUCTS[row]);
  if (unknownRows.length) throw new Error(`Lignes Notion sans fiche associée : ${unknownRows.join(", ")}`);

  const products = await prisma.product.findMany({
    where: { slug: { in: Object.values(PRODUCTS) } },
    select: { id: true, slug: true, notices: { select: { url: true, position: true } } },
  });
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const missingSlugs = Object.values(PRODUCTS).filter((slug) => !bySlug.has(slug));
  if (missingSlugs.length) throw new Error(`Fiches introuvables : ${missingSlugs.join(", ")}`);

  console.log(APPLY ? "MODE --apply : R2 + base\n" : "MODE SIMULATION : rien n'est écrit\n");

  const plan: { file: NotionFile; productId: string; slug: string; key: string; label: string }[] = [];
  for (const file of files) {
    const product = bySlug.get(PRODUCTS[file.row])!;
    const fileName = slugifyFileName(file.name);
    // Les notices déjà importées portent le nom de fichier slugifié en fin d'URL.
    if (product.notices.some((n) => n.url.startsWith("http") && fileNameOf(n.url).endsWith(fileName))) {
      console.log(`= ${product.slug.padEnd(22)} déjà présente : ${file.name}`);
      continue;
    }
    // Certains noms Notion sont en Unicode décomposé (« e » + accent).
    const label = LABELS[file.name.normalize("NFC")] ?? "Notice";
    plan.push({ file, productId: product.id, slug: product.slug, key: `${product.slug}/${fileName}`, label });
    console.log(`+ ${product.slug.padEnd(22)} ${JSON.stringify(label).padEnd(34)} ${file.name}`);
  }

  console.log(`\n${plan.length} notice(s) à ajouter.`);
  if (!APPLY || plan.length === 0) return;

  // Télécharge et valide tous les PDF avant d'écrire dans R2 ou dans la base.
  const bodies: Buffer[] = [];
  for (const item of plan) bodies.push(await download(item.file));

  const { client, bucket } = getR2Bucket("notices");
  for (const [index, item] of plan.entries()) {
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: item.key,
      Body: bodies[index],
      ContentType: "application/pdf",
    }));
  }

  const nextPosition = new Map(
    products.map((p) => [p.id, Math.max(-1, ...p.notices.map((n) => n.position)) + 1]),
  );
  await prisma.notice.createMany({
    data: plan.map((item) => {
      const position = nextPosition.get(item.productId)!;
      nextPosition.set(item.productId, position + 1);
      return { productId: item.productId, label: item.label, url: publicUrlFor("notices", item.key), position };
    }),
  });
  console.log(`Import terminé : ${plan.length} notice(s) déposées dans R2 et ajoutées aux fiches.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
