"use client";

import { useMemo, useState } from "react";
import type { ChecklistSticker } from "../../lib/checklist";
import { TOTAL_STICKERS } from "../../lib/album";
import type { StickerData, StickerId, UserName } from "../../lib/album";
import type { WorldCupGroupId } from "../../lib/worldCupGroups";
import { StickerCard } from "./StickerCard";

type StickerGridProps = {
  editor: UserName;
  stickers: Record<StickerId, StickerData>;
  visibleStickers: ChecklistSticker[];
  onTogglePegado: (stickerId: StickerId) => void;
  onIncrementRepeated: (stickerId: StickerId) => void;
  onDecrementRepeated: (stickerId: StickerId) => void;
};

type AlbumSection =
  | {
      id: "intro" | "fwc" | "cc";
      kind: "section";
      title: string;
      kicker: string;
      flag: string;
      flagUrls?: string[];
      stickers: ChecklistSticker[];
    }
  | {
      id: `group-${WorldCupGroupId}`;
      kind: "group";
      title: string;
      kicker: string;
      flag: string;
      flagUrls?: string[];
      countries: CountrySection[];
      stickers: ChecklistSticker[];
    };

type CountrySection = {
  id: string;
  title: string;
  flag: string;
  flagUrl?: string;
  stickers: ChecklistSticker[];
};

const GROUP_ORDER: WorldCupGroupId[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L"
];

