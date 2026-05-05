"use client";

import { useEffect, useMemo, useState } from "react";
import { AlbumHeader } from "../components/album/AlbumHeader";
import { AlbumToolbar } from "../components/album/AlbumToolbar";
import { ExchangePanel } from "../components/album/ExchangePanel";
import { GroupsOverview } from "../components/album/GroupsOverview";
import { MetricsGrid } from "../components/album/MetricsGrid";
import { StickerGrid } from "../components/album/StickerGrid";
import {
  CloudTools,
  formatMigrationSummary
} from "../components/album/CloudTools";
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
import {
  applyCloudRowToAlbum,
  hasCloudAlbum,
  loadCloudAlbum,
  removeCloudRowFromAlbum,
  upsertCloudAlbum,
  upsertCloudSticker
} from "../lib/cloudAlbum";
import type { AlbumStickerRow } from "../lib/cloudAlbum";
import { supabase } from "../lib/supabaseClient";

function saveAlbum(album: AlbumData) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(album));
}

function readLocalAlbum() {
  const savedAlbum = window.localStorage.getItem(STORAGE_KEY);

  if (!savedAlbum) {
    return { album: createInitialData(), resetReason: null };
  }

  return normalizeData(JSON.parse(savedAlbum));
}

export default function Home() {
  const [album, setAlbum] = useState<AlbumData>(() => createInitialData());
  const [isReady, setIsReady] = useState(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<string | null>(null);
  const [isCloudBusy, setIsCloudBusy] = useState(false);
  const [syncStatus, setSyncStatus] = useState("Sincronizado");
  const [filters, setFilters] = useState<Filters>({
    status: "Todos",
    query: "",
    groupId: "Todos",
    teamCode: "Todos"
  });

  useEffect(() => {
    let isMounted = true;

    async function loadAlbum() {
      let localAlbum = createInitialData();
      let localNotice: string | null = null;

      try {
        const localResult = readLocalAlbum();
        localAlbum = localResult.album;
        localNotice = localResult.resetReason ?? null;
      } catch {
        localNotice =
          "No pudimos leer el progreso local. Usaremos el checklist oficial limpio como respaldo.";
      }

      try {
        if (hasCloudAlbum()) {
          const cloudResult = await loadCloudAlbum(localAlbum.editor);

          if (!isMounted) {
            return;
          }

          if (cloudResult.source === "supabase") {
            setAlbum(cloudResult.album);
            setResetNotice(localNotice);
            setCloudStatus("Progreso cargado desde Supabase.");
          } else {
            setAlbum(localAlbum);
            setResetNotice(cloudResult.message ?? localNotice);
            setCloudStatus(cloudResult.message ?? null);
          }
        } else if (isMounted) {
          setAlbum(localAlbum);
          setResetNotice(localNotice);
          setCloudStatus(
            "Supabase no esta configurado. Usando localStorage como respaldo temporal."
          );
        }
      } catch {
        if (isMounted) {
          setAlbum(localAlbum);
          setResetNotice(
            "No pudimos conectar con Supabase. Usando localStorage como respaldo temporal."
          );
          setCloudStatus("Los cambios quedaran guardados localmente por ahora.");
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    loadAlbum();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isReady) {
      saveAlbum(album);
    }
  }, [album, isReady]);

  useEffect(() => {
    if (!isReady || !hasCloudAlbum() || !supabase) {
      return;
    }

    const client = supabase;
    let fallbackInterval: number | null = null;
    let syncDoneTimeout: number | null = null;
    let isSubscribed = false;

    async function refetchCloudAlbum() {
      setSyncStatus("Actualizando...");

      try {
        const cloudResult = await loadCloudAlbum(album.editor);

        if (cloudResult.source === "supabase") {
          setAlbum((currentAlbum) => persist({
            ...cloudResult.album,
            editor: currentAlbum.editor
          }));
          setSyncStatus("Sincronizado");
        }
      } catch {
        setSyncStatus("Sincronizacion pendiente");
      }
    }

    function startFallbackPolling() {
      if (fallbackInterval) {
        return;
      }

      setCloudStatus(
        "Realtime no esta disponible. Actualizando desde Supabase cada 15 segundos."
      );
      fallbackInterval = window.setInterval(() => {
        void refetchCloudAlbum();
      }, 15000);
    }

    function stopFallbackPolling() {
      if (!fallbackInterval) {
        return;
      }

      window.clearInterval(fallbackInterval);
      fallbackInterval = null;
    }

    const channel = client
      .channel("album-stickers-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "album_stickers"
        },
        (payload) => {
          setSyncStatus("Actualizando...");

          setAlbum((currentAlbum) => {
            const nextAlbum =
              payload.eventType === "DELETE"
                ? removeCloudRowFromAlbum(
                    currentAlbum,
                    (payload.old as Partial<AlbumStickerRow>).id as StickerId
                  )
                : applyCloudRowToAlbum(
                    currentAlbum,
                    payload.new as AlbumStickerRow
                  );

            return persist(nextAlbum);
          });

          if (syncDoneTimeout) {
            window.clearTimeout(syncDoneTimeout);
          }

          syncDoneTimeout = window.setTimeout(() => {
            setSyncStatus("Sincronizado");
          }, 400);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          isSubscribed = true;
          stopFallbackPolling();
          setCloudStatus("Realtime activo. Cambios sincronizados al instante.");
          setSyncStatus("Sincronizado");
          return;
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          isSubscribed = false;
          startFallbackPolling();
        }

        if (status === "CLOSED" && !isSubscribed) {
          startFallbackPolling();
        }
      });

    const fallbackGuard = window.setTimeout(() => {
      if (!isSubscribed) {
        startFallbackPolling();
      }
    }, 5000);

    return () => {
      window.clearTimeout(fallbackGuard);

      if (syncDoneTimeout) {
        window.clearTimeout(syncDoneTimeout);
      }

      stopFallbackPolling();
      void client.removeChannel(channel);
    };
  }, [album.editor, isReady]);

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

  async function syncSticker(nextAlbum: AlbumData, stickerId: StickerId) {
    if (!hasCloudAlbum()) {
      return;
    }

    try {
      await upsertCloudSticker(nextAlbum, stickerId);
      setCloudStatus("Cambio guardado en Supabase.");
    } catch {
      setCloudStatus(
        "No pudimos guardar en Supabase. El cambio quedo en localStorage como respaldo."
      );
    }
  }

  function handleEditorChange(editor: UserName) {
    setAlbum((currentAlbum) => persist(changeAlbumEditor(currentAlbum, editor)));
  }

  function handleResetAlbum() {
    setAlbum((currentAlbum) => persist(resetAlbum(currentAlbum)));
  }

  function handleTogglePegado(stickerId: StickerId) {
    setAlbum((currentAlbum) => {
      const nextAlbum = persist(
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
      );

      void syncSticker(nextAlbum, stickerId);

      return nextAlbum;
    });
  }

  function handleIncrementRepeated(stickerId: StickerId) {
    setAlbum((currentAlbum) => {
      const nextAlbum = persist(updateAlbumSticker(currentAlbum, stickerId, (currentSticker) => {
        const repetidosPorUsuario = {
          ...currentSticker.repetidosPorUsuario,
          [currentAlbum.editor]: currentSticker.repetidosPorUsuario[currentAlbum.editor] + 1
        };

        return {
          ...currentSticker,
          repetidos: getTotalRepeated(repetidosPorUsuario),
          repetidosPorUsuario
        };
      }));

      void syncSticker(nextAlbum, stickerId);

      return nextAlbum;
    });
  }

  function handleDecrementRepeated(stickerId: StickerId) {
    setAlbum((currentAlbum) => {
      const nextAlbum = persist(updateAlbumSticker(currentAlbum, stickerId, (currentSticker) => {
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
      }));

      void syncSticker(nextAlbum, stickerId);

      return nextAlbum;
    });
  }

  async function handleMigrateLocalToCloud() {
    if (!hasCloudAlbum()) {
      setCloudStatus("Configura las variables de Supabase antes de migrar.");
      return;
    }

    const confirmed = window.confirm(
      "Esto subira el progreso guardado en este navegador a Supabase y podra sobrescribir los cromos existentes en la nube. Continuamos?"
    );

    if (!confirmed) {
      return;
    }

    setIsCloudBusy(true);

    try {
      const localResult = readLocalAlbum();
      const summary = await upsertCloudAlbum(localResult.album);
      setAlbum(persist(localResult.album));
      setCloudStatus(`Migracion completada: ${formatMigrationSummary(summary)}`);
    } catch {
      setCloudStatus("No pudimos migrar el progreso local a Supabase.");
    } finally {
      setIsCloudBusy(false);
    }
  }

  function handleExportBackup() {
    const backup = JSON.stringify(album, null, 2);
    const blob = new Blob([backup], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `album-panini-2026-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setCloudStatus("Respaldo JSON exportado.");
  }

  async function handleImportBackup(file: File) {
    setIsCloudBusy(true);

    try {
      const text = await file.text();
      const result = normalizeData(JSON.parse(text));
      const importedAlbum = persist(result.album);

      setAlbum(importedAlbum);

      if (hasCloudAlbum()) {
        const summary = await upsertCloudAlbum(importedAlbum);
        setCloudStatus(
          `Respaldo importado y subido a Supabase: ${formatMigrationSummary(summary)}`
        );
      } else {
        setCloudStatus("Respaldo importado en localStorage.");
      }
    } catch {
      setCloudStatus("No pudimos importar el respaldo JSON.");
    } finally {
      setIsCloudBusy(false);
    }
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

        <CloudTools
          cloudEnabled={hasCloudAlbum()}
          status={cloudStatus}
          syncStatus={syncStatus}
          isBusy={isCloudBusy}
          onMigrateLocal={handleMigrateLocalToCloud}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
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
