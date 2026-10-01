import { test } from "node:test";
import assert from "node:assert/strict";
import { countries } from "./countries.ts";
import { matchTyped } from "./match.ts";

const get = (code: string) => countries.find((c) => c.code === code)!;

test("typed names match with accents, case and small typos", () => {
  assert.equal(matchTyped("turkiye", get("TUR"), countries), "TUR");
  assert.equal(matchTyped("TÜRKİYE", get("TUR"), countries), "TUR");
  assert.equal(matchTyped("Fildişi Sahili", get("CIV"), countries), "CIV");
  assert.equal(matchTyped("argentna", get("ARG"), countries), "ARG");
});

test("another country's exact name is a wrong pick, gibberish is nothing", () => {
  assert.equal(matchTyped("France", get("TUR"), countries), "FRA");
  assert.equal(matchTyped("xyz", get("TUR"), countries), null);
  assert.equal(matchTyped("  ", get("TUR"), countries), null);
  // Short names get no typo allowance
  assert.equal(matchTyped("Chad", get("PER"), countries), "TCD");
  assert.equal(matchTyped("Pera", get("PER"), countries), null);
});
