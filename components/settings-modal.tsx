"use client";

import { RotateCcw } from "lucide-react";
import { Modal } from "./modal";

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
  includeSmallIslands,
  showWrongAnswer,
  onChange,
  onNewGame,
  onClose,
}: {
  includeSmallIslands: boolean;
  showWrongAnswer: boolean;
  onChange: (patch: { includeSmallIslands?: boolean; showWrongAnswer?: boolean }) => void;
  onNewGame: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title="Ayarlar" onClose={onClose}>
      <div className="overflow-y-auto px-5 py-4 flex flex-col gap-5">
        <Toggle
          label="Küçük Adaları Dahil Et"
          description="Haritada zor bulunan küçük ada ülkelerini oyuna dahil et (yeni oyun başlar)"
          value={includeSmallIslands}
          onChange={(v) => onChange({ includeSmallIslands: v })}
        />
        <Toggle
          label="Yanlış Cevapta Ülke Adını Göster"
          description="Yanlış tıklamada tıklanan ülkenin adı ekranda görünsün"
          value={showWrongAnswer}
          onChange={(v) => onChange({ showWrongAnswer: v })}
        />
        <button
          onClick={onNewGame}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <RotateCcw className="w-4 h-4" />
          Yeni Oyun
        </button>
      </div>
    </Modal>
  );
}
