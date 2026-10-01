import { test } from "node:test";
import assert from "node:assert/strict";
import { offBy } from "./geo.ts";

test("distance and map direction between two points", () => {
  // Paris to Istanbul is about 2,250 km, east and a bit south
  const { km, deg } = offBy([2.35, 48.86], [28.98, 41.01]);
  assert.ok(Math.abs(km - 2250) < 30, `km ${km}`);
  assert.ok(deg > 90 && deg < 120, `deg ${deg}`);
  assert.equal(offBy([0, 0], [0, 10]).deg, 0);
  assert.equal(offBy([0, 0], [-10, 0]).deg, 270);
});
