import assert from "node:assert/strict";
import test from "node:test";
import { formatProductName } from "./product-name";

test("formatProductName met une majuscule au C de Care", () => {
  assert.equal(formatProductName("Aldacare"), "AldaCare");
  assert.equal(formatProductName("AmdiCare"), "AmdiCare");
  assert.equal(formatProductName("Fizzcare vitamine C"), "FizzCare vitamine C");
  assert.equal(formatProductName("KofcarePhyto sirop"), "KofCarePhyto sirop");
  assert.equal(formatProductName("LosarcareH"), "LosarCareH");
});

test("formatProductName ne touche pas aux noms sans préfixe", () => {
  assert.equal(formatProductName("SRO"), "SRO");
  assert.equal(formatProductName("care"), "care");
});
