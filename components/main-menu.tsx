"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  CircleHelp,
  Dumbbell,
  Flag,
  Keyboard,
  Landmark,
  Map as MapIcon,
  MapPin,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import { Chip } from "./modal";
import { Globe } from "./globe";
import type { Strings } from "@/lib/i18n";
import { CONTINENTS } from "@/lib/countries";
import { today } from "@/lib/daily";
import type { Mode, Settings } from "./country-game";

const MODES: [Mode, LucideIcon][] = [
  ["name", MapPin],
  ["flag", Flag],
  ["capital", Landmark],
  ["reverse", CircleHelp],
  ["typed", Keyboard],
  ["neighbors", Waypoints],
];

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

export type StartKind = "new" | "practice" | "daily";

// Staggered entrance: each element rises a little after the one before it
const rise = (i: number) => ({ "--i": i }) as CSSProperties;

function Toggle({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-dashed">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-ink-soft mt-0.5">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        className={`relative shrink-0 w-12 h-7 rounded-full border border-ink transition-colors duration-300 ${value ? "bg-seal" : "bg-paper-deep"}`}
      >
        <span
          className={`absolute top-[3px] left-[3px] w-5 h-5 rounded-full border border-ink transition-transform duration-300 ease-[cubic-bezier(0.3,1.4,0.5,1)] ${value ? "translate-x-5 bg-paper" : "bg-ink"}`}
        />
      </button>
    </div>
  );
}

function Section({ title, index, children, style }: { title: string; index: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <section className="flex flex-col gap-4 animate-rise" style={style}>
      <h2 className="flex items-center gap-3">
        <span className="font-display italic text-seal text-lg">§{index}</span>
        <span className="smallcaps text-ink-soft">{title}</span>
        <span className="flex-1 h-px bg-ink-faint" />
      </h2>
      {children}
    </section>
  );
}

const secondary =
  "plate flex items-center gap-3 px-4 py-3.5 rounded-sm text-left text-sm font-semibold";

