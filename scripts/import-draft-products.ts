// Script ponctuel : crée en brouillon les produits du dossier local « Notices_web »
// qui n'ont pas encore de fiche. Les données viennent du contenu des notices.
//
//   npx tsx scripts/import-draft-products.ts <dossier>           -> simulation (aucune écriture)
//   npx tsx scripts/import-draft-products.ts <dossier> --apply   -> R2 + base
//
// Une fiche dont le slug existe déjà est ignorée : le script peut être relancé.
import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { ProductCategory } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { getR2Bucket, publicUrlFor, slugifyFileName } from "../src/lib/r2";

const APPLY = process.argv.includes("--apply");
const DIRECTORY = process.argv.slice(2).find((arg) => !arg.startsWith("--"));

// Aucune photo disponible pour ces produits : le logo tient lieu d'image en attendant.
const PLACEHOLDER_IMAGE = "/images/logo.png";

type Draft = {
  slug: string;
  name: string;
  category: ProductCategory;
  principeActif: string;
  dosages: string[];
  forme: string;
  conditionnement: string;
  classe: string;
  indications: string;
  flavor?: string;
  // Dosage (ou « Notice » sans dosage) -> fichier.
  notices: Record<string, string>;
};

const { MEDICAMENT, OTC, SUPPLEMENT } = ProductCategory;

