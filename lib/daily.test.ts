import { test } from "node:test";
import assert from "node:assert/strict";
import { dailyCodes, shareText, DAILY_SIZE } from "./daily.ts";

test("daily countries depend only on the date", () => {
  const a = dailyCodes("2026-10-01");
  assert.equal(a.length, DAILY_SIZE);
  assert.equal(new Set(a).size, DAILY_SIZE);
  assert.deepEqual(dailyCodes("2026-10-01"), a);
  assert.notDeepEqual(dailyCodes("2026-10-02"), a);
});

test("share text marks each country by its misses", () => {
  const [first, second] = dailyCodes("2026-10-01");
  const text = shareText("2026-10-01", "Flag", { [first]: 3, [second]: 1 });
  assert.equal(text, `Country Quiz 2026-10-01 · Flag\n🟥🟨${"🟩".repeat(8)} 8/10`);
});
