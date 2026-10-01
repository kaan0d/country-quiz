import { countries } from "./countries.ts";

export const DAILY_SIZE = 10;

// Today in the player's time zone, as YYYY-MM-DD
export const today = () => new Date().toLocaleDateString("sv");

// mulberry32 seeded from a string hash: the same date gives the same sequence on every device
function seededRandom(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Same countries for everyone on a given day; small islands are left out so the map is fair
export function dailyCodes(date: string) {
  const pool = countries.filter((c) => c.capital && !c.isSmallIsland).map((c) => c.code);
  const rand = seededRandom(date);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, DAILY_SIZE);
}

// One square per country in the day's order: green first try, yellow found after misses, red revealed
export function shareText(date: string, mode: string, missed: Record<string, number>) {
  const squares = dailyCodes(date)
    .map((code) => {
      const n = missed[code] ?? 0;
      return n === 0 ? "🟩" : n < 3 ? "🟨" : "🟥";
    })
    .join("");
  const clean = dailyCodes(date).filter((code) => !missed[code]).length;
  return `Country Quiz ${date} · ${mode}\n${squares} ${clean}/${DAILY_SIZE}`;
}