const DRAFTS: Draft[] = [
  { slug: "acidocare", name: "AcidoCare", category: OTC, principeActif: "Hydroxyde d’aluminium, hydroxyde de magnésium, siméticone", dosages: [], forme: "Suspension buvable", conditionnement: "Flacon de 170ml", classe: "Anti-acides", indications: "Brûlures d’estomac et remontées acides", notices: { Notice: "N_web_Acido Care_170 ML_suspension buvable.pdf" } },
  { slug: "acyclocare", name: "AcycloCare", category: MEDICAMENT, principeActif: "Aciclovir", dosages: ["200mg"], forme: "Comprimé non pelliculé", conditionnement: "Boîte de 10×10", classe: "Antiviral", indications: "Infections dues au virus Herpes simplex de la peau et des muqueuses", notices: { "200mg": "N_web_AcycloCare_200 mg_comprimé non pelliculé_10x10.pdf" } },
  { slug: "carbocicare", name: "CarbociCare", category: OTC, principeActif: "Carbocistéine BP", dosages: ["5%"], forme: "Sirop adultes", conditionnement: "Flacon de 100ml", classe: "Mucolytique", indications: "Toux grasse récente avec difficulté à expectorer", flavor: "Caramel", notices: { "5%": "N_web_CarbociCare _5%_Adultes_ sirop_100 ML.pdf" } },
  { slug: "cefpodocare", name: "CefpodoCare", category: MEDICAMENT, principeActif: "Cefpodoxime proxétil USP", dosages: ["200mg"], forme: "Comprimé pelliculé", conditionnement: "Boîte de 1×10", classe: "Antibactérien de la famille des céphalosporines", indications: "Sinusite, infection bronchique aiguë des patients présentant une bronchite chronique, pneumonie", notices: { "200mg": "N_web_Cefpodo Care_200 mg_comprimé pelliculé_1x10.pdf" } },
  { slug: "cetiricare", name: "CetiriCare", category: MEDICAMENT, principeActif: "Dichlorhydrate de cétirizine BP", dosages: ["1mg/ml"], forme: "Sirop", conditionnement: "Flacon de 100ml", classe: "Antihistaminique", indications: "Traitement de l’allergie", flavor: "Ananas", notices: { "1mg/ml": "N_web_Cetiri Care_1 mg:ml,_sirop_100ML.pdf" } },
  { slug: "chlorphenicare", name: "ChlorpheniCare", category: MEDICAMENT, principeActif: "Maléate de chlorphénamine BP", dosages: ["2mg/5ml"], forme: "Solution buvable", conditionnement: "Flacon de 100ml", classe: "Antihistaminique inhibiteur des récepteurs H1", indications: "Rhinite allergique, urticaire, œdème angioneurotique, allergies alimentaires, piqûres d’insectes, démangeaisons associées à la varicelle", flavor: "Mangue", notices: { "2mg/5ml": "N_web_Chlorpheni Care_2 mg:5 ml_solution buvable_100 ML.pdf" } },
  { slug: "chlorure-de-sodium", name: "Chlorure de sodium", category: MEDICAMENT, principeActif: "Chlorure de sodium BP", dosages: ["0,9%"], forme: "Solution pour perfusion", conditionnement: "Flacon de 500ml", classe: "Solutions d’électrolytes", indications: "Rééquilibration ionique, déshydratation extracellulaire, hypovolémie, véhicule ou diluant de médicaments compatibles", notices: { "0,9%": "N_web_Chlorure de sodium 0,9%_solution perf.pdf" } },
  { slug: "clotricare", name: "ClotriCare", category: OTC, principeActif: "Clotrimazole USP", dosages: ["1%"], forme: "Crème", conditionnement: "Tube de 20g", classe: "Antifongique à usage topique", indications: "Infections dermiques : pied d’athlète, eczéma marginé de Hebra, tinea corporis", notices: { "1%": "N_web_ClotriCare 1%_Crème.pdf" } },
  { slug: "cobixcare", name: "CobixCare", category: MEDICAMENT, principeActif: "Célécoxib", dosages: ["200mg"], forme: "Gélule", conditionnement: "Boîte de 3×10", classe: "Anti-inflammatoire non stéroïdien, coxibs", indications: "Arthrose, polyarthrite rhumatoïde et spondylarthrite ankylosante", notices: { "200mg": "N_web_Cobix Care 200 mg.pdf" } },
  { slug: "diclocare", name: "DicloCare", category: OTC, principeActif: "Diclofénac de diéthylamine", dosages: ["1%"], forme: "Gel", conditionnement: "Tube de 30g", classe: "Anti-inflammatoire non stéroïdien à usage topique", indications: "Entorses, contusions, douleurs musculaires et tendino-ligamentaires, poussées douloureuses de l’arthrose", notices: { "1%": "N_web_DicloCare gel 1%.pdf" } },
  { slug: "dompericare", name: "DomperiCare", category: MEDICAMENT, principeActif: "Dompéridone", dosages: ["1mg/ml"], forme: "Suspension buvable", conditionnement: "Flacon de 30ml ou 60ml", classe: "Stimulant de la motricité intestinale", indications: "Nausées et vomissements chez l’adulte et l’adolescent", flavor: "Framboise", notices: { "1mg/ml": "N_web_Domperi Care_1 mg:ml_suspension.pdf" } },
  { slug: "esopracare", name: "EsopraCare", category: MEDICAMENT, principeActif: "Ésoméprazole magnésique trihydraté USP", dosages: ["20mg"], forme: "Gélule à libération retardée", conditionnement: "Boîte de 14", classe: "Inhibiteur de la pompe à protons", indications: "Reflux gastro-œsophagien", notices: { "20mg": "N_web_Esopra Care 20mg_gélule.pdf" } },
  { slug: "fizzcare-cal-c", name: "FizzCare Cal C", category: SUPPLEMENT, principeActif: "Gluconolactate de calcium, vitamine C", dosages: ["1000mg"], forme: "Comprimé effervescent", conditionnement: "Boîte de 2×4", classe: "Fortifiants", indications: "États de fatigue", flavor: "Orange", notices: { "1000mg": "N_web_Fizz Care_Cal C 1000 MG_Strip 2x4 comprimés effervescent-NEW.pdf" } },
  { slug: "furocare", name: "FuroCare", category: MEDICAMENT, principeActif: "Furosémide", dosages: ["40mg"], forme: "Comprimé non pelliculé", conditionnement: "Boîte de 100", classe: "Diurétique de l’anse", indications: "Œdèmes d’origine cardiaque, rénale ou hépatique", notices: { "40mg": "N_web_Furos Care 40 mg.pdf" } },
  { slug: "gentacare", name: "GentaCare", category: MEDICAMENT, principeActif: "Gentamicine", dosages: ["0,3%"], forme: "Collyre", conditionnement: "Flacon de 5ml", classe: "Antibiotique", indications: "Infections bactériennes de l’œil, prévention des infections d’un œil blessé", notices: { "0,3%": "N_web_Genta Care 5ml.pdf" } },
  { slug: "glimepicare", name: "GlimepiCare", category: MEDICAMENT, principeActif: "Glimépiride USP", dosages: ["2mg", "4mg"], forme: "Comprimé non pelliculé", conditionnement: "Boîte de 3×10", classe: "Antidiabétique oral, sulfonylurées", indications: "Diabète de type 2", notices: { "2mg": "N_web_Glimepi Care_2 mg_comprimé non pelliculé.pdf", "4mg": "N_web_Glimepi Care_4 mg_comprimé non pelliculé.pdf" } },
  { slug: "glucose", name: "Glucose", category: MEDICAMENT, principeActif: "Glucose anhydre BP", dosages: ["5%"], forme: "Solution pour perfusion", conditionnement: "Flacon de 500ml", classe: "Solutions intraveineuses", indications: "Apport calorique glucidique modéré, prévention des déshydratations, réhydratation, prévention et traitement de la cétose dans les dénutritions", notices: { "5%": "N_web_Glucose 5%-5D 500ml_solution perf.pdf" } },
  { slug: "hydroxincare", name: "HydroxinCare", category: MEDICAMENT, principeActif: "Chlorhydrate d’hydroxyzine", dosages: ["25mg"], forme: "Comprimé pelliculé", conditionnement: "Boîte de 3×10", classe: "Anxiolytique", indications: "Manifestations mineures d’anxiété chez l’adulte, prémédication avant anesthésie générale, prurit, certaines insomnies de l’enfant de plus de 6 ans", notices: { "25mg": "N_web_Hydroxine Care_25mg_3x10 comprimes pellicules.pdf" } },
  { slug: "levonorcare", name: "LevonorCare", category: MEDICAMENT, principeActif: "Lévonorgestrel BP", dosages: ["1,5mg"], forme: "Comprimé pelliculé", conditionnement: "Boîte de 1", classe: "Contraception d’urgence orale", indications: "Contraception d’urgence, après un rapport sexuel non protégé ou en cas d’échec de la méthode de contraception", notices: { "1,5mg": "N_web_Levenor Care 1,5 mg.pdf" } },
  { slug: "metcare", name: "MetCare", category: MEDICAMENT, principeActif: "Chlorhydrate de metformine", dosages: ["500mg", "850mg", "1000mg"], forme: "Comprimé pelliculé", conditionnement: "Boîte de 10×10 ou 3×10", classe: "Antidiabétique oral, biguanides", indications: "Diabète de type 2", notices: { "500mg": "N_web_MetCare 500-850 & 1000 mg_comprimé.pdf", "850mg": "N_web_MetCare 500-850 & 1000 mg_comprimé.pdf", "1000mg": "N_web_MetCare 500-850 & 1000 mg_comprimé.pdf" } },
  { slug: "mycocare", name: "MycoCare", category: MEDICAMENT, principeActif: "Nitrate de miconazole BP", dosages: ["2%"], forme: "Crème", conditionnement: "Tube de 15g ou 30g", classe: "Antifongique", indications: "Infections de la peau ou des ongles causées par des champignons ou des levures", notices: { "2%": "N_web_MycoCare 2%_15g_crème.pdf" } },
  { slug: "naprilcare", name: "NaprilCare", category: MEDICAMENT, principeActif: "Maléate d’énalapril USP", dosages: ["5mg", "10mg"], forme: "Comprimé non pelliculé", conditionnement: "Boîte de 10×10 (5mg), boîte de 3×10 (10mg)", classe: "Inhibiteur de l’enzyme de conversion", indications: "Hypertension artérielle, insuffisance cardiaque", notices: { "5mg": "N_web_NaprilCare 5 mg.pdf", "10mg": "N_web_Napril care 10 mg.pdf" } },
  { slug: "nystacare", name: "NystaCare", category: MEDICAMENT, principeActif: "Nystatine", dosages: ["100 000 UI/ml"], forme: "Suspension buvable", conditionnement: "Flacon de 30ml", classe: "Antimycosique", indications: "Candidose buccale, infections fongiques buccales et péribuccales", flavor: "Framboise", notices: { "100 000 UI/ml": "N_web_NystaCare_100 000 UL-ml_suspension buvable_30ML.pdf" } },
  { slug: "omepracare", name: "OmepraCare", category: MEDICAMENT, principeActif: "Oméprazole USP", dosages: ["20mg"], forme: "Gélule gastro-résistante", conditionnement: "Boîte de 10×10", classe: "Inhibiteur de la pompe à protons", indications: "Reflux gastro-œsophagien, ulcères", notices: { "20mg": "N_web_Omepra Care.pdf" } },
  { slug: "puricare", name: "PuriCare", category: MEDICAMENT, principeActif: "Allopurinol USP", dosages: ["100mg"], forme: "Comprimé non pelliculé", conditionnement: "Boîte de 3×10", classe: "Antigoutteux", indications: "Goutte, prévention des dépôts d’urate et d’acide urique, certains calculs rénaux", notices: { "100mg": "N_web_Puri care 100 mg_100x200_web copie.pdf" } },
  { slug: "salbucare", name: "SalbuCare", category: MEDICAMENT, principeActif: "Salbutamol", dosages: ["100µg/dose"], forme: "Suspension pour inhalation en flacon pressurisé", conditionnement: "Flacon de 200 doses", classe: "Bronchodilatateur bêta-2 mimétique", indications: "Crise d’asthme, gêne respiratoire de la maladie asthmatique, prévention de l’asthme d’effort", notices: { "100µg/dose": "N_web_Sablu Care_suspension inhalation.pdf" } },
  { slug: "tadalacare", name: "TadalaCare", category: MEDICAMENT, principeActif: "Tadalafil USP", dosages: ["20mg"], forme: "Comprimé pelliculé", conditionnement: "Boîte de 4", classe: "Médicament de la dysfonction érectile", indications: "Dysfonction érectile de l’homme adulte", notices: { "20mg": "N_web_Tadala Care_20 mg_comprimé pelliculé.pdf" } },
  { slug: "terbicare", name: "TerbiCare", category: MEDICAMENT, principeActif: "Chlorhydrate de terbinafine", dosages: ["1%"], forme: "Crème", conditionnement: "Tube de 15g", classe: "Antifongique topique de la famille des allylamines", indications: "Mycoses cutanées : pied d’athlète, dermatophyties, candidoses cutanées, pityriasis versicolor", notices: { "1%": "N_web_Terbi Care_1%_creme.pdf" } },
];

