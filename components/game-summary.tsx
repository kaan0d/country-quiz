"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Dumbbell, House, RotateCcw, Share2 } from "lucide-react";
import { flagUrl, type Country } from "@/lib/countries";
import type { GameState } from "@/lib/game";
import { countryName, type Lang, type Strings } from "@/lib/i18n";

const formatTime = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// Counts up from 0 to the value with an ease-out, starting after a delay
function CountUp({ to, delay = 0, suffix = "" }: { to: number; delay?: number; suffix?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return setN(to);
    let frame = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const p = Math.min(Math.max((now - start) / 900, 0), 1);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, delay]);
  return <>{n}{suffix}</>;
}

// Round rubber stamp with the result title running around its rim
function Seal({ text, accuracy }: { text: string; accuracy: number }) {
  const rim = `${text} · ${text} · `.toLocaleUpperCase();
  return (
    <svg viewBox="0 0 120 120" className="w-28 h-28 sm:w-32 sm:h-32 text-seal animate-stamp" style={{ animationDelay: "0.25s" }} aria-hidden>
      <defs>
        <path id="seal-rim" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" />
      </defs>
      <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="60" cy="60" r="34" fill="none" stroke="currentColor" strokeWidth="1" />
      <text fill="currentColor" fontSize="9.5" letterSpacing="2" fontFamily="var(--font-mono)">
        <textPath href="#seal-rim" textLength="270">{rim}</textPath>
      </text>
      <text x="60" y="67" textAnchor="middle" fill="currentColor" fontSize="22" fontFamily="var(--font-display)" fontStyle="italic">
        {accuracy}%
      </text>
    </svg>
  );
}

const rise = (i: number) => ({ "--i": i }) as CSSProperties;

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
  onMenu,
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
  onMenu: () => void;
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

  const stats: [string, React.ReactNode][] = [
    [t.correctCount, <CountUp key="c" to={game.score} delay={400} />],
    [t.attemptsCount, <CountUp key="a" to={game.attempts} delay={500} />],
    [t.accuracy, <CountUp key="p" to={accuracy} delay={600} suffix="%" />],
    ...(game.timeLimit ? [] : [[t.time, formatTime((game.endedAt ?? game.startedAt) - game.startedAt)] as [string, React.ReactNode]]),
  ];

  const button = "plate flex items-center justify-center gap-2 px-5 py-3 rounded-sm font-semibold text-sm";

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center px-4 py-6 overflow-y-auto overflow-x-hidden bg-ink/25 backdrop-blur-[2px] animate-fade">
      <div className="relative bg-paper neatline shadow-[8px_8px_0_var(--ink)] w-full max-w-md p-7 sm:p-9 my-auto animate-sheet">
        <div className="absolute -top-8 -right-2 sm:-top-10 sm:-right-10">
          <Seal text={title} accuracy={accuracy} />
        </div>

        <p className="smallcaps text-ink-soft animate-rise" style={rise(1)}>{subtitle}</p>
        <h2 className="font-display text-4xl sm:text-5xl leading-[0.95] mt-1 pr-16 animate-rise" style={rise(2)}>{title}</h2>

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 mt-6 py-4 border-y border-ink animate-rise" style={rise(3)}>
          {stats.map(([label, value]) => (
            <div key={label}>
              <dt className="smallcaps text-ink-soft">{label}</dt>
              <dd className="font-display text-3xl tabular-nums leading-tight">{value}</dd>
            </div>
          ))}
        </dl>

        {share && <p className="text-xl tracking-[0.2em] mt-4 animate-rise" style={rise(4)}>{share.split("\n")[1]}</p>}

        {!game.practice && !game.daily && best !== undefined && (
          <p className="mt-4 animate-rise" style={rise(4)}>
            {newRecord ? (
              <span className="inline-block font-display italic text-xl text-paper bg-seal px-3 py-0.5 -rotate-2 animate-stamp" style={{ animationDelay: "0.9s" }}>
                {t.newRecord}
              </span>
            ) : (
              <span className="smallcaps text-ink-soft">
                {t.best}: {game.timeLimit ? best : `${best}%`}
              </span>
            )}
          </p>
        )}

        {mostMissed.length > 0 && (
          <div className="mt-6">
            <p className="smallcaps text-ink-soft mb-2 animate-rise" style={rise(5)}>{t.mostMissed}</p>
            <ul className="flex flex-col">
              {mostMissed.map(([code, n], i) => {
                const c = byCode.get(code);
                if (!c) return null;
                return (
                  <li key={code} className="flex items-center gap-2.5 py-1 text-sm animate-rise" style={rise(6 + i)}>
                    <img src={flagUrl(c.code2)} alt="" width={22} height={15} className="object-cover ring-1 ring-ink-faint" style={{ width: 22, height: 15 }} />
                    <span className="truncate">{countryName(c, lang)}</span>
                    <span className="flex-1 border-b border-dotted border-ink-soft/50 translate-y-1" />
                    <span className="font-mono text-seal tabular-nums">{n}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-3 mt-7 animate-rise" style={rise(11)}>
          {share && (
            <button onClick={copyShare} className={`${button} !bg-verdigris text-paper`}>
              <Share2 className="w-4 h-4" />
              {copied ? t.copied : t.shareResult}
            </button>
          )}
          <button onClick={onPlayAgain} className={`${button} !bg-seal text-paper`}>
            <RotateCcw className="w-4 h-4" />
            {t.playAgain}
          </button>
          <div className="grid sm:grid-cols-2 gap-3">
            {practiceCount > 0 && (
              <button onClick={onPractice} className={button}>
                <Dumbbell className="w-4 h-4 shrink-0" />
                <span className="truncate">{t.practice(practiceCount)}</span>
              </button>
            )}
            <button onClick={onMenu} className={`${button} ${practiceCount > 0 ? "" : "sm:col-span-2"}`}>
              <House className="w-4 h-4" />
              {t.menu}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
