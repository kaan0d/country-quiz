// Pure game state, keyed by ISO alpha-3 codes. queue[0] is the country being asked.

export type Phase = "play" | "correct" | "revealed" | "over";

export interface GameState {
  queue: string[];
  done: string[];
  wrong: string[]; // wrong picks for the current country
  misses: number; // misses on the current country, hint included
  hintUsed: boolean;
  score: number;
  attempts: number;
  phase: Phase;
  missed: Record<string, number>; // misses per country in this game
  startedAt: number;
  endedAt: number | null;
  timeLimit: number | null; // ms, null for a full run
  practice: boolean; // a round of the most missed countries
  daily?: string | null; // date of a daily challenge; missing in games saved before it existed
}

export type Action =
  | { type: "load"; state: GameState }
  | { type: "answer"; code: string }
  | { type: "hint" }
  | { type: "skip" }
  | { type: "next"; now: number }
  | { type: "timeUp"; now: number };

// After this many misses the answer is shown and the country goes to the back of the queue
export const MAX_MISSES = 3;

export function newGame(
  queue: string[],
  now: number,
  { timeLimit = null, practice = false, daily = null }: { timeLimit?: number | null; practice?: boolean; daily?: string | null } = {}
): GameState {
  return {
    queue,
    done: [],
    wrong: [],
    misses: 0,
    hintUsed: false,
    score: 0,
    attempts: 0,
    phase: queue.length ? "play" : "over",
    missed: {},
    startedAt: now,
    endedAt: queue.length ? null : now,
    timeLimit,
    practice,
    daily,
  };
}

const freshTurn = { wrong: [], misses: 0, hintUsed: false, phase: "play" as Phase };

function miss(s: GameState, extra: Partial<GameState>): GameState {
  const cur = s.queue[0];
  const misses = s.misses + 1;
  return {
    ...s,
    ...extra,
    attempts: s.attempts + 1,
    misses,
    missed: { ...s.missed, [cur]: (s.missed[cur] ?? 0) + 1 },
    phase: misses >= MAX_MISSES ? "revealed" : "play",
  };
}

export function reducer(s: GameState, a: Action): GameState {
  if (a.type === "load") return a.state;
  if (a.type === "timeUp") {
    return s.phase === "over" ? s : { ...s, phase: "over", endedAt: a.now };
  }
  if (a.type === "next") {
    const [cur, ...rest] = s.queue;
    if (s.phase === "correct") {
      const done = [...s.done, cur];
      if (!rest.length) return { ...s, ...freshTurn, queue: rest, done, phase: "over", endedAt: a.now };
      return { ...s, ...freshTurn, queue: rest, done };
    }
    if (s.phase === "revealed") return { ...s, ...freshTurn, queue: [...rest, cur] };
    return s;
  }
  if (s.phase !== "play") return s;

  switch (a.type) {
    case "answer":
      if (a.code === s.queue[0]) return { ...s, score: s.score + 1, attempts: s.attempts + 1, phase: "correct" };
      if (s.wrong.includes(a.code)) return s;
      return miss(s, { wrong: [...s.wrong, a.code] });
    case "hint":
      return s.hintUsed ? s : miss(s, { hintUsed: true });
    case "skip":
      if (s.queue.length < 2) return s;
      return { ...s, ...freshTurn, queue: [...s.queue.slice(1), s.queue[0]] };
  }
}
