"use client";

import { RotateCcw } from "lucide-react";
import { Chip, Modal } from "./modal";
import type { Strings } from "@/lib/i18n";
import { CONTINENTS } from "@/lib/countries";
import type { Settings } from "./country-game";

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
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
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${value ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

export function SettingsModal({
  t,
  settings,
  onChange,
  onNewGame,
  onClose,
}: {
  t: Strings;
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onNewGame: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title={t.settings} closeLabel={t.close} onClose={onClose}>
      <div className="overflow-y-auto px-5 py-4 flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-foreground">{t.language}</p>
          <div className="flex gap-1.5">
            {(["tr", "en"] as const).map((l) => (
              <Chip key={l} active={settings.lang === l} onClick={() => onChange({ lang: l })}>
                {l === "tr" ? "Türkçe" : "English"}
              </Chip>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm font-medium text-foreground">{t.mode}</p>
          <div className="flex gap-1.5 flex-wrap">
            {(["name", "flag", "capital", "reverse"] as const).map((m) => (
              <Chip key={m} active={settings.mode === m} onClick={() => onChange({ mode: m })}>
                {t.modes[m]}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{t.region}</p>
          <p className="text-xs text-muted-foreground mt-0.5 mb-2">{t.regionInfo}</p>
          <div className="flex gap-1.5 flex-wrap">
            {(["all", ...CONTINENTS.filter((c) => c !== "antarctica")] as const).map((r) => (
              <Chip key={r} active={settings.region === r} onClick={() => onChange({ region: r })}>
                {r === "all" ? t.world : t.continents[r]}
              </Chip>
            ))}
          </div>
        </div>
        <Toggle
          label={t.smallIslands}
          description={t.smallIslandsInfo}
          value={settings.includeSmallIslands}
          onChange={(v) => onChange({ includeSmallIslands: v })}
        />
        <Toggle
          label={t.showWrong}
          description={t.showWrongInfo}
          value={settings.showWrongAnswer}
          onChange={(v) => onChange({ showWrongAnswer: v })}
        />
        <button
          onClick={onNewGame}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <RotateCcw className="w-4 h-4" />
          {t.newGame}
        </button>
      </div>
    </Modal>
  );
}
