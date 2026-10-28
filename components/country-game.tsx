"use client";

import { useState, useEffect, useMemo, useReducer, useRef } from "react";
import { WorldMap, type HintCircle } from "./world-map";
import { countries, flagUrl, shuffleArray, type Continent } from "@/lib/countries";
import { buildHintCircle, continentBounds, countryCenters, offBy } from "@/lib/geo";
import { newGame, reducer, MAX_MISSES, type GameState } from "@/lib/game";
import { load, save } from "@/lib/storage";
import { capitalName, countryName, strings, type Lang } from "@/lib/i18n";
import { ArrowUp, Check, Compass, CornerDownLeft, Lightbulb, SkipForward, List, X, House } from "lucide-react";
import { CountryListModal } from "./country-list-modal";
import { MainMenu, type StartKind } from "./main-menu";
import { GameSummary } from "./game-summary";
import { answerFeedback } from "@/lib/feedback";
import { emptyStats, gameScore, hardest, recordGame } from "@/lib/stats";
import { dailyCodes, shareText, today } from "@/lib/daily";
import { matchTyped } from "@/lib/match";
import { neighbors } from "@/lib/neighbors";

const byCode = new Map(countries.map((c) => [c.code, c]));
const allCodes = new Set(byCode.keys());

const SETTINGS_KEY = "countryQuiz.settings";
const GAME_KEY = "countryQuiz.game";
const STATS_KEY = "countryQuiz.stats";

export type Mode = "name" | "flag" | "capital" | "reverse" | "typed" | "neighbors";

// Modes where the country is marked on the map and the player names it (or, in neighbours mode, a neighbour)
const isMarked = (m: Mode) => m === "reverse" || m === "typed" || m === "neighbors";

export type Settings = {
  lang: Lang;
  mode: Mode;
  timed: boolean;
  region: Continent | "all";
  includeSmallIslands: boolean;
  showWrongAnswer: boolean;
  sound: boolean;
};
const defaultSettings: Settings = { lang: "tr", mode: "name", timed: false, region: "all", includeSmallIslands: true, showWrongAnswer: false, sound: true };

// Answer plus distractors, from the same continent when there are enough
function pickOptions(answer: string, pool: string[], n = 4) {
  const continent = byCode.get(answer)?.continent;
  const others = shuffleArray(pool.filter((c) => c !== answer));
  others.sort((a, b) => Number(byCode.get(b)?.continent === continent) - Number(byCode.get(a)?.continent === continent));
  return shuffleArray([answer, ...others.slice(0, n - 1)]);
}

const playableCodes = (s: Settings) => {
  const codes = countries
    .filter((c) => s.includeSmallIslands || !c.isSmallIsland)
    .filter((c) => s.region === "all" || c.continent === s.region)
    .filter((c) => s.mode !== "capital" || c.capital)
    .map((c) => c.code);
  if (s.mode !== "neighbors") return codes;
  // Only countries with a neighbour in the same game, so every question has an answer on the map
  const pool = new Set(codes);
  return codes.filter((code) => neighbors[code]?.some((n) => pool.has(n)));
};

const TIME_LIMIT = 60_000;

// Best scores are kept per game setup
const bestKey = (s: Settings) => [s.mode, s.region, s.includeSmallIslands, s.timed].join("|");

function startGame(s: Settings) {
  return newGame(shuffleArray(playableCodes(s)), Date.now(), { timeLimit: s.timed ? TIME_LIMIT : null });
}

