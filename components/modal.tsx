"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({
  title,
  subtitle,
  closeLabel,
  onClose,
  children,
}: {
  title: string;
  closeLabel: string;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-ink/40 backdrop-blur-[2px] animate-fade"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="bg-paper neatline w-full max-w-2xl max-h-[88svh] flex flex-col shadow-[6px_6px_0_var(--ink)] animate-sheet"
      >
        <div className="flex items-end justify-between gap-4 mx-6 pt-6 pb-3 border-b border-ink shrink-0">
          <div>
            {subtitle && <p className="smallcaps text-ink-soft mb-1">{subtitle}</p>}
            <h2 className="font-display text-3xl leading-none">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full text-ink-soft hover:text-seal hover:rotate-90 transition-all duration-300"
            aria-label={closeLabel}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-200 ${active
        ? "bg-ink text-paper border-ink"
        : "border-ink-faint text-ink-soft hover:border-ink hover:text-ink"
        }`}
    >
      {children}
    </button>
  );
}
