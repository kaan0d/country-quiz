"use client";

import { useState } from "react";
import { Dumbbell, RotateCcw, Share2, Trophy } from "lucide-react";
import { flagUrl, type Country } from "@/lib/countries";
import type { GameState } from "@/lib/game";
import { countryName, type Lang, type Strings } from "@/lib/i18n";

const formatTime = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export function GameSummary({
  t,
  lang,
  game,
  byCode,
  best,
  newRecord,
  practiceCount,
  onPlayAgain,
  onPractice,
  share,
}: {
  t: Strings;
  lang: Lang;
  game: GameState;
  byCode: Map<string, Country>;
  best: number | undefined;
  newRecord: boolean;
  practiceCount: number;
  onPlayAgain: () => void;
  onPractice: () => void;
  share: string | null; // daily challenge result to copy
}) {
  const [copied, setCopied] = useState(false);
  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(share!);
      setCopied(true);
    } catch {}
  };
  const accuracy = game.attempts ? Math.round((game.score / game.attempts) * 100) : 0;
  const mostMissed = Object.entries(game.missed)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const title = game.daily ? t.dailyDone : game.practice ? t.practiceDone : game.timeLimit ? t.timeUp : t.congrats;
  const subtitle = game.daily ? game.daily : game.practice ? t.practiceAllDone : game.timeLimit ? t.foundInTime(game.score) : t.allDone;

  const stats = [
    [game.score, t.correctCount, "text-green-400"],
    [game.attempts, t.attemptsCount, "text-foreground"],
    [`${accuracy}%`, t.accuracy, "text-yellow-400"],
    ...(game.timeLimit ? [] : [[formatTime((game.endedAt ?? game.startedAt) - game.startedAt), t.time, "text-foreground"]]),
  ] as const;

  return (
    <div className="absolute inset-0 bg-background/90 flex items-center justify-center z-20 px-4 overflow-y-auto">
      <div className="bg-card p-6 sm:p-8 rounded-xl border border-border text-center w-full max-w-sm shadow-2xl my-4">
        <Trophy className="w-14 h-14 text-yellow-400 mx-auto mb-3" />
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{title}</h2>
        <p className="text-muted-foreground text-sm mb-5">{subtitle}</p>

        <div className="flex justify-center gap-5 mb-4">
          {stats.map(([value, label, color]) => (
            <div key={label} className="text-center">
              <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {share && <p className="text-lg tracking-wider mb-4">{share.split("\n")[1]}</p>}

        {!game.practice && !game.daily && best !== undefined && (
          <p className="text-sm mb-4">
            {newRecord ? (
              <span className="font-semibold text-yellow-400">{t.newRecord}</span>
            ) : (
              <span className="text-muted-foreground">
                {t.best}: {game.timeLimit ? best : `${best}%`}
              </span>
            )}
          </p>
        )}

        {mostMissed.length > 0 && (
          <div className="text-left mb-5">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">{t.mostMissed}</p>
            <ul className="flex flex-col gap-1">
              {mostMissed.map(([code, n]) => {
                const c = byCode.get(code);
                if (!c) return null;
                return (
                  <li key={code} className="flex items-center gap-2 text-sm text-foreground">
                    <img src={flagUrl(c.code2)} alt="" width={21} height={14} className="rounded-sm object-cover" style={{ width: 21, height: 14 }} />
                    <span className="flex-1 truncate">{countryName(c, lang)}</span>
                    <span className="text-red-400 tabular-nums">{n}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {share && (
            <button
              onClick={copyShare}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-green-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <Share2 className="w-4 h-4" />
              {copied ? t.copied : t.shareResult}
            </button>
          )}
          <button
            onClick={onPlayAgain}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <RotateCcw className="w-4 h-4" />
            {t.playAgain}
          </button>
          {practiceCount > 0 && (
            <button
              onClick={onPractice}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-muted text-foreground font-semibold text-sm hover:bg-muted/70 transition-colors"
            >
              <Dumbbell className="w-4 h-4" />
              {t.practice(practiceCount)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
