"use client";

import { useState, useMemo } from "react";
import { countries, type Continent } from "@/lib/countries";
import { X, Check, Search, Settings } from "lucide-react";

const CONTINENTS: Continent[] = [
  "Avrupa",
  "Asya",
  "Afrika",
  "Kuzey Amerika",
  "Güney Amerika",
  "Okyanusya",
  "Antarktika",
];

interface CountryListModalProps {
  completedCountries: string[]; // alpha-3
  includeSmallIslands: boolean;
  onToggleSmallIslands: (value: boolean) => void;
  showWrongAnswer: boolean;
  onToggleShowWrongAnswer: (value: boolean) => void;
  onClose: () => void;
}

export function CountryListModal({
  completedCountries,
  includeSmallIslands,
  onToggleSmallIslands,
  showWrongAnswer,
  onToggleShowWrongAnswer,
  onClose
}: CountryListModalProps) {
  const [search, setSearch] = useState("");
  const [activeContinent, setActiveContinent] = useState<Continent | "Tümü">("Tümü");
  const [showSettings, setShowSettings] = useState(false);

  const filtered = useMemo(() => {
    return countries.filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchContinent = activeContinent === "Tümü" || c.continent === activeContinent;
      return matchSearch && matchContinent;
    });
  }, [search, activeContinent]);

  // Count based on current filter setting
  const activeCountries = includeSmallIslands
    ? countries
    : countries.filter(c => !c.isSmallIsland);
  const completedCount = completedCountries.length;
  const totalCount = activeCountries.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-bold text-foreground">Tüm Ülkeler</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {completedCount} / {totalCount} tamamlandı
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-lg transition-colors ${showSettings
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              aria-label="Ayarlar"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="px-5 py-3 border-b border-border bg-muted/30 shrink-0 flex flex-col gap-4">
            {/* Small islands toggle */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">Küçük Adaları Dahil Et</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Haritada zor bulunan küçük ada ülkelerini oyuna dahil et
                </p>
              </div>
              <button
                onClick={() => onToggleSmallIslands(!includeSmallIslands)}
                className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${includeSmallIslands ? "bg-green-500" : "bg-muted"
                  }`}
                aria-label={includeSmallIslands ? "Küçük adaları kaldır" : "Küçük adaları ekle"}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${includeSmallIslands ? "translate-x-5" : "translate-x-0"
                    }`}
                />
              </button>
            </div>

            {/* Show wrong answer toggle */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">Yanlış Cevapta Ülke Adını Göster</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Yanlış tıklamada hedef ülkenin adı ekranda görünsün
                </p>
              </div>
              <button
                onClick={() => onToggleShowWrongAnswer(!showWrongAnswer)}
                className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${showWrongAnswer ? "bg-green-500" : "bg-muted"
                  }`}
                aria-label={showWrongAnswer ? "Ulke adini gizle" : "Ulke adini goster"}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${showWrongAnswer ? "translate-x-5" : "translate-x-0"
                    }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="px-5 pt-3 pb-2 shrink-0">
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Ülke ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
        </div>

        {/* Continent filter */}
        <div className="px-5 pb-3 flex gap-1.5 flex-wrap shrink-0">
          {(["Tümü", ...CONTINENTS] as const).map((c) => (
            <button
              key={c}
              onClick={() => setActiveContinent(c)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${activeContinent === c
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-5 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {filtered.map((country) => {
              const done = completedCountries.includes(country.code);
              const isExcluded = !includeSmallIslands && country.isSmallIsland;
              return (
                <div
                  key={country.code}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${isExcluded
                    ? "bg-muted/10 border-transparent opacity-40"
                    : done
                      ? "bg-green-950/30 border-green-800/40"
                      : "bg-muted/30 border-transparent"
                    }`}
                >
                  {/* Real flag from flagcdn.com */}
                  <img
                    src={`https://flagcdn.com/w40/${country.code2}.png`}
                    srcSet={`https://flagcdn.com/w80/${country.code2}.png 2x`}
                    alt={`${country.name} bayrağı`}
                    width={28}
                    height={20}
                    className="rounded-sm object-cover shrink-0"
                    style={{ width: 28, height: 20 }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isExcluded ? "text-muted-foreground" : done ? "text-green-400" : "text-foreground"
                      }`}>
                      {country.name}
                      {country.isSmallIsland && (
                        <span className="ml-1 text-xs text-muted-foreground">(Ada)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{country.continent}</p>
                  </div>
                  {done && !isExcluded && <Check className="w-4 h-4 text-green-400 shrink-0" />}
                  {isExcluded && <span className="text-xs text-muted-foreground">Hariç</span>}
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">Sonuç bulunamadı.</p>
          )}
        </div>
      </div>
    </div>
  );
}
