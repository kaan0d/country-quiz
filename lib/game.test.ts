import { test } from "node:test";
import assert from "node:assert/strict";
import { newGame, reducer, type Action, type GameState } from "./game.ts";

const run = (s: GameState, ...actions: Action[]) => actions.reduce(reducer, s);

test("correct answer moves to the next country and ends the game", () => {
  let s = run(newGame(["TUR", "FRA"], 0), { type: "answer", code: "TUR" });
  assert.equal(s.phase, "correct");
  s = run(s, { type: "next", now: 1 });
  assert.deepEqual([s.queue, s.done, s.phase], [["FRA"], ["TUR"], "play"]);
  s = run(s, { type: "answer", code: "FRA" }, { type: "next", now: 5 });
  assert.deepEqual([s.phase, s.endedAt, s.score, s.attempts], ["over", 5, 2, 2]);
});

test("wrong answers count once and reveal after three misses", () => {
  let s = run(newGame(["TUR", "FRA"], 0), { type: "answer", code: "DEU" }, { type: "answer", code: "DEU" });
  assert.deepEqual([s.attempts, s.misses, s.wrong], [1, 1, ["DEU"]]);
  s = run(s, { type: "hint" }, { type: "hint" });
  assert.deepEqual([s.attempts, s.misses, s.hintUsed], [2, 2, true]);
  s = run(s, { type: "answer", code: "ITA" });
  assert.equal(s.phase, "revealed");
  assert.equal(run(s, { type: "answer", code: "TUR" }).phase, "revealed");
  s = run(s, { type: "next", now: 1 });
  assert.deepEqual([s.queue, s.done, s.misses, s.phase, s.missed], [["FRA", "TUR"], [], 0, "play", { TUR: 3 }]);
});

test("skip rotates the queue, except for the last country", () => {
  assert.deepEqual(run(newGame(["A", "B", "C"], 0), { type: "skip" }).queue, ["B", "C", "A"]);
  const last = newGame(["A"], 0);
  assert.equal(run(last, { type: "skip" }), last);
});

test("time up ends the game", () => {
  const s = run(newGame(["A", "B"], 0, 60_000), { type: "timeUp", now: 60_000 });
  assert.deepEqual([s.phase, s.endedAt], ["over", 60_000]);
});