export function StickerGrid({
  editor,
  stickers,
  visibleStickers,
  onTogglePegado,
  onIncrementRepeated,
  onDecrementRepeated
}: StickerGridProps) {
  const albumSections = useMemo(
    () => buildAlbumSections(visibleStickers),
    [visibleStickers]
  );
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(
    {}
  );
  const [collapsedCountries, setCollapsedCountries] = useState<
    Record<string, boolean>
  >({});
  const hasGlobalNarrowing = visibleStickers.length < TOTAL_STICKERS;

  function toggleGroup(section: AlbumSection) {
    setCollapsedGroups((current) => ({
      ...current,
      [section.id]: !(current[section.id] ?? getDefaultCollapsed(section))
    }));
  }

  function toggleCountry(countryId: string) {
    setCollapsedCountries((current) => ({
      ...current,
      [countryId]: !current[countryId]
    }));
  }

  if (visibleStickers.length === 0) {
    return (
      <div className="mt-3 rounded border border-white/70 bg-white/80 px-4 py-10 text-center shadow-xl shadow-emerald-950/10">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-950/45">
          Checklist
        </p>
        <h2 className="mt-2 text-2xl font-black text-emerald-950">
          No hay cromos con esos filtros
        </h2>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      {albumSections.map((section) => {
        const sectionStats = getStickerStats(section.stickers, stickers);
        const isCollapsed = isSectionCollapsed(section);

        return (
          <section
            className="overflow-hidden rounded border border-white/70 bg-white/80 shadow-xl shadow-emerald-950/10 backdrop-blur"
            key={section.id}
          >
            <SectionHeader
              flag={section.flag}
              flagUrls={section.flagUrls}
              isCollapsed={isCollapsed}
              kicker={section.kicker}
              stats={sectionStats}
              title={section.title}
              onToggle={() => toggleGroup(section)}
            />

            {!isCollapsed ? (
              <div className="border-t border-emerald-950/10 bg-[#fffdf7]/80 p-2.5 sm:p-3">
                {section.kind === "group" ? (
                  <div className="space-y-2.5">
                    {section.countries.map((country) => {
                      const countryStats = getStickerStats(country.stickers, stickers);
                      const countryCollapsed = Boolean(
                        collapsedCountries[country.id]
                      );

                      return (
                        <div
                          className="overflow-hidden rounded border border-emerald-950/10 bg-white/82"
                          key={country.id}
                        >
                          <CountryHeader
                            country={country}
                            isCollapsed={countryCollapsed}
                            stats={countryStats}
                            onToggle={() => toggleCountry(country.id)}
                          />

                          {!countryCollapsed ? (
                            <StickerCards
                              stickers={stickers}
                              editor={editor}
                              visibleStickers={country.stickers}
                              onTogglePegado={onTogglePegado}
                              onIncrementRepeated={onIncrementRepeated}
                              onDecrementRepeated={onDecrementRepeated}
                            />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <StickerCards
                    stickers={stickers}
                    editor={editor}
                    visibleStickers={section.stickers}
                    onTogglePegado={onTogglePegado}
                    onIncrementRepeated={onIncrementRepeated}
                    onDecrementRepeated={onDecrementRepeated}
                  />
                )}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );

  function isSectionCollapsed(section: AlbumSection) {
    const savedState = collapsedGroups[section.id];

    if (typeof savedState === "boolean") {
      return savedState;
    }

    return getDefaultCollapsed(section);
  }

  function getDefaultCollapsed(section: AlbumSection) {
    return !hasGlobalNarrowing && (section.kind === "group" || section.id === "cc");
  }
}

function SectionHeader({
  flag,
  flagUrls,
  isCollapsed,
  kicker,
  stats,
  title,
  onToggle
}: {
  flag: string;
  flagUrls?: string[];
  isCollapsed: boolean;
  kicker: string;
  stats: SectionStats;
  title: string;
  onToggle: () => void;
}) {
  return (
    <button
      className="group flex w-full items-center gap-3 bg-[radial-gradient(circle_at_12%_0%,rgba(250,204,21,.24),transparent_30%),linear-gradient(135deg,#12332c,#0b1f1b)] px-3 py-3 text-left text-white transition hover:brightness-110 sm:px-4"
      type="button"
      onClick={onToggle}
      aria-expanded={!isCollapsed}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded border border-white/25 bg-white/12 text-center text-sm leading-none shadow-inner">
        {flagUrls && flagUrls.length > 0 ? (
          <span className="grid w-full grid-cols-2 gap-px p-1">
            {flagUrls.slice(0, 4).map((flagUrl) => (
              <img
                alt=""
                className="h-4 w-full rounded-sm object-cover"
                key={flagUrl}
                src={flagUrl}
              />
            ))}
          </span>
        ) : (
          flag
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-200/90">
          {kicker}
        </span>
        <span className="mt-0.5 block truncate text-xl font-black leading-none sm:text-2xl">
          {title}
        </span>
        <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/15">
          <span
            className="block h-full rounded-full bg-gradient-to-r from-yellow-300 via-emerald-300 to-cyan-200 transition-all"
            style={{ width: `${Math.max(stats.progress, stats.pegados > 0 ? 3 : 0)}%` }}
          />
        </span>
      </span>
      <span className="hidden shrink-0 text-right sm:block">
        <span className="block text-lg font-black">{stats.progress}%</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/62">
          {stats.pegados}/{stats.total}
        </span>
      </span>
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-lg font-black transition group-hover:bg-white/18 ${
          isCollapsed ? "" : "rotate-180"
        }`}
      >
        v
      </span>
    </button>
  );
}

function CountryHeader({
  country,
  isCollapsed,
  stats,
  onToggle
}: {
  country: CountrySection;
  isCollapsed: boolean;
  stats: SectionStats;
  onToggle: () => void;
}) {
  return (
    <button
      className="flex w-full items-center gap-2 px-2.5 py-2 text-left transition hover:bg-emerald-50/80 sm:px-3"
      type="button"
      onClick={onToggle}
      aria-expanded={!isCollapsed}
    >
      <FlagMark alt={country.title} emoji={country.flag} src={country.flagUrl} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-black text-emerald-950">
          {country.title}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-950/48">
          {stats.pegados}/{stats.total} pegados - {stats.repetidos} repetidos
        </span>
      </span>
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-emerald-950/10 sm:w-24">
        <span
          className="block h-full rounded-full bg-gradient-to-r from-emerald-400 to-yellow-300 transition-all"
          style={{ width: `${Math.max(stats.progress, stats.pegados > 0 ? 6 : 0)}%` }}
        />
      </span>
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-950/5 text-sm font-black text-emerald-950 transition ${
          isCollapsed ? "" : "rotate-180"
        }`}
      >
        v
      </span>
    </button>
  );
}

function StickerCards({
  editor,
  stickers,
  visibleStickers,
  onTogglePegado,
  onIncrementRepeated,
  onDecrementRepeated
}: StickerGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 p-2.5 sm:grid-cols-3 sm:p-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {visibleStickers.map((checklistSticker) => (
        <StickerCard
          checklistSticker={checklistSticker}
          editor={editor}
          key={checklistSticker.id}
          sticker={stickers[checklistSticker.id]}
          onTogglePegado={() => onTogglePegado(checklistSticker.id)}
          onIncrementRepeated={() => onIncrementRepeated(checklistSticker.id)}
          onDecrementRepeated={() => onDecrementRepeated(checklistSticker.id)}
        />
      ))}
    </div>
  );
}

function buildAlbumSections(visibleStickers: ChecklistSticker[]): AlbumSection[] {
  const intro = visibleStickers.filter((sticker) => sticker.country === "00");
  const fwc = visibleStickers.filter((sticker) => sticker.country === "FWC");
  const cc = visibleStickers.filter((sticker) => sticker.country === "CC");
  const sections: AlbumSection[] = [];

  if (intro.length > 0) {
    sections.push({
      id: "intro",
      kind: "section",
      title: "Intro",
      kicker: "Inicio del album",
      flag: intro[0].flag,
      stickers: intro
    });
  }

  if (fwc.length > 0) {
    sections.push({
      id: "fwc",
      kind: "section",
      title: "FIFA World Cup 2026",
      kicker: "FWC",
      flag: fwc[0].flag,
      stickers: fwc
    });
  }

  for (const groupId of GROUP_ORDER) {
    const groupStickers = visibleStickers.filter(
      (sticker) => sticker.group === groupId
    );

    if (groupStickers.length === 0) {
      continue;
    }

    const countries = Array.from(
      groupStickers.reduce((countryMap, sticker) => {
        const existing = countryMap.get(sticker.country);

        if (existing) {
          existing.stickers.push(sticker);
        } else {
          countryMap.set(sticker.country, {
            id: `country-${sticker.country}`,
            title: `${sticker.section} - ${sticker.country}`,
            flag: sticker.flag,
            flagUrl: sticker.flagUrl,
            stickers: [sticker]
          });
        }

        return countryMap;
      }, new Map<string, CountrySection>())
    ).map(([, country]) => country);

    sections.push({
      id: `group-${groupId}`,
      kind: "group",
      title: `Grupo ${groupId}`,
      kicker: `${countries.length} selecciones`,
      flag: countries.map((country) => country.flag).join(" "),
      flagUrls: countries
        .map((country) => country.flagUrl)
        .filter((flagUrl): flagUrl is string => Boolean(flagUrl)),
      countries,
      stickers: groupStickers
    });
  }

  if (cc.length > 0) {
    sections.push({
      id: "cc",
      kind: "section",
      title: "Coca-Cola",
      kicker: "Especiales",
      flag: cc[0].flag,
      stickers: cc
    });
  }

  return sections;
}

function FlagMark({
  alt,
  emoji,
  src
}: {
  alt: string;
  emoji: string;
  src?: string;
}) {
  if (!src) {
    return <span className="text-2xl leading-none">{emoji}</span>;
  }

  return (
    <span className="flex h-7 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-emerald-950/10 bg-white shadow-sm">
      <img alt={`Bandera de ${alt}`} className="h-full w-full object-cover" src={src} />
    </span>
  );
}

type SectionStats = {
  total: number;
  pegados: number;
  repetidos: number;
  progress: number;
};

function getStickerStats(
  checklistStickers: ChecklistSticker[],
  stickers: Record<StickerId, StickerData>
): SectionStats {
  const pegados = checklistStickers.filter(
    (checklistSticker) => stickers[checklistSticker.id]?.pegado
  ).length;
  const repetidos = checklistStickers.reduce(
    (total, checklistSticker) =>
      total + (stickers[checklistSticker.id]?.repetidos ?? 0),
    0
  );
  const total = checklistStickers.length;
  const progress = total > 0 ? Number(((pegados / total) * 100).toFixed(1)) : 0;

  return {
    total,
    pegados,
    repetidos,
    progress
  };
}
