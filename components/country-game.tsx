"use client";

import { useState, useEffect, useMemo, useReducer } from "react";
import { WorldMap, type HintCircle } from "./world-map";
import { countries, getFilteredCountries, shuffleArray } from "@/lib/countries";
import { buildHintCircle, countryCenters } from "@/lib/geo";
import { newGame, reducer, MAX_MISSES, type GameState } from "@/lib/game";
import { load, save } from "@/lib/storage";
import { Trophy, RotateCcw, Target, Check, Globe, Lightbulb, SkipForward, List, X } from "lucide-react";
import { CountryListModal } from "./country-list-modal";

const byCode = new Map(countries.map((c) => [c.code, c]));

const SETTINGS_KEY = "countryQuiz.settings";
const GAME_KEY = "countryQuiz.game";

const defaultSettings = { includeSmallIslands: true, showWrongAnswer: false };
type Settings = typeof defaultSettings;

function startGame(includeSmallIslands: boolean) {
  return newGame(shuffleArray(getFilteredCountries(includeSmallIslands)).map((c) => c.code), Date.now());
}

export function CountryGame() {
  const [game, dispatch] = useReducer(reducer, null, () => newGame([], 0));
  const [ready, setReady] = useState(false);
  const [showCountryList, setShowCountryList] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const { includeSmallIslands, showWrongAnswer } = settings;

  // Restore settings and the unfinished game, or start a new one
  useEffect(() => {
    const saved = load(SETTINGS_KEY, defaultSettings);
    const savedGame = load<GameState | null>(GAME_KEY, null);
    setSettings(saved);
    const resumable = savedGame?.phase !== "over" && savedGame?.queue.every((code) => byCode.has(code));
    dispatch({ type: "load", state: resumable ? savedGame! : startGame(saved.includeSmallIslands) });
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) save(GAME_KEY, game);
  }, [ready, game]);

  // Short pause on a correct or revealed answer, then the next country
  useEffect(() => {
    if (game.phase !== "correct" && game.phase !== "revealed") return;
    const id = setTimeout(() => dispatch({ type: "next", now: Date.now() }), game.phase === "correct" ? 1000 : 1800);
    return () => clearTimeout(id);
  }, [game.phase]);

  const resetGame = (withSmallIslands = includeSmallIslands) =>
    dispatch({ type: "load", state: startGame(withSmallIslands) });

  const updateSettings = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    save(SETTINGS_KEY, next);
    return next;
  };

  const current = byCode.get(game.queue[0]);
  const playable = useMemo(
    () => new Set(getFilteredCountries(includeSmallIslands).map((c) => c.code)),
    [includeSmallIslands]
  );
  const hintCircle = useMemo<HintCircle | null>(
    () => (current && game.hintUsed ? buildHintCircle(current.continent, countryCenters[current.code] ?? [0, 0]) : null),
    [current, game.hintUsed]
  );

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-svh bg-background">
        <div className="flex items-center gap-3 text-foreground">
          <Globe className="w-7 h-7 animate-spin" />
          <span className="text-lg">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  const playing = game.phase === "play";
  const gameComplete = game.phase === "over";
  const accuracy = game.attempts > 0 ? Math.round((game.score / game.attempts) * 100) : 0;
  const lastWrong = byCode.get(game.wrong[game.wrong.length - 1]);

  return (
    <div className="flex flex-col bg-background overflow-hidden" style={{ height: "100svh", maxHeight: "100svh" }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="shrink-0 flex flex-col items-center gap-1 py-2 px-3 bg-card border-b border-border">
        {current && (
          <div className="flex items-center gap-3">
            <img
              key={current.code}
              src={`/flags/${current.code2}.png`}
              alt={`${current.name} bayrağı`}
              width={64}
              height={43}
              className="rounded shadow-md object-cover border border-white/10 shrink-0"
              style={{ width: 64, height: 43 }}
            />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground text-balance leading-tight">
                {current.name}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Bu ülkeyi haritada bul ve tıkla
              </p>
            </div>
          </div>
        )}

        {/* Feedback strip */}
        <div className="h-5 flex items-center justify-center">
          {game.phase === "correct" && (
            <span className="flex items-center gap-1 text-green-400 text-xs font-semibold animate-in fade-in zoom-in duration-200">
              <Check className="w-3.5 h-3.5" /> Doğru!
            </span>
          )}
          {game.phase === "revealed" && (
            <span className="text-yellow-400 text-xs font-semibold animate-in fade-in zoom-in duration-200">
              {MAX_MISSES} hata: doğru cevap sarı ile gösterildi, ülke sona eklendi
            </span>
          )}
          {playing && lastWrong && (
            <span className="flex items-center gap-1 text-red-400 text-xs font-semibold animate-in fade-in zoom-in duration-200">
              <X className="w-3.5 h-3.5" />
              {showWrongAnswer
                ? <><span className="text-red-300">{lastWrong.name}</span><span className="text-red-400/70 ml-1">— tekrar dene!</span></>
                : "Yanlış, tekrar dene!"
              }
            </span>
          )}
        </div>
      </header>

      {/* ── Map ────────────────────────────────────────────────── */}
      <main className="min-h-0 flex-1 relative overflow-hidden">
        <WorldMap
          onCountryClick={(code) => dispatch({ type: "answer", code })}
          playable={playable}
          done={game.done}
          wrong={game.wrong}
          correct={game.phase === "correct" ? game.queue[0] : null}
          target={game.phase === "revealed" ? game.queue[0] : null}
          hintCircle={playing ? hintCircle : null}
          locked={!playing}
        />

        {game.hintUsed && current && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-yellow-950 px-2.5 py-1 rounded-md font-semibold text-xs z-10 shadow-lg pointer-events-none">
            Kıta: {current.continent}
          </div>
        )}

        {game.queue.length > 1 && (
          <div className="absolute top-2 right-2 bg-card/80 backdrop-blur border border-border text-muted-foreground px-2.5 py-1 rounded-md text-xs z-10 pointer-events-none">
            Kalan: {game.queue.length - 1}
          </div>
        )}

        {/* Game complete overlay */}
        {gameComplete && (
          <div className="absolute inset-0 bg-background/90 flex items-center justify-center z-20 px-4">
            <div className="bg-card p-6 sm:p-8 rounded-xl border border-border text-center w-full max-w-sm shadow-2xl">
              <Trophy className="w-14 h-14 text-yellow-400 mx-auto mb-3" />
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Tebrikler!</h2>
              <p className="text-muted-foreground text-sm mb-5">Tüm ülkeleri tamamladınız!</p>
              <div className="flex justify-center gap-6 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">{game.score}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Doğru</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{game.attempts}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Deneme</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">{accuracy}%</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Başarı</p>
                </div>
              </div>
              <button
                onClick={() => resetGame()}
                className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <RotateCcw className="w-4 h-4" />
                Yeniden Oyna
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="shrink-0 flex items-center justify-between gap-2 px-3 py-2 bg-card border-t border-border">
        {/* Stats */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-foreground font-medium tabular-nums text-sm">
              {game.done.length}/{playable.size}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-green-400" />
            <span className="text-foreground font-medium tabular-nums text-sm">{accuracy}%</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowCountryList(true)}
            aria-label="Ulke listesi"
            className="flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-md text-xs font-medium bg-slate-500/10 border border-slate-500/30 text-slate-300 hover:bg-slate-500/20 active:scale-95 transition-all"
          >
            <List className="w-4 h-4 shrink-0" />
            <span>Ülkeler</span>
          </button>

          <button
            onClick={() => dispatch({ type: "hint" })}
            disabled={!playing || game.hintUsed}
            aria-label="Ipucu"
            title="İpucu bir hata sayılır"
            className="flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-md text-xs font-medium bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Lightbulb className="w-4 h-4 shrink-0" />
            <span>İpucu</span>
          </button>

          <button
            onClick={() => dispatch({ type: "skip" })}
            disabled={!playing || game.queue.length < 2}
            aria-label="Pas gec"
            className="flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-md text-xs font-medium bg-slate-500/10 border border-slate-500/30 text-slate-300 hover:bg-slate-500/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <SkipForward className="w-4 h-4 shrink-0" />
            <span>Pas</span>
          </button>

          <button
            onClick={() => resetGame()}
            aria-label="Sifirla"
            className="flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-md text-xs font-medium bg-slate-500/10 border border-slate-500/30 text-slate-300 hover:bg-slate-500/20 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>Sıfırla</span>
          </button>
        </div>
      </footer>

      {showCountryList && (
        <CountryListModal
          completedCountries={game.done}
          includeSmallIslands={includeSmallIslands}
          onToggleSmallIslands={(value) => resetGame(updateSettings({ includeSmallIslands: value }).includeSmallIslands)}
          showWrongAnswer={showWrongAnswer}
          onToggleShowWrongAnswer={(value) => updateSettings({ showWrongAnswer: value })}
          onClose={() => setShowCountryList(false)}
        />
      )}
    </div>
  );
}
