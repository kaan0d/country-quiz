"use client";

import { RotateCcw } from "lucide-react";
import { Chip, Modal } from "./modal";
import type { Lang, Strings } from "@/lib/i18n";

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
  lang,
  includeSmallIslands,
  showWrongAnswer,
  onChange,
  onNewGame,
  onClose,
}: {
  t: Strings;
  lang: Lang;
  includeSmallIslands: boolean;
  showWrongAnswer: boolean;
  onChange: (patch: { lang?: Lang; includeSmallIslands?: boolean; showWrongAnswer?: boolean }) => void;
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
              <Chip key={l} active={lang === l} onClick={() => onChange({ lang: l })}>
                {l === "tr" ? "Türkçe" : "English"}
              </Chip>
            ))}
          </div>
        </div>
        <Toggle
          label={t.smallIslands}
          description={t.smallIslandsInfo}
          value={includeSmallIslands}
          onChange={(v) => onChange({ includeSmallIslands: v })}
        />
        <Toggle
          label={t.showWrong}
          description={t.showWrongInfo}
          value={showWrongAnswer}
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
