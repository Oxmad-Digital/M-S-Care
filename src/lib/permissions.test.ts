import assert from "node:assert/strict";
import test from "node:test";
import { can, isRole, ROLES, ROLE_LABEL, ROLE_DESCRIPTION } from "./permissions";

test("l’administrateur a tous les droits", () => {
  for (const permission of ["edit", "delete", "manage"] as const) assert.equal(can("ADMIN", permission), true);
});

test("le membre modifie mais ne supprime pas et ne gère pas l’équipe", () => {
  assert.equal(can("MEMBER", "edit"), true);
  assert.equal(can("MEMBER", "delete"), false);
  assert.equal(can("MEMBER", "manage"), false);
});

test("le visiteur ne peut rien modifier", () => {
  for (const permission of ["edit", "delete", "manage"] as const) assert.equal(can("VIEWER", permission), false);
});

test("isRole n’accepte que les rôles connus", () => {
  for (const role of ROLES) assert.equal(isRole(role), true);
  for (const value of ["admin", "OWNER", "", null, undefined, 1, {}]) assert.equal(isRole(value), false);
});

test("chaque rôle a un libellé et une description", () => {
  for (const role of ROLES) {
    assert.ok(ROLE_LABEL[role]);
    assert.ok(ROLE_DESCRIPTION[role]);
  }
});
