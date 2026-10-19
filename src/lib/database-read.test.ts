import assert from "node:assert/strict";
import test from "node:test";
import { readDatabase } from "./database-read";

test("reprend une lecture après une coupure temporaire du pilote", async () => {
  let calls = 0;
  const result = await readDatabase(async () => {
    calls++;
    if (calls === 1) throw { clientVersion: "6.19.3", error: { code: "ECONNRESET" } };
    return ["produit"];
  });
  assert.deepEqual(result, ["produit"]);
  assert.equal(calls, 2);
});

test("reprend une lecture après une erreur HTTPS de Neon", async () => {
  let calls = 0;
  const result = await readDatabase(async () => {
    calls++;
    if (calls === 1) throw { name: "NeonDbError", sourceError: new TypeError("fetch failed") };
    return 29;
  });
  assert.equal(result, 29);
  assert.equal(calls, 2);
});

test("ne rejoue pas une erreur de requête ou de schéma", async () => {
  for (const code of ["P2002", "P2021", "23505", "42703"]) {
    let calls = 0;
    const error = Object.assign(new Error("Requête invalide"), { code });
    await assert.rejects(readDatabase(async () => {
      calls++;
      throw error;
    }), (caught) => caught === error);
    assert.equal(calls, 1);
  }
});

test("reconnaît une erreur de connexion Neon dont la cause a été sérialisée", async () => {
  let calls = 0;
  const result = await readDatabase(async () => {
    calls++;
    if (calls === 1) throw { name: "NeonDbError", clientVersion: "6.19.3", message: "Error connecting to database: TypeError: fetch failed" };
    return "OK";
  });
  assert.equal(result, "OK");
  assert.equal(calls, 2);
});

test("limite les tentatives et conserve l’erreur en cas de panne persistante", async () => {
  let calls = 0;
  const error = Object.assign(new Error("Connexion interrompue"), { code: "ETIMEDOUT" });
  await assert.rejects(readDatabase(async () => {
    calls++;
    throw error;
  }), (caught) => caught === error);
  assert.equal(calls, 3);
});
