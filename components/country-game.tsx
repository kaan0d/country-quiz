"use client";

import { useState, useEffect, useMemo, useReducer, useRef } from "react";
import { WorldMap, type HintCircle } from "./world-map";
import { countries, shuffleArray, type Continent } from "@/lib/countries";
import { buildHintCircle, continentBounds, countryCenters, offBy } from "@/lib/geo";
import { newGame, reducer, MAX_MISSES, type GameState } from "@/lib/game";
import { load, save } from "@/lib/storage";
import { capitalName, countryName, strings, type Lang } from "@/lib/i18n";
import { ArrowUp, Target, Check, Globe, Lightbulb, SkipForward, List, X, Settings as SettingsIcon } from "lucide-react";
import { CountryListModal } from "./country-list-modal";
import { SettingsModal } from "./settings-modal";
import { GameSummary } from "./game-summary";
import { answerFeedback } from "@/lib/feedback";
import { emptyStats, gameScore, hardest, recordGame } from "@/lib/stats";
import { dailyCodes, shareText, today } from "@/lib/daily";
import { matchTyped } from "@/lib/match";

const byCode = new Map(countries.map((c) => [c.code, c]));
const allCodes = new Set(byCode.keys());

const SETTINGS_KEY = "countryQuiz.settings";
const GAME_KEY = "countryQuiz.game";
const STATS_KEY = "countryQuiz.stats";

export type Mode = "name" | "flag" | "capital" | "reverse" | "typed";

// Modes where the country is marked on the map and the player names it
const isMarked = (m: Mode) => m === "reverse" || m === "typed";

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
// Changing one of these starts a new game
const GAME_SETTINGS: (keyof Settings)[] = ["mode", "timed", "region", "includeSmallIslands"];

// Answer plus distractors, from the same continent when there are enough
function pickOptions(answer: string, pool: string[], n = 4) {
  const continent = byCode.get(answer)?.continent;
  const others = shuffleArray(pool.filter((c) => c !== answer));
  others.sort((a, b) => Number(byCode.get(b)?.continent === continent) - Number(byCode.get(a)?.continent === continent));
  return shuffleArray([answer, ...others.slice(0, n - 1)]);
}

