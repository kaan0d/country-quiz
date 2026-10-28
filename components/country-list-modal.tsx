"use client";

import { useState, useMemo } from "react";
import { countries, CONTINENTS, flagUrl, type Continent } from "@/lib/countries";
import { countryName, type Lang, type Strings } from "@/lib/i18n";
import { Check, Search } from "lucide-react";
import { Chip, Modal } from "./modal";

interface CountryListModalProps {
  t: Strings;
  lang: Lang;
  done: string[]; // alpha-3
  playable: Set<string>;
  onClose: () => void;
}

// A gazetteer: the index at the back of an atlas, with dotted leaders to each entry's status
export function CountryListModal({ t, lang, done, playable, onClose }: CountryListModalProps) {
  const [search, setSearch] = useState("");
  const [activeContinent, setActiveContinent] = useState<Continent | "all">("all");

  const filtered = useMemo(() => {
    const q = search.toLocaleLowerCase(lang);
    return countries
      .filter((c) => {
        const matchSearch = countryName(c, lang).toLocaleLowerCase(lang).includes(q);
        const matchContinent = activeContinent === "all" || c.continent === activeContinent;
        return matchSearch && matchContinent;
      })
      .sort((a, b) => countryName(a, lang).localeCompare(countryName(b, lang), lang));
  }, [search, activeContinent, lang]);

  return (
    <Modal title={t.allCountries} subtitle={t.completed(done.length, playable.size)} closeLabel={t.close} onClose={onClose}>
        <div className="mx-6 pt-4 pb-2 shrink-0">
          <label className="flex items-center gap-2 border-b border-ink pb-1.5 focus-within:border-seal transition-colors">
            <Search className="w-4 h-4 text-ink-soft shrink-0" />
            <input
              type="search"
              placeholder={t.search}
              aria-label={t.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent font-display italic text-lg placeholder:text-ink-soft/60 outline-none"
            />
          </label>
        </div>

        <div className="mx-6 pb-3 flex gap-1.5 flex-wrap shrink-0">
          {(["all", ...CONTINENTS] as const).map((c) => (
            <Chip key={c} active={activeContinent === c} onClick={() => setActiveContinent(c)}>
              {c === "all" ? t.all : t.continents[c]}
            </Chip>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 px-6 pb-6">
          <ul className="sm:columns-2 gap-8">
            {filtered.map((country) => {
              const isDone = done.includes(country.code);
              const isExcluded = !playable.has(country.code);
              return (
                <li key={country.code} className={`break-inside-avoid flex items-center gap-2.5 py-1.5 text-sm ${isExcluded ? "opacity-40" : ""}`}>
                  <img
                    src={flagUrl(country.code2)}
                    alt={t.flagAlt(countryName(country, lang))}
                    width={22}
                    height={15}
                    className="object-cover shrink-0 ring-1 ring-ink-faint"
                    style={{ width: 22, height: 15 }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <span className={`truncate ${isDone && !isExcluded ? "text-verdigris font-semibold" : ""}`}>
                    {countryName(country, lang)}
                    {country.isSmallIsland && <span className="ml-1 text-xs text-ink-soft">({t.island})</span>}
                  </span>
                  <span className="flex-1 min-w-4 border-b border-dotted border-ink-soft/50 translate-y-1" />
                  {isExcluded ? (
                    <span className="smallcaps text-ink-soft">{t.excluded}</span>
                  ) : isDone ? (
                    <Check className="w-4 h-4 text-verdigris shrink-0" />
                  ) : (
                    <span className="w-4 h-4 shrink-0 rounded-full border border-ink-soft/50" />
                  )}
                </li>
              );
            })}
          </ul>
          {filtered.length === 0 && (
            <p className="text-center font-display italic text-ink-soft text-lg py-10">{t.noResults}</p>
          )}
        </div>
    </Modal>
  );
}
