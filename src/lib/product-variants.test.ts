import assert from "node:assert/strict";
import test from "node:test";
import { imageForDosage, matchDosageNotices, normalizeDosage, productHref, resolveDosage } from "./product-variants";
import type { CatalogueProduct } from "./types";

const product: CatalogueProduct = {
  id: "p1",
  slug: "ibucare",
  name: "Ibucare",
  category: "MEDICAMENT",
  principeActif: "Ibuprofène",
  dosages: ["200 mg", "400 mg"],
  forme: "Comprimé",
  conditionnement: "Boîte de 20",
  classe: "AINS",
  indications: "Douleurs",
  flavor: null,
  imageUrl: "/images/products/ibucare.png",
  notices: [],
  variants: [{ dosage: "400mg", imageUrl: "/images/products/variants/ibucare-400mg.png" }],
};

test("normalizeDosage ignore espaces et casse", () => {
  assert.equal(normalizeDosage(" 100 MG / 5 ml "), "100mg/5ml");
});

test("resolveDosage retrouve le dosage demandé quelle que soit sa saisie", () => {
  assert.equal(resolveDosage(product, "400MG"), "400 mg");
});

test("resolveDosage retombe sur le premier dosage si inconnu ou absent", () => {
  assert.equal(resolveDosage(product, "999 mg"), "200 mg");
  assert.equal(resolveDosage(product, null), "200 mg");
  assert.equal(resolveDosage(product, ""), "200 mg");
});

test("resolveDosage renvoie null pour un produit sans dosage", () => {
  assert.equal(resolveDosage({ ...product, dosages: [] }, "200 mg"), null);
});

test("imageForDosage utilise l’image de la variante ou celle du produit", () => {
  assert.equal(imageForDosage(product, "400 mg"), "/images/products/variants/ibucare-400mg.png");
  assert.equal(imageForDosage(product, "200 mg"), product.imageUrl);
  assert.equal(imageForDosage(product, null), product.imageUrl);
});

test("productHref encode le slug et le dosage", () => {
  assert.equal(productHref(product, null), "/produits/ibucare");
  assert.equal(productHref(product, "400 mg"), "/produits/ibucare?dosage=400+mg");
  assert.equal(productHref({ ...product, slug: "a b" }, "100mg/5ml"), "/produits/a%20b?dosage=100mg%2F5ml");
});

test("matchDosageNotices relie chaque dosage à sa notice et garde les autres", () => {
  const notices = [
    { label: "200mg", url: "a" },
    { label: "Notice générale", url: "b" },
    { label: "200 mg", url: "c" },
  ];
  const { byDosage, otherNotices } = matchDosageNotices({ dosages: product.dosages, notices });
  assert.equal(byDosage.get("200 mg"), notices[0]);
  assert.equal(byDosage.has("400 mg"), false);
  assert.deepEqual(otherNotices, [notices[1], notices[2]]);
});
