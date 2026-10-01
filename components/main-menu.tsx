"use client";

import { useState, type ReactNode } from "react";
import {
  CalendarDays,
  CircleHelp,
  Dumbbell,
  Earth,
  Flag,
  Keyboard,
  Landmark,
  Map as MapIcon,
  MapPin,
  Play,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import { Chip } from "./modal";
import type { Strings } from "@/lib/i18n";
import { CONTINENTS } from "@/lib/countries";
import type { Mode, Settings } from "./country-game";

const MODES: [Mode, LucideIcon][] = [
  ["name", MapPin],
  ["flag", Flag],
  ["capital", Landmark],
  ["reverse", CircleHelp],
  ["typed", Keyboard],
  ["neighbors", Waypoints],
];

export type StartKind = "new" | "practice" | "daily";

function Toggle({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${value ? "bg-green-500" : "bg-muted"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${value ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

const secondary =
  "flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-lg bg-card border border-border text-foreground text-xs font-medium text-center hover:bg-muted active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all";

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

  return (
    <div className="fixed inset-0 z-40 bg-background overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10 flex flex-col gap-7">
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Earth className="w-10 h-10 text-yellow-400 shrink-0" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">{t.appTitle}</h1>
              <p className="text-sm text-muted-foreground">{t.tagline}</p>
            </div>
          </div>
          <div className="flex gap-1.5 shrink-0" role="group" aria-label={t.language}>
            {(["tr", "en"] as const).map((l) => (
              <Chip key={l} active={settings.lang === l} onClick={() => onPreferences({ lang: l })}>
                {l.toUpperCase()}
              </Chip>
            ))}
          </div>
        </header>

        {resume && (
          <button
            onClick={onContinue}
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-yellow-500/40 bg-yellow-500/10 text-left hover:bg-yellow-500/15 transition-colors"
          >
            <span>
              <span className="block font-semibold text-yellow-400">{t.continueGame}</span>
              <span className="block text-xs text-muted-foreground">{resume}</span>
            </span>
            <Play className="w-5 h-5 text-yellow-400 shrink-0" />
          </button>
        )}

        <Section title={t.mode}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {MODES.map(([m, Icon]) => {
              const active = setup.mode === m;
              return (
                <button
                  key={m}
                  onClick={() => edit({ mode: m })}
                  aria-pressed={active}
                  className={`flex flex-col items-start gap-1.5 p-3 rounded-lg border text-left transition-colors ${
                    active ? "border-yellow-500 bg-yellow-500/10" : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? "text-yellow-400" : "text-muted-foreground"}`} />
                  <span className="text-sm font-semibold text-foreground">{t.modes[m]}</span>
                  <span className="text-xs text-muted-foreground leading-snug">{t.modeInfo[m]}</span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title={t.region}>
          <div className="flex gap-1.5 flex-wrap">
            {(["all", ...CONTINENTS.filter((c) => c !== "antarctica")] as const).map((r) => (
              <Chip key={r} active={setup.region === r} onClick={() => edit({ region: r })}>
                {r === "all" ? t.world : t.continents[r]}
              </Chip>
            ))}
          </div>
          <div className="flex flex-col gap-4 mt-2">
            <Toggle label={t.timed} description={t.timedInfo} value={setup.timed} onChange={(v) => edit({ timed: v })} />
            <Toggle label={t.smallIslands} description={t.smallIslandsInfo} value={setup.includeSmallIslands} onChange={(v) => edit({ includeSmallIslands: v })} />
          </div>
        </Section>

        {/* Stays on screen while scrolling the options above it on a phone; a direct child of the
            scrolling column, since sticky only moves within its parent */}
        <div className="sticky bottom-0 z-10 -mx-4 px-4 py-2 -my-5 bg-background/90 backdrop-blur">
            <button
              onClick={() => onStart(draft, "new")}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:opacity-90 active:scale-[0.99] transition-all"
            >
              <Play className="w-5 h-5" />
              {t.play}
            </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
            <button onClick={() => onStart(draft, "daily")} className={secondary}>
              <CalendarDays className="w-4 h-4 text-yellow-400" />
              {t.dailyStart}
            </button>
            <button onClick={() => onStart(draft, "practice")} disabled={!practice} className={secondary}>
              <Dumbbell className="w-4 h-4 text-yellow-400" />
              {t.practice(practice)}
            </button>
            <button onClick={onExplore} className={secondary}>
              <MapIcon className="w-4 h-4 text-yellow-400" />
              {t.explore}
            </button>
        </div>

        <Section title={t.settings}>
          <div className="flex flex-col gap-4">
            <Toggle label={t.showWrong} description={t.showWrongInfo} value={settings.showWrongAnswer} onChange={(v) => onPreferences({ showWrongAnswer: v })} />
            <Toggle label={t.sound} description={t.soundInfo} value={settings.sound} onChange={(v) => onPreferences({ sound: v })} />
          </div>
        </Section>

        <p className="text-xs text-muted-foreground text-center">{t.shortcuts}</p>
      </div>
    </div>
  );
}