const playableCodes = (s: Settings) =>
  countries
    .filter((c) => s.includeSmallIslands || !c.isSmallIsland)
    .filter((c) => s.region === "all" || c.continent === s.region)
    .filter((c) => s.mode !== "capital" || c.capital)
    .map((c) => c.code);

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
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [stats, setStats] = useState(emptyStats);
  const [newRecord, setNewRecord] = useState(false);
  const [exploring, setExploring] = useState(false);
  const [picked, setPicked] = useState<string | null>(null); // country tapped in the explore view
  const [typed, setTyped] = useState("");
  const [unknownName, setUnknownName] = useState(false);
  const recorded = useRef<number | null>(null); // startedAt of the last game added to stats
  const { lang, showWrongAnswer } = settings;
  const t = strings[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Restore settings and the unfinished game, or start a new one
  useEffect(() => {
    const saved = load(SETTINGS_KEY, defaultSettings);
    const savedGame = load<GameState | null>(GAME_KEY, null);
    setSettings(saved);
    setStats(load(STATS_KEY, emptyStats));
    const resumable = savedGame?.phase !== "over" && savedGame?.queue.every((code) => byCode.has(code));
    dispatch({ type: "load", state: resumable ? savedGame! : startGame(saved) });
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
  const deadline = game.timeLimit && game.phase !== "over" ? game.startedAt + game.timeLimit : null;
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
    const next = reducer(game, { type: "answer", code });
    if (next !== game && settings.sound) answerFeedback(next.phase === "correct");
    dispatch({ type: "answer", code });
  };

  const resetGame = (s = settings) => {
    record(game);
    dispatch({ type: "load", state: startGame(s) });
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
  const startPractice = () => {
    record(game);
    dispatch({ type: "load", state: newGame(shuffleArray(practiceCodes), Date.now(), { practice: true }) });
  };
  // Daily challenge: the day's countries in a fixed order, in the current mode
  const startDaily = () => {
    record(game);
    const date = today();
    dispatch({ type: "load", state: newGame(dailyCodes(date), Date.now(), { daily: date }) });
  };
  const options = useMemo(
    () => (settings.mode === "reverse" && game.queue[0] ? pickOptions(game.queue[0], [...playable]) : []),
    [settings.mode, game.queue[0], playable]
  );
  const hintCircle = useMemo<HintCircle | null>(
    () => (current && game.hintUsed ? buildHintCircle(current.continent, countryCenters[current.code] ?? [0, 0]) : null),
    [current, game.hintUsed]
  );

  // Keyboard: H hint, S skip, N new game, 1-4 pick an option in reverse mode
  const modalOpen = showSettings || showCountryList;
  useEffect(() => {
    if (!ready || modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.target instanceof HTMLInputElement) return;
      const key = e.key.toLowerCase();
      if (exploring) {
        if (key === "escape") setExploring(false);
        return;
      }
      if (key === "h" && !isMarked(settings.mode)) dispatch({ type: "hint" });
      else if (key === "s") dispatch({ type: "skip" });
      else if (key === "n") resetGame();
      else if (options[Number(key) - 1]) answer(options[Number(key) - 1]);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-svh bg-background">
        <div className="flex items-center gap-3 text-foreground">
          <Globe className="w-7 h-7 animate-spin" />
          <span className="text-lg">{t.loading}</span>
        </div>
      </div>
    );
  }

  const playing = game.phase === "play";
  const gameComplete = game.phase === "over";
  const accuracy = game.attempts > 0 ? Math.round((game.score / game.attempts) * 100) : 0;
  const lastWrong = byCode.get(game.wrong[game.wrong.length - 1]);
  const mode = settings.mode;
  const pickedCountry = picked ? byCode.get(picked) : undefined;
  // How far the wrong pick is from the answer, for the modes where the player searches the map
  const wrongCenter = lastWrong && countryCenters[lastWrong.code];
  const answerCenter = current && countryCenters[current.code];
  const marked = isMarked(mode);
  const off = !marked && wrongCenter && answerCenter ? offBy(wrongCenter, answerCenter) : null;
  const [flagW, flagH] = mode === "flag" ? [96, 64] : [64, 43];

  return (
    <div className="flex flex-col bg-background overflow-hidden" style={{ height: "100svh", maxHeight: "100svh" }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="shrink-0 flex flex-col items-center gap-1 py-2 px-3 bg-card border-b border-border">
        {exploring ? (
          <div className="text-center">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground leading-tight">{t.explore}</h1>
            <p className="text-xs text-muted-foreground">{t.exploreInfo}</p>
          </div>
        ) : current && !gameComplete && (
          <div className="flex items-center gap-3">
            {(mode === "name" || mode === "flag") && (
              <img
                key={current.code}
                src={`/flags/${current.code2}.png`}
                alt={mode === "flag" ? t.flagQuestion : t.flagAlt(countryName(current, lang))}
                width={flagW}
                height={flagH}
                className="rounded shadow-md object-cover border border-white/10 shrink-0"
                style={{ width: flagW, height: flagH }}
              />
            )}
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground text-balance leading-tight">
                {mode === "name" ? countryName(current, lang) : mode === "capital" ? capitalName(current, lang) : mode === "flag" ? t.flagQuestion : t.reverseQuestion}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {mode === "capital" ? t.findCapital : mode === "reverse" ? t.reverseInfo : mode === "typed" ? t.typedInfo : t.findOnMap}
              </p>
            </div>
          </div>
        )}

        {/* Feedback strip */}
        {!exploring && <div className="h-5 flex items-center justify-center">
          {game.phase === "correct" && (
            <span className="flex items-center gap-1 text-green-400 text-xs font-semibold animate-in fade-in zoom-in duration-200">
              <Check className="w-3.5 h-3.5" /> {t.correct}
              {mode !== "name" && current && ` ${countryName(current, lang)}`}
            </span>
          )}
          {game.phase === "revealed" && (
            <span className="text-yellow-400 text-xs font-semibold animate-in fade-in zoom-in duration-200">
              {mode !== "name" && current && `${countryName(current, lang)}: `}
              {t.revealed(MAX_MISSES)}
            </span>
          )}
          {playing && lastWrong && (
            <span className="flex items-center gap-1 text-red-400 text-xs font-semibold animate-in fade-in zoom-in duration-200">
              <X className="w-3.5 h-3.5" />
              {showWrongAnswer
                ? <><span className="text-red-300">{countryName(lastWrong, lang)}</span><span className="text-red-400/70 ml-1">{t.tryAgain}</span></>
                : t.wrong
              }
              {off && (
                <span className="flex items-center gap-0.5 text-muted-foreground font-normal ml-1 tabular-nums">
                  · {off.km.toLocaleString(lang)} km
                  <ArrowUp className="w-3.5 h-3.5" style={{ transform: `rotate(${off.deg}deg)` }} aria-label={t.direction} />
                </span>
              )}
            </span>
          )}
        </div>}
      </header>

      {/* ── Map ────────────────────────────────────────────────── */}
      <main className="min-h-0 flex-1 relative overflow-hidden">
        {exploring ? (
          <WorldMap
            onCountryClick={setPicked}
            playable={allCodes}
            focus={region === "all" ? null : continentBounds[region]}
            done={[]}
            wrong={[]}
            correct={null}
            target={picked}
            hintCircle={null}
            locked={false}
            heat={stats.misses}
          />
        ) : <WorldMap
          onCountryClick={answer}
          playable={playable}
          focus={region === "all" ? null : continentBounds[region]}
          done={game.done}
          wrong={game.wrong}
          correct={game.phase === "correct" ? game.queue[0] : null}
          target={game.phase === "revealed" || marked ? game.queue[0] : null}
          hintCircle={playing ? hintCircle : null}
          locked={!playing || marked}
        />}

        {exploring && pickedCountry && (
          <div className="absolute bottom-2 inset-x-2 z-10 max-w-sm mx-auto flex items-center gap-3 bg-card/90 backdrop-blur border border-border rounded-lg px-3 py-2.5">
            <img src={`/flags/${pickedCountry.code2}.png`} alt="" width={48} height={32} className="rounded-sm object-cover shrink-0" style={{ width: 48, height: 32 }} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground truncate">{countryName(pickedCountry, lang)}</p>
              <p className="text-xs text-muted-foreground truncate">
                {[capitalName(pickedCountry, lang), t.continents[pickedCountry.continent]].filter(Boolean).join(" · ")}
              </p>
            </div>
            <p className={`text-xs tabular-nums shrink-0 ${stats.misses[pickedCountry.code] ? "text-red-400" : "text-muted-foreground"}`}>
              {t.lifetimeMisses(stats.misses[pickedCountry.code] ?? 0)}
            </p>
          </div>
        )}

        {!exploring && game.hintUsed && current && !gameComplete && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-yellow-950 px-2.5 py-1 rounded-md font-semibold text-xs z-10 shadow-lg pointer-events-none">
            {t.continent}: {t.continents[current.continent]}
          </div>
        )}

        {gameComplete || exploring ? null : deadline ? (
          <div className="absolute top-2 right-2 bg-card/80 backdrop-blur border border-yellow-500/40 text-yellow-400 px-2.5 py-1 rounded-md text-sm font-semibold tabular-nums z-10 pointer-events-none">
            {Math.max(0, Math.ceil((deadline - now) / 1000))} s
          </div>
        ) : game.queue.length > 1 && (
          <div className="absolute top-2 right-2 bg-card/80 backdrop-blur border border-border text-muted-foreground px-2.5 py-1 rounded-md text-xs z-10 pointer-events-none">
            {game.practice && `${t.practiceBadge} · `}{game.daily && `${t.daily} · `}{t.remaining}: {game.queue.length - 1}
          </div>
        )}

        {mode === "typed" && !gameComplete && !exploring && current && (
          <form
            className="absolute bottom-2 inset-x-2 z-10 max-w-sm mx-auto flex flex-col gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              const code = matchTyped(typed, current, countries);
              setUnknownName(!code && !!typed.trim());
              if (code) {
                answer(code);
                setTyped("");
              }
            }}
          >
            {unknownName && <p className="text-xs text-red-400 bg-card/90 rounded px-2 py-1 self-start">{t.unknownName}</p>}
            <input
              value={typed}
              onChange={(e) => {
                setTyped(e.target.value);
                setUnknownName(false);
              }}
              disabled={!playing}
              ref={(el) => { if (el && playing && !modalOpen) el.focus(); }}
              placeholder={t.typedPlaceholder}
              aria-label={t.typedPlaceholder}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="send"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-card/90 backdrop-blur text-foreground text-base outline-none focus:border-yellow-500"
            />
          </form>
        )}

        {mode === "reverse" && !gameComplete && !exploring && (
          <div className="absolute bottom-2 inset-x-2 z-10 grid grid-cols-2 gap-1.5 max-w-xl mx-auto">
            {options.map((code, i) => {
              const c = byCode.get(code)!;
              const isAnswer = code === game.queue[0];
              const color =
                !playing && isAnswer
                  ? game.phase === "correct" ? "bg-green-600 border-green-400 text-white" : "bg-yellow-500 border-yellow-300 text-yellow-950"
                  : game.wrong.includes(code)
                    ? "bg-red-950/80 border-red-800 text-red-300 line-through"
                    : "bg-card/90 border-border text-foreground hover:bg-muted";
              return (
                <button
                  key={code}
                  onClick={() => answer(code)}
                  disabled={!playing || game.wrong.includes(code)}
                  className={`px-3 py-2.5 rounded-lg border backdrop-blur text-sm font-medium text-left truncate transition-colors ${color}`}
                >
                  <span className="text-muted-foreground mr-1.5 tabular-nums">{i + 1}</span>
                  {countryName(c, lang)}
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
            onPlayAgain={() => resetGame()}
            onPractice={startPractice}
            share={game.daily ? shareText(game.daily, t.modes[mode], game.missed) : null}
          />
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="shrink-0 flex items-center justify-between gap-2 px-3 py-2 bg-card border-t border-border">
        {/* Stats */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-foreground font-medium tabular-nums text-sm">
              {game.done.length}/{game.done.length + game.queue.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-green-400" />
            <span className="text-foreground font-medium tabular-nums text-sm">{accuracy}%</span>
          </div>
        </div>

        {/* Action buttons */}
        {exploring ? (
          <button
            onClick={() => setExploring(false)}
            className="flex items-center justify-center gap-2 h-12 px-4 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
            {t.backToGame}
          </button>
        ) : <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowCountryList(true)}
            aria-label={t.allCountries}
            className="flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-md text-xs font-medium bg-slate-500/10 border border-slate-500/30 text-slate-300 hover:bg-slate-500/20 active:scale-95 transition-all"
          >
            <List className="w-4 h-4 shrink-0" />
            <span>{t.countries}</span>
          </button>

          <button
            onClick={() => dispatch({ type: "hint" })}
            disabled={!playing || game.hintUsed || marked}
            aria-label={t.hint}
            title={`${t.hintCost} (H)`}
            aria-keyshortcuts="H"
            className="flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-md text-xs font-medium bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
            className="flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-md text-xs font-medium bg-slate-500/10 border border-slate-500/30 text-slate-300 hover:bg-slate-500/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <SkipForward className="w-4 h-4 shrink-0" />
            <span>{t.skip}</span>
          </button>

          <button
            onClick={() => setShowSettings(true)}
            aria-label={t.settings}
            className="flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-md text-xs font-medium bg-slate-500/10 border border-slate-500/30 text-slate-300 hover:bg-slate-500/20 active:scale-95 transition-all"
          >
            <SettingsIcon className="w-4 h-4 shrink-0" />
            <span>{t.settings}</span>
          </button>
        </div>}
      </footer>

      {showCountryList && (
        <CountryListModal t={t} lang={lang} done={game.done} playable={playable} onClose={() => setShowCountryList(false)} />
      )}

      {showSettings && (
        <SettingsModal
          t={t}
          settings={settings}
          onChange={(patch) => {
            const next = updateSettings(patch);
            if (GAME_SETTINGS.some((k) => k in patch)) resetGame(next);
          }}
          onNewGame={() => {
            resetGame();
            setShowSettings(false);
          }}
          practiceCount={practiceCodes.length}
          onPractice={() => {
            startPractice();
            setShowSettings(false);
          }}
          onDaily={() => {
            startDaily();
            setShowSettings(false);
          }}
          onExplore={() => {
            setPicked(null);
            setExploring(true);
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