// Game setup is a draft until Play, so looking around the menu never throws away a running game.
// Language, sound and the wrong-name toggle are preferences and apply right away.
export function MainMenu({
  t,
  settings,
  onPreferences,
  resume,
  onContinue,
  onStart,
  practiceCount,
  onExplore,
}: {
  t: Strings;
  settings: Settings;
  onPreferences: (patch: Partial<Settings>) => void;
  resume: string | null; // progress of the unfinished game, null when there is none
  onContinue: () => void;
  onStart: (setup: Settings, kind: StartKind) => void;
  practiceCount: (setup: Settings) => number;
  onExplore: () => void;
}) {
  const [setup, setSetup] = useState(settings);
  const draft = { ...setup, lang: settings.lang, sound: settings.sound, showWrongAnswer: settings.showWrongAnswer };
  const edit = (patch: Partial<Settings>) => setSetup({ ...setup, ...patch });
  const practice = practiceCount(draft);
  const words = t.appTitle.split(" ");

  const playButton = (
    <button
      onClick={() => onStart(draft, "new")}
      className="plate group w-full flex items-center justify-between gap-3 px-6 py-4 rounded-sm !bg-seal text-paper"
    >
      <span className="font-display italic text-2xl">{t.play}</span>
      <span className="smallcaps opacity-80 hidden sm:inline">{t.modes[setup.mode]} · {setup.region === "all" ? t.world : t.continents[setup.region]}</span>
      <ArrowRight className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-1.5" />
    </button>
  );

  return (
    <div className="fixed inset-0 z-40 bg-paper overflow-y-auto overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-4 pb-32 lg:pb-16 flex flex-col gap-10">
        <header className="flex items-center justify-between gap-4 border-b border-ink pb-3 animate-fade">
          <p className="smallcaps text-ink-soft">
            Atlas · {today()}
          </p>
          <div className="flex gap-1.5 shrink-0" role="group" aria-label={t.language}>
            {(["tr", "en"] as const).map((l) => (
              <Chip key={l} active={settings.lang === l} onClick={() => onPreferences({ lang: l })}>
                {l.toUpperCase()}
              </Chip>
            ))}
          </div>
        </header>

        {/* Title and globe overlap on purpose: the globe hangs off the right edge on a phone */}
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] items-center gap-6 lg:gap-10 -mt-4">
          <div className="relative z-10 flex flex-col gap-6 order-2 lg:order-1 -mt-16 sm:-mt-32 lg:mt-0">
            <h1 className="font-display font-light leading-[0.88] tracking-tight text-[clamp(3.4rem,11vw,7.5rem)] animate-rise" style={rise(1)}>
              {words.slice(0, -1).join(" ")}{" "}
              <em className="text-seal font-normal">{words[words.length - 1]}</em>
            </h1>
            <p className="max-w-md text-ink-soft text-base sm:text-lg animate-rise" style={rise(2)}>{t.tagline}</p>

            {resume && (
              <button
                onClick={onContinue}
                className="plate group self-start flex items-center gap-4 px-5 py-3 rounded-sm text-left animate-rise"
                style={rise(3)}
              >
                <span>
                  <span className="block font-display italic text-xl">{t.continueGame}</span>
                  <span className="block smallcaps text-ink-soft">{resume}</span>
                </span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            )}
            <div className="hidden lg:block max-w-md animate-rise" style={rise(4)}>{playButton}</div>
          </div>

          <figure className="order-1 lg:order-2 justify-self-end w-[78vw] max-w-[540px] -mr-[18vw] sm:-mr-8 lg:mr-0 animate-fade">
            <Globe region={setup.region} className="w-full" />
            <figcaption className="smallcaps text-ink-soft text-center mt-2 hidden lg:block">
              Fig. 1 — {setup.region === "all" ? t.world : t.continents[setup.region]}
            </figcaption>
          </figure>
        </div>

        <Section title={t.mode} index="1" style={rise(5)}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {MODES.map(([m, Icon], i) => {
              const active = setup.mode === m;
              return (
                <button
                  key={m}
                  onClick={() => edit({ mode: m })}
                  aria-pressed={active}
                  className={`plate group relative flex flex-col items-start gap-2 p-4 rounded-sm text-left overflow-hidden ${active ? "!bg-ink text-paper" : ""}`}
                >
                  <span className={`absolute -right-1 -top-3 font-display italic text-6xl leading-none transition-colors ${active ? "text-paper/15" : "text-ink-faint"}`}>
                    {ROMAN[i]}
                  </span>
                  <Icon className={`w-5 h-5 ${active ? "text-ochre" : "text-seal"}`} />
                  <span className="font-display text-xl leading-tight">{t.modes[m]}</span>
                  <span className={`text-xs leading-snug ${active ? "text-paper/75" : "text-ink-soft"}`}>{t.modeInfo[m]}</span>
                </button>
              );
            })}
          </div>
        </Section>

        <div className="grid lg:grid-cols-2 gap-10">
          <Section title={t.region} index="2" style={rise(6)}>
            <div className="flex gap-1.5 flex-wrap">
              {(["all", ...CONTINENTS.filter((c) => c !== "antarctica")] as const).map((r) => (
                <Chip key={r} active={setup.region === r} onClick={() => edit({ region: r })}>
                  {r === "all" ? t.world : t.continents[r]}
                </Chip>
              ))}
            </div>
            <div className="flex flex-col">
              <Toggle label={t.timed} description={t.timedInfo} value={setup.timed} onChange={(v) => edit({ timed: v })} />
              <Toggle label={t.smallIslands} description={t.smallIslandsInfo} value={setup.includeSmallIslands} onChange={(v) => edit({ includeSmallIslands: v })} />
            </div>
          </Section>

          <Section title={t.settings} index="3" style={rise(7)}>
            <div className="grid sm:grid-cols-3 lg:grid-cols-1 gap-3">
              <button onClick={() => onStart(draft, "daily")} className={secondary}>
                <CalendarDays className="w-5 h-5 text-seal shrink-0" />
                {t.dailyStart}
              </button>
              <button onClick={() => onStart(draft, "practice")} disabled={!practice} className={secondary}>
                <Dumbbell className="w-5 h-5 text-seal shrink-0" />
                {t.practice(practice)}
              </button>
              <button onClick={onExplore} className={secondary}>
                <MapIcon className="w-5 h-5 text-seal shrink-0" />
                {t.explore}
              </button>
            </div>
            <div className="flex flex-col">
              <Toggle label={t.showWrong} description={t.showWrongInfo} value={settings.showWrongAnswer} onChange={(v) => onPreferences({ showWrongAnswer: v })} />
              <Toggle label={t.sound} description={t.soundInfo} value={settings.sound} onChange={(v) => onPreferences({ sound: v })} />
            </div>
          </Section>
        </div>

        <p className="smallcaps text-ink-soft text-center border-t border-ink pt-3">{t.shortcuts}</p>
      </div>

      {/* On a phone Play stays at the bottom while the options scroll under it */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-10 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-paper via-paper/95 to-transparent">
        {playButton}
      </div>
    </div>
  );
}
