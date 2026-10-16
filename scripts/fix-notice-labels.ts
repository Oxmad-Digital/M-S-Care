// Script ponctuel : renomme les notices « Notice » avec le libellé du dosage
// correspondant, déduit du nombre présent dans le nom de fichier de l'URL.
//
//   npx tsx scripts/fix-notice-labels.ts           -> simulation (aucune écriture)
//   npx tsx scripts/fix-notice-labels.ts --apply   -> écrit les nouveaux libellés
//
// Ne modifie que Notice.label. Ne crée ni ne supprime aucune notice.
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const APPLY = process.argv.includes("--apply");

// Nombre entier ou décimal, isolé : précédé du début ou d'un séparateur, suivi
// de la fin, d'un séparateur ou d'une unité. « 5 » ne matche donc ni « 50 » ni « 15 ».
const NUMBER_IN_FILENAME =
  /(?:^|[-_.\s])(\d+(?:[.,]\d+)?)(?=$|[-_.\s]|(?:mg|g|ml|mcg|µg|ui|iu)(?:$|[-_.\s]))/gi;

const normalizeNumber = (raw: string) => String(Number(raw.replace(",", ".")));

// Le nombre principal d'un dosage est le premier : « 200mg/5ml » -> 200.
function dosageNumber(dosage: string): string | null {
  const match = dosage.match(/\d+(?:[.,]\d+)?/);
  return match ? normalizeNumber(match[0]) : null;
}

function urlNumbers(url: string): Set<string> {
  let filename: string;
  try {
    const path = new URL(url).pathname;
    filename = decodeURIComponent(path.slice(path.lastIndexOf("/") + 1));
  } catch {
    return new Set();
  }
  filename = filename.replace(/\.[a-z0-9]+$/i, "");
  return new Set(
    [...filename.matchAll(NUMBER_IN_FILENAME)].map((m) => normalizeNumber(m[1])),
  );
}

type Plan = { id: string; url: string; before: string; after: string }[];

function planProduct(
  dosages: string[],
  notices: { id: string; label: string; url: string }[],
): { plan: Plan } | { reason: string } {
  const numbers = dosages.map(dosageNumber);
  const missing = dosages.filter((_, i) => numbers[i] === null);
  if (missing.length) {
    return { reason: `dosage sans nombre : ${missing.join(", ")}` };
  }
  const duplicated = numbers.filter((n, i) => numbers.indexOf(n) !== i);
  if (duplicated.length) {
    return { reason: `plusieurs dosages ont le même nombre (${[...new Set(duplicated)].join(", ")})` };
  }

  const noticeNumbers = notices.map((n) => urlNumbers(n.url));
  const assignment = new Map<string, string>(); // notice.id -> dosage
  const problems: string[] = [];

  dosages.forEach((dosage, i) => {
    const candidates = notices.filter((_, j) => noticeNumbers[j].has(numbers[i]!));
    if (candidates.length === 0) {
      problems.push(`aucune URL ne contient « ${numbers[i]} » (dosage ${dosage})`);
    } else if (candidates.length > 1) {
      problems.push(`${candidates.length} URLs contiennent « ${numbers[i]} » (dosage ${dosage})`);
    } else if (assignment.has(candidates[0].id)) {
      problems.push(`l'URL ${candidates[0].url} correspond à plusieurs dosages`);
    } else {
      assignment.set(candidates[0].id, dosage);
    }
  });

  const unmatched = notices.filter((n) => !assignment.has(n.id));
  if (!problems.length && unmatched.length) {
    problems.push(
      `notice(s) sans dosage correspondant : ${unmatched.map((n) => n.url).join(", ")}`,
    );
  }
  if (problems.length) return { reason: problems.join(" ; ") };

  return {
    plan: notices.map((n) => ({
      id: n.id,
      url: n.url,
      before: n.label,
      after: assignment.get(n.id)!,
    })),
  };
}

async function main() {
  const products = await prisma.product.findMany({
    orderBy: { order: "asc" },
    select: {
      name: true,
      dosages: true,
      notices: {
        orderBy: { position: "asc" },
        select: { id: true, label: true, url: true },
      },
    },
  });

  console.log(APPLY ? "MODE --apply : écriture en base\n" : "MODE SIMULATION : rien n'est écrit\n");

  const updates: { id: string; label: string }[] = [];
  const skipped: { name: string; reason: string }[] = [];

  for (const product of products) {
    if (product.dosages.length < 2 || product.notices.length < 2) {
      skipped.push({
        name: product.name,
        reason: `non concerné (${product.dosages.length} dosage(s), ${product.notices.length} notice(s))`,
      });
      continue;
    }

    const result = planProduct(product.dosages, product.notices);
    if ("reason" in result) {
      skipped.push({ name: product.name, reason: result.reason });
      continue;
    }

    console.log(`■ ${product.name}`);
    for (const row of result.plan) {
      const changed = row.before !== row.after;
      console.log(
        `   ${JSON.stringify(row.before).padEnd(14)} -> ${JSON.stringify(row.after).padEnd(14)} ${changed ? "" : "(inchangé) "}${row.url}`,
      );
      if (changed) updates.push({ id: row.id, label: row.after });
    }
    console.log();
  }

  console.log("Produits ignorés :");
  if (skipped.length === 0) console.log("   (aucun)");
  for (const s of skipped) console.log(`   - ${s.name} : ${s.reason}`);
  console.log();

  if (!APPLY) {
    console.log(`${updates.length} libellé(s) seraient modifiés. Relancer avec --apply pour écrire.`);
    return;
  }

  await prisma.$transaction(
    updates.map((u) =>
      prisma.notice.update({ where: { id: u.id }, data: { label: u.label } }),
    ),
  );
  console.log(`${updates.length} libellé(s) modifiés.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
