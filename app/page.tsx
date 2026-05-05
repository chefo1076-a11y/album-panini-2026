"use client";

import { useEffect, useMemo, useState } from "react";
import { AlbumHeader } from "../components/album/AlbumHeader";
import { AlbumToolbar } from "../components/album/AlbumToolbar";
import { ExchangePanel } from "../components/album/ExchangePanel";
import { GroupsOverview } from "../components/album/GroupsOverview";
import { MetricsGrid } from "../components/album/MetricsGrid";
import { StickerGrid } from "../components/album/StickerGrid";
import {
  STORAGE_KEY,
  changeAlbumEditor,
  createEmptyUserRepeatedMap,
  createInitialData,
  getAlbumStats,
  getTotalRepeated,
  getMissingStickers,
  getRepeatedStickerSummaries,
  getVisibleStickers,
  normalizeData,
  resetAlbum,
  updateAlbumSticker
} from "../lib/album";
import type { AlbumData, Filters, StickerId, UserName } from "../lib/album";

function saveAlbum(album: AlbumData) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(album));
}

export default function Home() {
  const [album, setAlbum] = useState<AlbumData>(() => createInitialData());
  const [isReady, setIsReady] = useState(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    status: "Todos",
    query: "",
    groupId: "Todos",
    teamCode: "Todos"
  });

  useEffect(() => {
    try {
      const savedAlbum = window.localStorage.getItem(STORAGE_KEY);

      if (savedAlbum) {
        const result = normalizeData(JSON.parse(savedAlbum));
        setAlbum(result.album);
        setResetNotice(result.resetReason ?? null);
      }
    } catch {
      setAlbum(createInitialData());
      setResetNotice(
        "No pudimos leer el progreso guardado. Reiniciamos el album con el checklist oficial."
      );
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (isReady) {
      saveAlbum(album);
    }
  }, [album, isReady]);

  const stats = useMemo(() => getAlbumStats(album.stickers), [album.stickers]);
  const missingStickers = useMemo(
    () => getMissingStickers(album.stickers),
    [album.stickers]
  );
  const repeatedStickers = useMemo(
    () => getRepeatedStickerSummaries(album.stickers),
    [album.stickers]
  );
  const visibleStickers = useMemo(
    () => getVisibleStickers(album.stickers, filters),
    [album.stickers, filters]
  );

  function persist(nextAlbum: AlbumData) {
    saveAlbum(nextAlbum);
    return nextAlbum;
  }

  function handleEditorChange(editor: UserName) {
    setAlbum((currentAlbum) => persist(changeAlbumEditor(currentAlbum, editor)));
  }

  function handleResetAlbum() {
    setAlbum((currentAlbum) => persist(resetAlbum(currentAlbum)));
  }

  function handleTogglePegado(stickerId: StickerId) {
    setAlbum((currentAlbum) =>
      persist(
        updateAlbumSticker(currentAlbum, stickerId, (currentSticker) => {
          const nextPegado = !currentSticker.pegado;

          return {
            ...currentSticker,
            pegado: nextPegado,
            repetidos: nextPegado ? currentSticker.repetidos : 0,
            repetidosPorUsuario: nextPegado
              ? currentSticker.repetidosPorUsuario
              : createEmptyUserRepeatedMap()
          };
        })
      )
    );
  }

  function handleIncrementRepeated(stickerId: StickerId) {
    setAlbum((currentAlbum) =>
      persist(updateAlbumSticker(currentAlbum, stickerId, (currentSticker) => {
        const repetidosPorUsuario = {
          ...currentSticker.repetidosPorUsuario,
          [currentAlbum.editor]: currentSticker.repetidosPorUsuario[currentAlbum.editor] + 1
        };

        return {
          ...currentSticker,
          repetidos: getTotalRepeated(repetidosPorUsuario),
          repetidosPorUsuario
        };
      }))
    );
  }

  function handleDecrementRepeated(stickerId: StickerId) {
    setAlbum((currentAlbum) =>
      persist(updateAlbumSticker(currentAlbum, stickerId, (currentSticker) => {
        const repetidosPorUsuario = {
          ...currentSticker.repetidosPorUsuario,
          [currentAlbum.editor]: Math.max(
            0,
            currentSticker.repetidosPorUsuario[currentAlbum.editor] - 1
          )
        };

        return {
          ...currentSticker,
          repetidos: getTotalRepeated(repetidosPorUsuario),
          repetidosPorUsuario
        };
      }))
    );
  }

  if (!isReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f7f2] px-4 text-center">
        <div className="rounded border border-white/70 bg-white/80 px-8 py-7 shadow-xl shadow-emerald-950/10 backdrop-blur">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-pitch/70">
            Mundial 2026
          </p>
          <h1 className="mt-2 text-2xl font-black text-ink">Cargando album</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#10231f] bg-[radial-gradient(circle_at_18%_0%,rgba(250,204,21,.18),transparent_28%),radial-gradient(circle_at_92%_12%,rgba(20,184,166,.22),transparent_24%),linear-gradient(180deg,#10231f_0%,#eef4e8_30%,#f7f4ea_100%)] text-ink">
      <AlbumHeader
        editor={album.editor}
        stats={stats}
        onEditorChange={handleEditorChange}
      />

      <MetricsGrid stats={stats} />

      {resetNotice ? (
        <section className="mx-auto w-full max-w-7xl px-4 pt-3 sm:px-6 lg:px-8">
          <div className="rounded border border-yellow-300/70 bg-yellow-50 px-3 py-2 text-sm font-bold text-yellow-900 shadow-sm">
            {resetNotice}
          </div>
        </section>
      ) : null}

      <GroupsOverview stickers={album.stickers} />

      <section className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <AlbumToolbar
          editor={album.editor}
          filters={filters}
          visibleCount={visibleStickers.length}
          onFiltersChange={setFilters}
          onResetAlbum={handleResetAlbum}
        />

        <ExchangePanel
          missingStickers={missingStickers}
          repeatedStickers={repeatedStickers}
        />

        <StickerGrid
          editor={album.editor}
          stickers={album.stickers}
          visibleStickers={visibleStickers}
          onTogglePegado={handleTogglePegado}
          onIncrementRepeated={handleIncrementRepeated}
          onDecrementRepeated={handleDecrementRepeated}
        />
      </section>
    </main>
  );
}
