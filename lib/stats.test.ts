import { test } from "node:test";
import assert from "node:assert/strict";
import { newGame, reducer, type Action } from "./game.ts";
import { hardest, recordGame, emptyStats } from "./stats.ts";

const play = (queue: string[], actions: Action[], opts = {}) => actions.reduce(reducer, newGame(queue, 0, opts));

test("misses add up and a clean find takes one off", () => {
  const g1 = play(["TUR", "FRA"], [{ type: "answer", code: "DEU" }, { type: "answer", code: "DEU" }, { type: "hint" }]);
  const s1 = recordGame(emptyStats, g1, "k");
  assert.deepEqual(s1, { misses: { TUR: 2 }, best: {} });

  const g2 = play(["TUR"], [{ type: "answer", code: "TUR" }, { type: "next", now: 1 }]);
  const s2 = recordGame(s1, g2, "k");
  assert.deepEqual(s2, { misses: { TUR: 1 }, best: { k: 100 } });
  assert.deepEqual(recordGame(s2, g2, "k").misses, {});
});

test("best score keeps the maximum and ignores practice rounds", () => {
  const timed = play(["A", "B"], [{ type: "answer", code: "A" }, { type: "next", now: 1 }, { type: "timeUp", now: 2 }], { timeLimit: 60_000 });
  const s = recordGame({ misses: {}, best: { t: 3 } }, timed, "t");
  assert.equal(s.best.t, 3);
  assert.equal(recordGame({ misses: {}, best: { t: 0 } }, timed, "t").best.t, 1);
  const practice = play(["A"], [{ type: "answer", code: "A" }, { type: "next", now: 1 }], { practice: true });
  assert.deepEqual(recordGame(emptyStats, practice, "p").best, {});
});

test("hardest sorts by misses within the pool", () => {
  const stats = { misses: { A: 1, B: 5, C: 3, D: 9 }, best: {} };
  assert.deepEqual(hardest(stats, ["A", "B", "C"], 2), ["B", "C"]);
});
