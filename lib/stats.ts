import type { GameState } from "./game.ts";

export interface Stats {
  misses: Record<string, number>; // lifetime misses per country
  best: Record<string, number>; // per game setup: countries found in a timed run, accuracy % in a full run
}

export const emptyStats: Stats = { misses: {}, best: {} };

export const gameScore = (g: GameState) =>
  g.timeLimit ? g.score : g.attempts ? Math.round((g.score / g.attempts) * 100) : 0;

// Adds a game's misses to the lifetime counts; a country found without a miss loses one.
// Only a finished game that is not a practice round or daily challenge can set a best score.
export function recordGame(stats: Stats, g: GameState, key: string): Stats {
  const misses = { ...stats.misses };
  for (const [code, n] of Object.entries(g.missed)) misses[code] = (misses[code] ?? 0) + n;
  for (const code of g.done) {
    if (g.missed[code] || !misses[code]) continue;
    if (--misses[code] === 0) delete misses[code];
  }
  const best = { ...stats.best };
  if (g.phase === "over" && !g.practice && !g.daily && g.attempts > 0) best[key] = Math.max(best[key] ?? 0, gameScore(g));
  return { misses, best };
}

// Most missed countries first
export const hardest = (stats: Stats, pool: Iterable<string>, n = 20) =>
  [...pool]
    .filter((code) => stats.misses[code])
    .sort((a, b) => stats.misses[b] - stats.misses[a])
    .slice(0, n);