async function main() {
  if (!DIRECTORY) throw new Error("Indiquer le dossier des notices.");
  console.log(APPLY ? "MODE --apply : R2 + base\n" : "MODE SIMULATION : rien n'est écrit\n");

  const existing = await prisma.product.findMany({ select: { slug: true, order: true } });
  const slugs = new Set(existing.map((p) => p.slug));
  let order = Math.max(-1, ...existing.map((p) => p.order)) + 1;

  const drafts = DRAFTS.filter((draft) => !slugs.has(draft.slug));

  // Lit et valide tous les PDF avant d'écrire dans R2 ou dans la base.
  const puts = new Map<string, Buffer>();
  for (const draft of drafts) {
    for (const [label, file] of Object.entries(draft.notices)) {
      if (label !== "Notice" && !draft.dosages.includes(label)) throw new Error(`${draft.slug} : dosage inconnu ${label}`);
      const body = readFileSync(join(DIRECTORY, file));
      if (body.subarray(0, 5).toString() !== "%PDF-") throw new Error(`${file} : ce n'est pas un PDF`);
      puts.set(`${draft.slug}/${slugifyFileName(file)}`, body);
    }
    const dosagesWithoutNotice = draft.dosages.filter((dosage) => !draft.notices[dosage]);
    if (dosagesWithoutNotice.length) throw new Error(`${draft.slug} : sans notice pour ${dosagesWithoutNotice.join(", ")}`);
    console.log(`+ ${draft.slug.padEnd(20)} ${draft.category.padEnd(11)} ${draft.dosages.join(", ") || "(sans dosage)"}`);
  }

  console.log(`\n${drafts.length} brouillon(s) à créer, ${puts.size} fichier(s) à déposer.`);
  if (!APPLY) return;

  const { client, bucket } = getR2Bucket("notices");
  for (const [key, body] of puts) {
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: "application/pdf" }));
  }

  for (const { notices, flavor, ...draft } of drafts) {
    await prisma.product.create({
      data: {
        ...draft,
        flavor: flavor ?? null,
        imageUrl: PLACEHOLDER_IMAGE,
        published: false,
        order: order++,
        notices: {
          create: Object.entries(notices).map(([label, file], position) => ({
            label,
            url: publicUrlFor("notices", `${draft.slug}/${slugifyFileName(file)}`),
            position,
          })),
        },
      },
    });
  }
  console.log("Import terminé.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
