import { PrismaClient, ProductCategory } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const NOTICE_URL =
  "https://www.notion.so/320ec75d765080248dabc090a6b5a5b6?v=320ec75d7650808a8c8d000c5e9401ff&source=copy_link";

type RawProduct = {
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
  imageUrl: string;
  notices?: { label: string; url: string }[];
};

const PRODUCTS: RawProduct[] = [
  {
    slug: "amdicare",
    name: "AmdiCare",
    category: ProductCategory.MEDICAMENT,
    principeActif: "Amlodipine BP",
    dosages: ["5mg", "10mg"],
    forme: "Comprimé non pelliculé",
    conditionnement: "Boîte de 3×10",
    classe: "Antihypertenseur",
    indications: "Hypertension artérielle, Angor",
    imageUrl: "/images/products/amdicare.png",
  },
  {
    slug: "aldacare",
    name: "Aldacare",
    category: ProductCategory.OTC,
    principeActif: "Albendazole",
    dosages: ["200mg/5ml", "400mg"],
    forme: "Suspension buvable, comprimé à croquer",
    conditionnement: "Flacon de 10ml, boîte de 1",
    classe: "Antiparasitaire, Antihelminthiques",
    indications: "Déparasitage",
    flavor: "Fruité, vanille & orange",
    imageUrl: "/images/products/aldacare.png",
    notices: [
      {
        label: "Notice",
        url: "https://pub-7b3c282200ff4b619ea4795ce9f25bb7.r2.dev/aldacare-200.pdf",
      },
    ],
  },
  {
    slug: "azithcare",
    name: "Azithcare",
    category: ProductCategory.MEDICAMENT,
    principeActif: "Azithromycine USP",
    dosages: ["500mg"],
    forme: "Comprimé pelliculé sécable",
    conditionnement: "Boîte de 1×3",
    classe: "Antibactérien de la famille des macrolides",
    indications: "Infections ORL, infections stomatologiques",
    imageUrl: "/images/products/azithcare.png",
  },
  {
    slug: "cotrimcare",
    name: "Cotrimcare",
    category: ProductCategory.MEDICAMENT,
    principeActif: "Sulfamethoxazole et trimethoprime",
    dosages: ["240mg/5ml"],
    forme: "Suspension buvable",
    conditionnement: "Flacon de 100ml",
    classe: "Antibactérien de la famille des diaminopyrimidines",
    indications:
      "Infections des voies urinaires, infections pulmonaires, gastro-intestinales",
    flavor: "Goût fraise",
    imageUrl: "/images/products/cotrimcare.png",
  },
  {
    slug: "cefixcare",
    name: "Cefixcare",
    category: ProductCategory.MEDICAMENT,
    principeActif: "Cefixime trihydrate",
    dosages: ["40mg/5ml", "100mg/5ml", "200mg"],
    forme: "Poudre pour suspension buvable et comprimé pelliculé",
    conditionnement: "Flacon de 60ml et boite de 1×10",
    classe:
      "Antibactériens de la famille des bêtalactamines du groupe des céphalosporines de 3e génération",
    indications: "Infections à germes sensibles",
    flavor: "Mangue",
    imageUrl: "/images/products/cefixcare.png",
  },
  {
    slug: "ceftricare",
    name: "Ceftricare",
    category: ProductCategory.MEDICAMENT,
    principeActif: "Ceftriaxone USP",
    dosages: ["1g / 10ml"],
    forme: "Poudre et solvant pour solution injectable",
    conditionnement: "Boîte de 1",
    classe:
      "Antibactériens de la famille des bêtalactamines du groupe des céphalosporines de 3e génération",
    indications: "Infections à germes sensibles",
    imageUrl: "/images/products/ceftricare.png",
  },
  {
    slug: "ciflocare",
    name: "Ciflocare",
    category: ProductCategory.MEDICAMENT,
    principeActif: "Ciprofloxacine USP",
    dosages: ["500mg"],
    forme: "Comprimé pelliculé",
    conditionnement: "Boîte de 10×10",
    classe: "Antibactérien de la famille des fluoroquinolones",
    indications:
      "Infections gastro-intestinales, infections ORL, infections uro-génitales, infections cutanés et infections osseuses",
    imageUrl: "/images/products/ciflocare.png",
  },
  {
    slug: "fizzcare-paracetamol",
    name: "Fizzcare paracetamol",
    category: ProductCategory.OTC,
    principeActif: "Paracetamol",
    dosages: ["500mg", "1000mg"],
    forme: "Comprimé effervescent",
    conditionnement: "Boîte de 48 comprimés",
    classe: "Antalgique antipyrétique",
    indications: "Douleurs et fièvre",
    imageUrl: "/images/products/fizzcare-paracetamol.png",
  },
  {
    slug: "ibucare",
    name: "Ibucare",
    category: ProductCategory.OTC,
    principeActif: "Ibuprofene BP",
    dosages: ["100mg/5ml", "200mg", "400mg"],
    forme: "Suspension buvable et comprimé pelliculé",
    conditionnement: "Flacon de 100ml, boite de 10×10",
    classe: "Anti-inflammatoires non stéroidiens",
    indications: "Traitements des inflammations, douleurs et fièvre",
    flavor: "Orange",
    imageUrl: "/images/products/ibucare.png",
  },
];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "ADMIN_EMAIL et ADMIN_PASSWORD doivent être définis (dans .env ou en variables d'environnement) avant de lancer le seed.",
    );
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: { email: adminEmail, passwordHash, name: "Administrateur" },
  });

  for (const [index, product] of PRODUCTS.entries()) {
    const { notices = [{ label: "Notice", url: NOTICE_URL }], ...fields } = product;
    const noticeData = notices.map((notice, position) => ({ ...notice, position }));
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        ...fields,
        order: index,
        notices: { deleteMany: {}, create: noticeData },
      },
      create: { ...fields, order: index, notices: { create: noticeData } },
    });
  }

  console.log(`Seed terminé : 1 admin (${adminEmail}) + ${PRODUCTS.length} produits.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
