import type { Country } from "./countries.ts";

// Lowercase, no accents, letters and digits only: "Côte d'Ivoire" and "cote divoire" match
export const normalize = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/ı/g, "i").replace(/[^a-z0-9]/g, "");

function distance(a: string, b: string) {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return prev[b.length];
}

// The country a typed name means: the answer when it is close enough (small typos allowed in
// Turkish or English), another country only on an exact name, null when nothing matches.
export function matchTyped(input: string, answer: Country, pool: Country[]): string | null {
  const q = normalize(input);
  if (!q) return null;
  const typos = q.length >= 8 ? 2 : q.length >= 5 ? 1 : 0;
  if ([answer.name, answer.en].some((n) => distance(q, normalize(n)) <= typos)) return answer.code;
  return pool.find((c) => normalize(c.name) === q || normalize(c.en) === q)?.code ?? null;
}