export function CountryGame() {
  const [game, dispatch] = useReducer(reducer, null, () => newGame([], 0));
  const [ready, setReady] = useState(false);
  const [showCountryList, setShowCountryList] = useState(false);
  const [menu, setMenu] = useState(true); // the main menu opens first on every visit
  const [settings, setSettings] = useState(defaultSettings);
  const [stats, setStats] = useState(emptyStats);
  const [newRecord, setNewRecord] = useState(false);
  const [exploring, setExploring] = useState(false);
  const [picked, setPicked] = useState<string | null>(null); // country tapped in the explore view
  const [typed, setTyped] = useState("");
  const [typedNote, setTypedNote] = useState<string | null>(null); // why a typed name was not taken
  const [lastPick, setLastPick] = useState<string | null>(null); // the neighbour named in neighbours mode
  const recorded = useRef<number | null>(null); // startedAt of the last game added to stats
  const { lang, showWrongAnswer } = settings;
  const t = strings[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Restore settings and the unfinished game; the menu offers to continue it
  useEffect(() => {
    const savedGame = load<GameState | null>(GAME_KEY, null);
    setSettings(load(SETTINGS_KEY, defaultSettings));
    setStats(load(STATS_KEY, emptyStats));
    const resumable = savedGame?.phase !== "over" && savedGame?.queue.every((code) => byCode.has(code));
    if (resumable) dispatch({ type: "load", state: savedGame! });
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) save(GAME_KEY, game);
  }, [ready, game]);

  // Short pause on a correct or revealed answer, then the next country
  useEffect(() => {
    if (game.phase !== "correct" && game.phase !== "revealed") return;
    const pause = game.phase === "correct" ? (game.timeLimit ? 400 : 1000) : 1800;
    const id = setTimeout(() => dispatch({ type: "next", now: Date.now() }), pause);
    return () => clearTimeout(id);
  }, [game.phase, game.timeLimit]);

  // Countdown for a timed run
  const [now, setNow] = useState(0);
  const deadline = game.timeLimit && game.phase !== "over" && !game.pausedAt ? game.startedAt + game.timeLimit : null;

  // The clock stops while the menu or the explore view (opened from the menu) covers the game
  const away = menu || exploring;
  useEffect(() => {
    dispatch({ type: away ? "pause" : "resume", now: Date.now() });
  }, [away]);
  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      setNow(Date.now());
      if (Date.now() >= deadline) dispatch({ type: "timeUp", now: deadline });
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [deadline]);

  const record = (g: GameState) => {
    if (!g.attempts || recorded.current === g.startedAt) return;
    recorded.current = g.startedAt;
    const key = bestKey(settings);
    const next = recordGame(stats, g, key);
    setNewRecord(g.phase === "over" && !g.practice && !g.daily && stats.best[key] !== undefined && gameScore(g) > stats.best[key]);
    setStats(next);
    save(STATS_KEY, next);
  };

  // Finished games go into the stats right away; abandoned ones when the next game starts
  useEffect(() => {
    if (game.phase === "over") record(game);
  }, [game.phase]);

  const answer = (code: string) => {
    // Neighbours mode: any bordering country is right, the asked country itself does nothing
    if (settings.mode === "neighbors") {
      if (code === game.queue[0]) return;
      setLastPick(code);
      if (neighbors[game.queue[0]]?.includes(code)) code = game.queue[0];
    }
    const next = reducer(game, { type: "answer", code });
    if (next !== game && settings.sound) answerFeedback(next.phase === "correct");
    dispatch({ type: "answer", code });
  };

  // Starts a game with the given setup; the current one goes into the stats first, under its own settings
  const start = (setup: Settings, kind: StartKind = "new") => {
    record(game);
    const s = updateSettings(setup);
    const date = today();
    const state =
      kind === "daily" ? newGame(dailyCodes(date, s.mode), Date.now(), { daily: date })
      : kind === "practice" ? newGame(shuffleArray(hardest(stats, playableCodes(s))), Date.now(), { practice: true })
      : startGame(s);
    dispatch({ type: "load", state });
    setMenu(false);
  };

  const updateSettings = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    save(SETTINGS_KEY, next);
    return next;
  };

  const current = byCode.get(game.queue[0]);
  // The daily challenge is the same for everyone, so it ignores the region and small island settings
  const region = game.daily ? "all" : settings.region;
  const playable = useMemo(
    () => new Set(playableCodes(game.daily ? { ...settings, region, includeSmallIslands: false } : settings)),
    // Only the game settings matter; a language change must not reshuffle the options
    [settings.mode, region, settings.includeSmallIslands, game.daily]
  );
  const practiceCodes = hardest(stats, playable);
  const options = useMemo(
    () => (settings.mode === "reverse" && game.queue[0] ? pickOptions(game.queue[0], [...playable]) : []),
    [settings.mode, game.queue[0], playable]
  );
  const hintCircle = useMemo<HintCircle | null>(
    () => (current && game.hintUsed ? buildHintCircle(current.continent, countryCenters[current.code] ?? [0, 0]) : null),
    [current, game.hintUsed]
  );

  // Keyboard: H hint, S skip, N new game, M menu, 1-4 pick an option in reverse mode
  const modalOpen = menu || showCountryList;
  useEffect(() => {
    if (!ready || modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.target instanceof HTMLInputElement) return;
      const key = e.key.toLowerCase();
      if (exploring) {
        if (key === "escape") closeExplore();
        return;
      }
      if (key === "h" && !isMarked(settings.mode)) dispatch({ type: "hint" });
      else if (key === "s") dispatch({ type: "skip" });
      else if (key === "n") start(settings);
      else if (key === "m") setMenu(true);
      else if (options[Number(key) - 1]) answer(options[Number(key) - 1]);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Explore is opened from the menu, so leaving it goes back there
  function closeExplore() {
    setExploring(false);
    setMenu(true);
  }


  if (!ready) {
    return (
      <div className="flex items-center justify-center h-svh bg-paper">
        <div className="flex items-center gap-3">
          <Compass className="w-7 h-7 text-seal animate-spin" />
          <span className="font-display italic text-xl">{t.loading}</span>
        </div>
      </div>
    );
  }

  const playing = game.phase === "play";
  const resumable = game.queue.length > 0 && game.phase !== "over";
  const gameComplete = game.phase === "over";
  const accuracy = game.attempts > 0 ? Math.round((game.score / game.attempts) * 100) : 0;
  const lastWrong = byCode.get(game.wrong[game.wrong.length - 1]);
  const mode = settings.mode;
  const pickedCountry = picked ? byCode.get(picked) : undefined;
  const lastPickCountry = lastPick ? byCode.get(lastPick) : undefined;
  // How far the wrong pick is from the answer, for the modes where the player searches the map
  const wrongCenter = lastWrong && countryCenters[lastWrong.code];
  const answerCenter = current && countryCenters[current.code];
  const marked = isMarked(mode);
  const off = !marked && wrongCenter && answerCenter ? offBy(wrongCenter, answerCenter) : null;
  const [flagW, flagH] = mode === "flag" ? [96, 64] : [60, 40];
  const total = game.done.length + game.queue.length;
  const secondsLeft = deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : 0;
  const footerButton =
    "plate flex flex-col items-center justify-center gap-0.5 w-14 sm:w-16 h-12 rounded-sm text-[11px] font-semibold";

  return (
    <div className="flex flex-col bg-paper overflow-hidden" style={{ height: "100svh", maxHeight: "100svh" }}>

      {/* ── Header: the question, set like an atlas plate title ── */}
      <header className="shrink-0 px-3 sm:px-5 pt-3 pb-2 border-b border-ink">
        {exploring ? (
          <div className="animate-rise">
            <p className="smallcaps text-ink-soft">{t.exploreInfo}</p>
            <h1 className="font-display text-3xl sm:text-4xl leading-none">{t.explore}</h1>
          </div>
        ) : current && !gameComplete && (
          // Keyed by country so every new question sets in with its own entrance
          <div key={current.code} className="flex items-center gap-3 sm:gap-4">
            {(mode === "name" || mode === "flag" || mode === "neighbors") && (
              <img
                src={flagUrl(current.code2)}
                alt={mode === "flag" ? t.flagQuestion : t.flagAlt(countryName(current, lang))}
                width={flagW}
                height={flagH}
                className="object-cover shrink-0 p-[3px] bg-paper border border-ink shadow-[3px_3px_0_var(--ink)] animate-stamp"
                style={{ width: flagW + 8, height: flagH + 8 }}
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="smallcaps text-ink-soft truncate animate-rise" style={{ "--i": 1 } as React.CSSProperties}>
                {mode === "capital" ? t.findCapital : mode === "reverse" ? t.reverseInfo : mode === "typed" ? t.typedInfo : mode === "neighbors" ? t.neighborsInfo : t.findOnMap}
              </p>
              <h1 className="font-display text-2xl sm:text-4xl md:text-5xl leading-[1.02] tracking-tight text-balance animate-rise" style={{ "--i": 2 } as React.CSSProperties}>
                {mode === "name" || mode === "neighbors" ? countryName(current, lang) : mode === "capital" ? <em>{capitalName(current, lang)}</em> : mode === "flag" ? t.flagQuestion : t.reverseQuestion}
              </h1>
            </div>
            <p className="hidden md:block smallcaps text-ink-soft text-right shrink-0">
              {game.practice && <>{t.practiceBadge}<br /></>}
              {game.daily && <>{t.daily}<br /></>}
              {t.modes[mode]}
            </p>
          </div>
        )}

        {/* Feedback line; keyed per event so it re-animates on every answer */}
        {!exploring && <div className="h-6 flex items-center text-sm font-semibold">
          {game.phase === "correct" && (
            <span key={`c${game.score}`} className="flex items-center gap-1.5 text-verdigris animate-rise">
              <Check className="w-4 h-4" /> {t.correct}
              {mode === "neighbors" ? lastPickCountry && <em className="font-display font-normal text-base">{countryName(lastPickCountry, lang)}</em> : mode !== "name" && current && <em className="font-display font-normal text-base">{countryName(current, lang)}</em>}
            </span>
          )}
          {game.phase === "revealed" && (
            <span className="bg-ochre px-1.5 animate-rise">
              {mode !== "name" && mode !== "neighbors" && current && `${countryName(current, lang)}: `}
              {t.revealed(MAX_MISSES)}
            </span>
          )}
          {playing && lastWrong && (
            <span key={`w${game.attempts}`} className="flex items-center gap-1.5 text-seal animate-shake">
              <X className="w-4 h-4" />
              {showWrongAnswer
                ? <><em className="font-display font-normal text-base">{countryName(lastWrong, lang)}</em><span className="opacity-70">{t.tryAgain}</span></>
                : t.wrong
              }
              {off && (
                <span className="flex items-center gap-0.5 text-ink-soft font-mono font-normal text-xs ml-1 tabular-nums">
                  · {off.km.toLocaleString(lang)} km
                  <ArrowUp className="w-3.5 h-3.5" style={{ transform: `rotate(${off.deg}deg)` }} aria-label={t.direction} />
                </span>
              )}
            </span>
          )}
        </div>}
      </header>

      {/* ── Map, inside a printed neatline ───────────────────────── */}
      <main className="min-h-0 flex-1 relative overflow-hidden">
        {exploring ? (
          <WorldMap
            onCountryClick={setPicked}
            playable={allCodes}
            focus={region === "all" ? null : continentBounds[region]}
            done={[]}
            wrong={[]}
            correct={null}
            targets={picked ? [picked] : []}
            hintCircle={null}
            locked={false}
            heat={stats.misses}
          />
        ) : <WorldMap
          onCountryClick={answer}
          playable={playable}
          focus={region === "all" ? null : continentBounds[region]}
          // Done countries are greyed out, but in neighbours mode they are still answers
          done={mode === "neighbors" ? [] : game.done}
          wrong={game.wrong}
          correct={game.phase !== "correct" ? null : mode === "neighbors" ? lastPick : game.queue[0]}
          targets={
            mode === "neighbors"
              ? [game.queue[0], ...(game.phase === "revealed" ? (neighbors[game.queue[0]] ?? []) : [])]
              : game.phase === "revealed" || marked ? [game.queue[0]] : []
          }
          hintCircle={playing ? hintCircle : null}
          locked={!playing || marked}
        />}

        <div className="absolute inset-1.5 sm:inset-2.5 neatline ticks pointer-events-none z-[5]" />

        {/* A wrong pick flashes the margins red, a correct one gets stamped */}
        {!exploring && playing && lastWrong && (
          <div
            key={`f${game.attempts}`}
            className="absolute inset-0 pointer-events-none z-[6]"
            style={{ boxShadow: "inset 0 0 90px color-mix(in oklch, var(--seal) 55%, transparent)", animation: "ink-flash 0.7s ease-out both" }}
          />
        )}
        {!exploring && game.phase === "correct" && (
          <div key={`s${game.score}`} className="absolute inset-0 flex items-center justify-center pointer-events-none z-[6]" style={{ animation: "stamp-out 1s ease-in both" }}>
            <span className="animate-stamp font-display italic text-4xl sm:text-6xl text-verdigris border-4 border-double border-verdigris px-6 py-1 bg-paper/70">
              {t.correct}
            </span>
          </div>
        )}

        {exploring && pickedCountry && (
          <div key={pickedCountry.code} className="absolute bottom-4 inset-x-4 z-10 max-w-sm mx-auto flex items-center gap-3 bg-paper border border-ink shadow-[4px_4px_0_var(--ink)] px-3 py-2.5 animate-rise">
            <img src={flagUrl(pickedCountry.code2)} alt="" width={48} height={32} className="object-cover shrink-0 ring-1 ring-ink-faint" style={{ width: 48, height: 32 }} />
            <div className="min-w-0 flex-1">
              <p className="font-display text-xl leading-tight truncate">{countryName(pickedCountry, lang)}</p>
              <p className="smallcaps text-ink-soft truncate">
                {[capitalName(pickedCountry, lang), t.continents[pickedCountry.continent]].filter(Boolean).join(" · ")}
              </p>
            </div>
            <p className={`font-mono text-xs tabular-nums shrink-0 ${stats.misses[pickedCountry.code] ? "text-seal" : "text-ink-soft"}`}>
              {t.lifetimeMisses(stats.misses[pickedCountry.code] ?? 0)}
            </p>
          </div>
        )}

        {!exploring && game.hintUsed && current && !gameComplete && (
          <div className="absolute top-4 left-4 z-10 pointer-events-none bg-paper border border-seal text-seal px-3 py-1 shadow-[3px_3px_0_var(--seal)] animate-stamp">
            <span className="smallcaps">{t.continent}</span>{" "}
            <em className="font-display text-base">{t.continents[current.continent]}</em>
          </div>
        )}

        {gameComplete || exploring ? null : deadline ? (
          <div className={`absolute top-4 right-4 z-10 pointer-events-none bg-paper border px-3 py-0.5 font-display text-3xl tabular-nums leading-tight transition-colors ${secondsLeft <= 10 ? "border-seal text-seal shadow-[3px_3px_0_var(--seal)]" : "border-ink shadow-[3px_3px_0_var(--ink)]"}`}>
            <span key={secondsLeft <= 10 ? secondsLeft : 0} className={secondsLeft <= 10 ? "inline-block animate-stamp" : undefined}>{secondsLeft}</span>
            <span className="smallcaps ml-1">s</span>
          </div>
        ) : game.queue.length > 1 && (
          <div className="absolute top-4 right-4 z-10 pointer-events-none bg-paper/90 border border-ink px-2.5 py-1 smallcaps">
            {game.practice && `${t.practiceBadge} · `}{game.daily && `${t.daily} · `}{t.remaining}{" "}
            <span className="font-display normal-case text-base tracking-normal">{game.queue.length - 1}</span>
          </div>
        )}

        {(mode === "typed" || mode === "neighbors") && !gameComplete && !exploring && current && (
          <form
            className="absolute bottom-4 inset-x-4 z-10 max-w-md mx-auto flex flex-col gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              const answers = mode === "neighbors" ? (neighbors[current.code] ?? []).flatMap((n) => byCode.get(n) ?? []) : [current];
              const code = matchTyped(typed, answers, countries);
              // In neighbours mode the asked country itself is not an answer; say so instead of a silent no-op
              const same = mode === "neighbors" && code === current.code;
              setTypedNote(same ? t.sameCountry : !code && typed.trim() ? t.unknownName : null);
              if (code && !same) {
                answer(code);
                setTyped("");
              }
            }}
          >
            {typedNote && <p key={typedNote} className="self-start text-xs font-semibold text-paper bg-seal px-2 py-1 animate-shake">{typedNote}</p>}
            <div className="flex items-center bg-paper border border-ink shadow-[4px_4px_0_var(--ink)] focus-within:shadow-[4px_4px_0_var(--seal)] focus-within:border-seal transition-all">
              <input
                value={typed}
                onChange={(e) => {
                  setTyped(e.target.value);
                  setTypedNote(null);
                }}
                disabled={!playing}
                ref={(el) => { if (el && playing && !modalOpen) el.focus(); }}
                placeholder={t.typedPlaceholder}
                aria-label={t.typedPlaceholder}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="send"
                className="flex-1 min-w-0 px-4 py-3 bg-transparent font-display italic text-xl placeholder:text-ink-soft/50 outline-none"
              />
              <button type="submit" disabled={!playing} aria-label={t.typedPlaceholder} className="self-stretch px-4 border-l border-ink text-seal hover:bg-paper-deep disabled:opacity-40 transition-colors">
                <CornerDownLeft className="w-5 h-5" />
              </button>
            </div>
          </form>
        )}

        {mode === "reverse" && !gameComplete && !exploring && (
          <div key={game.queue[0]} className="absolute bottom-4 inset-x-4 z-10 grid grid-cols-2 gap-2.5 max-w-xl mx-auto">
            {options.map((code, i) => {
              const c = byCode.get(code)!;
              const isAnswer = code === game.queue[0];
              const color =
                !playing && isAnswer
                  ? game.phase === "correct" ? "!bg-verdigris text-paper" : "!bg-ochre"
                  : game.wrong.includes(code)
                    ? "!bg-paper-deep text-seal line-through animate-shake"
                    : "";
              return (
                <button
                  key={code}
                  onClick={() => answer(code)}
                  disabled={!playing || game.wrong.includes(code)}
                  className={`plate flex items-center gap-2.5 px-3 py-2.5 rounded-sm text-left animate-rise ${color}`}
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <span className="shrink-0 w-6 h-6 rounded-full border border-current flex items-center justify-center font-mono text-xs">{i + 1}</span>
                  <span className="font-display text-lg leading-tight truncate">{countryName(c, lang)}</span>
                </button>
              );
            })}
          </div>
        )}

        {gameComplete && !exploring && (
          <GameSummary
            t={t}
            lang={lang}
            game={game}
            byCode={byCode}
            best={stats.best[bestKey(settings)]}
            newRecord={newRecord}
            practiceCount={practiceCodes.length}
            onPlayAgain={() => start(settings)}
            onPractice={() => start(settings, "practice")}
            onMenu={() => setMenu(true)}
            share={game.daily ? shareText(game.daily, mode, t.modes[mode], game.missed) : null}
          />
        )}
      </main>

      {/* ── Footer: progress drawn as a map's scale bar ─────────── */}
      <footer className="shrink-0 flex items-center justify-between gap-3 px-3 sm:px-5 py-2.5 border-t border-ink">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="smallcaps text-ink-soft tabular-nums">{game.done.length} / {total}</span>
            <div className="w-20 sm:w-48 h-2.5 border border-ink bg-paper overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={game.done.length}>
              <div
                className="h-full transition-[width] duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                style={{
                  width: `${total ? (game.done.length / total) * 100 : 0}%`,
                  backgroundImage: "repeating-linear-gradient(90deg, var(--ink) 0 12px, var(--seal) 12px 24px)",
                }}
              />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="smallcaps text-ink-soft">{t.accuracy}</span>
            <span key={accuracy} className="font-display text-xl leading-none tabular-nums animate-rise">{accuracy}%</span>
          </div>
        </div>

        {exploring ? (
          <button onClick={closeExplore} className="plate flex items-center justify-center gap-2 h-12 px-5 rounded-sm text-sm font-semibold !bg-seal text-paper">
            <House className="w-4 h-4" />
            {t.menu}
          </button>
        ) : <div className="flex items-center gap-2">
          <button onClick={() => setShowCountryList(true)} aria-label={t.allCountries} className={footerButton}>
            <List className="w-4 h-4 shrink-0" />
            <span>{t.countries}</span>
          </button>

          <button
            onClick={() => dispatch({ type: "hint" })}
            disabled={!playing || game.hintUsed || marked}
            aria-label={t.hint}
            title={`${t.hintCost} (H)`}
            aria-keyshortcuts="H"
            className={`${footerButton} text-seal`}
          >
            <Lightbulb className="w-4 h-4 shrink-0" />
            <span>{t.hint}</span>
          </button>

          <button
            onClick={() => dispatch({ type: "skip" })}
            title={`${t.skip} (S)`}
            aria-keyshortcuts="S"
            disabled={!playing || game.queue.length < 2}
            aria-label={t.skip}
            className={footerButton}
          >
            <SkipForward className="w-4 h-4 shrink-0" />
            <span>{t.skip}</span>
          </button>

          <button onClick={() => setMenu(true)} aria-label={t.menu} title={`${t.menu} (M)`} aria-keyshortcuts="M" className={footerButton}>
            <House className="w-4 h-4 shrink-0" />
            <span>{t.menu}</span>
          </button>
        </div>}
      </footer>

      {showCountryList && (
        <CountryListModal t={t} lang={lang} done={game.done} playable={playable} onClose={() => setShowCountryList(false)} />
      )}

      {menu && (
        <MainMenu
          t={t}
          settings={settings}
          onPreferences={updateSettings}
          resume={resumable ? `${t.modes[mode]} · ${t.completed(game.done.length, game.done.length + game.queue.length)}` : null}
          onContinue={() => setMenu(false)}
          onStart={start}
          practiceCount={(s) => hardest(stats, playableCodes(s)).length}
          onExplore={() => {
            setPicked(null);
            setExploring(true);
            setMenu(false);
          }}
        />
      )}
    </div>
  );
}
