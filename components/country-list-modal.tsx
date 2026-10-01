"use client";

import { useState, useMemo } from "react";
import { countries, type Continent } from "@/lib/countries";
import { Check, Search } from "lucide-react";
import { Modal } from "./modal";

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
  done: string[]; // alpha-3
  playable: Set<string>;
  onClose: () => void;
}

export function CountryListModal({ done, playable, onClose }: CountryListModalProps) {
  const [search, setSearch] = useState("");
  const [activeContinent, setActiveContinent] = useState<Continent | "Tümü">("Tümü");

  const filtered = useMemo(() => {
    return countries.filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchContinent = activeContinent === "Tümü" || c.continent === activeContinent;
      return matchSearch && matchContinent;
    });
  }, [search, activeContinent]);

  return (
    <Modal title="Tüm Ülkeler" subtitle={`${done.length} / ${playable.size} tamamlandı`} onClose={onClose}>
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
              const isDone = done.includes(country.code);
              const isExcluded = !playable.has(country.code);
              return (
                <div
                  key={country.code}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${isExcluded
                    ? "bg-muted/10 border-transparent opacity-40"
                    : isDone
                      ? "bg-green-950/30 border-green-800/40"
                      : "bg-muted/30 border-transparent"
                    }`}
                >
                  <img
                    src={`/flags/${country.code2}.png`}
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
                    <p className={`text-sm font-medium truncate ${isExcluded ? "text-muted-foreground" : isDone ? "text-green-400" : "text-foreground"
                      }`}>
                      {country.name}
                      {country.isSmallIsland && (
                        <span className="ml-1 text-xs text-muted-foreground">(Ada)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{country.continent}</p>
                  </div>
                  {isDone && !isExcluded && <Check className="w-4 h-4 text-green-400 shrink-0" />}
                  {isExcluded && <span className="text-xs text-muted-foreground">Hariç</span>}
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">Sonuç bulunamadı.</p>
          )}
        </div>
    </Modal>
  );
}
