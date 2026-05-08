"use client";

import { useEffect, useMemo, useState } from "react";
import { AlbumHeader } from "../components/album/AlbumHeader";
import { AlbumAccessPanel } from "../components/album/AlbumAccessPanel";
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
  ACTIVE_ALBUM_STORAGE_KEY,
  authorizeAlbum,
  createCloudAlbum,
  DEFAULT_ALBUM_SHARE_CODE,
  ensureDefaultCloudAlbum,
  getCloudAlbumByShareCode,
  hasCloudAlbum,
  isAlbumAuthorized,
  loadCloudCatalog,
  loadCloudAlbum,
  removeCloudRowFromAlbum,
  revokeAlbumAuthorization,
  updateCloudAlbumPin,
  upsertCloudAlbum,
  upsertCloudSticker
} from "../lib/cloudAlbum";
import type { AlbumStickerRow, CloudAlbumRecord } from "../lib/cloudAlbum";
import { supabase } from "../lib/supabaseClient";

const RECENT_ALBUMS_STORAGE_KEY = "panini-recent-albums";

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

function getInitialShareCode() {
  const url = new URL(window.location.href);
  const urlShareCode = url.searchParams.get("album")?.trim();

  if (urlShareCode) {
    return urlShareCode;
  }

  return (
    window.localStorage.getItem(ACTIVE_ALBUM_STORAGE_KEY) ??
    DEFAULT_ALBUM_SHARE_CODE
  );
}

function persistActiveAlbum(album: CloudAlbumRecord) {
  window.localStorage.setItem(ACTIVE_ALBUM_STORAGE_KEY, album.share_code);
  const url = new URL(window.location.href);
  url.searchParams.set("album", album.share_code);
  window.history.replaceState(null, "", url.toString());
}

function readRecentAlbums(): CloudAlbumRecord[] {
  try {
    const value = window.localStorage.getItem(RECENT_ALBUMS_STORAGE_KEY);

    if (!value) {
      return [];
    }

    const albums = JSON.parse(value) as CloudAlbumRecord[];

    return Array.isArray(albums)
      ? albums
          .filter(
            (album) =>
              typeof album.id === "string" &&
              typeof album.name === "string" &&
              typeof album.share_code === "string"
          )
          .map((album) => ({ ...album, pin_code: null }))
      : [];
  } catch {
    return [];
  }
}

function rememberRecentAlbum(album: CloudAlbumRecord) {
  const safeAlbum = {
    ...album,
    pin_code: null
  };
  const nextAlbums = [
    safeAlbum,
    ...readRecentAlbums().filter((recentAlbum) => recentAlbum.id !== album.id)
  ].slice(0, 6);

  window.localStorage.setItem(
    RECENT_ALBUMS_STORAGE_KEY,
    JSON.stringify(nextAlbums)
  );

  return nextAlbums;
}

export default function Home() {
  const [album, setAlbum] = useState<AlbumData>(() => createInitialData());
  const [isReady, setIsReady] = useState(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<string | null>(null);
  const [isCloudBusy, setIsCloudBusy] = useState(false);
  const [syncStatus, setSyncStatus] = useState("Sincronizado");
  const [activeCloudAlbum, setActiveCloudAlbum] =
    useState<CloudAlbumRecord | null>(null);
  const [pendingPinAlbum, setPendingPinAlbum] =
    useState<CloudAlbumRecord | null>(null);
  const [albumAccessError, setAlbumAccessError] = useState<string | null>(null);
  const [recentAlbums, setRecentAlbums] = useState<CloudAlbumRecord[]>([]);
  const [filters, setFilters] = useState<Filters>({
    status: "Todos",
    query: "",
    groupId: "Todos",
    teamCode: "Todos"
  });

  useEffect(() => {
    let isMounted = true;
    console.log("[album-debug] page loaded");

    async function loadAlbum() {
      let localAlbum = createInitialData();
      let localNotice: string | null = null;

      try {
        const localResult = readLocalAlbum();
        localAlbum = localResult.album;
        localNotice = localResult.resetReason ?? null;
        setRecentAlbums(readRecentAlbums());
      } catch {
        localNotice =
          "No pudimos leer el progreso local. Usaremos el checklist oficial limpio como respaldo.";
      }

      try {
        console.log("[album-debug] has cloud", hasCloudAlbum());
        if (hasCloudAlbum()) {
          const catalogCount = await loadCloudCatalog();
          console.log("[album-debug] catalog count", catalogCount);
          const shareCode = getInitialShareCode();
          const cloudAlbum =
            shareCode === DEFAULT_ALBUM_SHARE_CODE
              ? await ensureDefaultCloudAlbum()
              : await getCloudAlbumByShareCode(shareCode);

          if (!cloudAlbum) {
            console.log("[album-debug] activeAlbum", null);
            throw new Error("Album no encontrado.");
          }

          console.log("[album-debug] activeAlbum", {
            id: cloudAlbum.id,
            name: cloudAlbum.name,
            share_code: cloudAlbum.share_code,
            hasPin: Boolean(cloudAlbum.pin_code)
          });

          if (!isAlbumAuthorized(cloudAlbum)) {
            setActiveCloudAlbum(null);
            setPendingPinAlbum(cloudAlbum);
            setAlbum(localAlbum);
            setRecentAlbums(readRecentAlbums());
            setCloudStatus("Este album requiere PIN.");
            setResetNotice(localNotice);
            return;
          }

          const cloudResult = await loadCloudAlbum(localAlbum.editor, cloudAlbum.id);

          if (!isMounted) {
            return;
          }

          if (cloudResult.source === "supabase") {
            console.log("[album-debug] progress count", cloudResult.debug?.progressRows ?? 0);
            console.log("[album-debug] applied stuck count", cloudResult.debug?.stuckRows ?? 0);
            console.log("[album-debug] final ui stuck count", getAlbumStats(cloudResult.album.stickers).pegados);
            setActiveCloudAlbum(cloudAlbum);
            setPendingPinAlbum(null);
            persistActiveAlbum(cloudAlbum);
            setRecentAlbums(rememberRecentAlbum(cloudAlbum));
            setAlbum(cloudResult.album);
            setResetNotice(localNotice);
            setCloudStatus(
              `Progreso cargado desde Supabase: ${cloudAlbum.name}. ${cloudResult.debug?.matchesApplied ?? 0} cromos aplicados.`
            );
          } else {
            console.log("[album-debug] using local fallback", cloudResult.message);
            setActiveCloudAlbum(cloudAlbum);
            setPendingPinAlbum(null);
            persistActiveAlbum(cloudAlbum);
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
      } catch (error) {
        console.log("[album-debug] cloud load error", error);
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
    if (!isReady || !hasCloudAlbum() || !supabase || !activeCloudAlbum) {
      return;
    }

    const client = supabase;
    const albumId = activeCloudAlbum.id;
    let fallbackInterval: number | null = null;
    let syncDoneTimeout: number | null = null;
    let isSubscribed = false;

    async function refetchCloudAlbum() {
      setSyncStatus("Actualizando...");

      try {
        const cloudResult = await loadCloudAlbum(album.editor, albumId);

        if (cloudResult.source === "supabase") {
          console.log("[album-debug] progress count", cloudResult.debug?.progressRows ?? 0);
          console.log("[album-debug] applied stuck count", cloudResult.debug?.stuckRows ?? 0);
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
          table: "album_stickers",
          filter: `album_id=eq.${albumId}`
        },
        (payload) => {
          setSyncStatus("Actualizando...");

          setAlbum((currentAlbum) => {
            const nextAlbum =
              payload.eventType === "DELETE"
                ? removeCloudRowFromAlbum(
                    currentAlbum,
                    (payload.old as Partial<AlbumStickerRow>).sticker_code as StickerId
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
  }, [activeCloudAlbum, album.editor, isReady]);

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
  const isCloudProtectedWithoutAccess = hasCloudAlbum() && !activeCloudAlbum;
  const displayedStats = isCloudProtectedWithoutAccess
    ? getAlbumStats(createInitialData(album.editor).stickers)
    : stats;

  function persist(nextAlbum: AlbumData) {
    saveAlbum(nextAlbum);
    return nextAlbum;
  }

  async function syncSticker(nextAlbum: AlbumData, stickerId: StickerId) {
    if (!hasCloudAlbum()) {
      return;
    }

    try {
      if (!activeCloudAlbum) {
        return;
      }

      await upsertCloudSticker(nextAlbum, stickerId, activeCloudAlbum.id);
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
      if (!activeCloudAlbum) {
        setCloudStatus("Abre un album cloud antes de migrar.");
        return;
      }

      const summary = await upsertCloudAlbum(localResult.album, activeCloudAlbum.id);
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
        if (!activeCloudAlbum) {
          setCloudStatus("Respaldo importado localmente. Abre un album cloud para subirlo.");
          return;
        }

        const summary = await upsertCloudAlbum(importedAlbum, activeCloudAlbum.id);
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

  async function handleOpenAlbum(shareCode: string, pinCode?: string) {
    if (!hasCloudAlbum()) {
      setAlbumAccessError("Supabase no esta configurado.");
      return;
    }

    setIsCloudBusy(true);
    setAlbumAccessError(null);

    try {
      const normalizedShareCode = shareCode.trim();

      if (!normalizedShareCode) {
        setAlbumAccessError(
          "Escribe el codigo del album. Por ejemplo: album-juanjo."
        );
        return;
      }

      const cloudAlbum = await getCloudAlbumByShareCode(normalizedShareCode);

      if (!cloudAlbum) {
        setAlbumAccessError(
          "No encontramos ese album. Revisa el codigo compartido, por ejemplo album-juanjo."
        );
        return;
      }

      if (
        cloudAlbum.pin_code &&
        !isAlbumAuthorized(cloudAlbum) &&
        cloudAlbum.pin_code !== pinCode?.trim()
      ) {
        setActiveCloudAlbum(null);
        setPendingPinAlbum(cloudAlbum);
        setAlbum(persist(createInitialData(album.editor)));
        setAlbumAccessError("PIN requerido o incorrecto.");
        return;
      }

      authorizeAlbum(cloudAlbum.id);
      persistActiveAlbum(cloudAlbum);
      setRecentAlbums(rememberRecentAlbum(cloudAlbum));
      setActiveCloudAlbum(cloudAlbum);
      setPendingPinAlbum(null);

      const cloudResult = await loadCloudAlbum(album.editor, cloudAlbum.id);

      if (cloudResult.source === "supabase") {
        console.log("[album-debug] progress count", cloudResult.debug?.progressRows ?? 0);
        console.log("[album-debug] applied stuck count", cloudResult.debug?.stuckRows ?? 0);
        console.log("[album-debug] final ui stuck count", getAlbumStats(cloudResult.album.stickers).pegados);
        setAlbum(persist({ ...cloudResult.album, editor: album.editor }));
      }

      setCloudStatus(`Album activo: ${cloudAlbum.name}.`);
    } catch {
      setAlbumAccessError("No pudimos abrir el album.");
    } finally {
      setIsCloudBusy(false);
    }
  }

  async function handleCreateAlbum(name: string, pinCode?: string) {
    if (!hasCloudAlbum()) {
      setAlbumAccessError("Supabase no esta configurado.");
      return;
    }

    if (!name.trim()) {
      setAlbumAccessError("Escribe un nombre para el album.");
      return;
    }

    setIsCloudBusy(true);
    setAlbumAccessError(null);

    try {
      const cloudAlbum = await createCloudAlbum(name, pinCode);
      authorizeAlbum(cloudAlbum.id);
      persistActiveAlbum(cloudAlbum);
      setRecentAlbums(rememberRecentAlbum(cloudAlbum));
      setActiveCloudAlbum(cloudAlbum);
      setPendingPinAlbum(null);
      setAlbum(persist(createInitialData(album.editor)));
      setCloudStatus(
        `Album creado: ${cloudAlbum.name}. Codigo: ${cloudAlbum.share_code}. Comparte su link unico.`
      );
    } catch {
      setAlbumAccessError("No pudimos crear el album.");
    } finally {
      setIsCloudBusy(false);
    }
  }

  async function handleChangeCurrentAlbumPin(pinCode?: string) {
    if (!activeCloudAlbum) {
      setAlbumAccessError("Abre un album antes de cambiar el PIN.");
      return;
    }

    setIsCloudBusy(true);
    setAlbumAccessError(null);

    try {
      const updatedAlbum = await updateCloudAlbumPin(activeCloudAlbum.id, pinCode);
      authorizeAlbum(updatedAlbum.id);
      persistActiveAlbum(updatedAlbum);
      setActiveCloudAlbum(updatedAlbum);
      setRecentAlbums(rememberRecentAlbum(updatedAlbum));
      setCloudStatus(
        updatedAlbum.pin_code
          ? "PIN actualizado para el album actual."
          : "PIN eliminado del album actual."
      );
    } catch {
      setAlbumAccessError("No pudimos actualizar el PIN del album.");
    } finally {
      setIsCloudBusy(false);
    }
  }

  function handleCloseAlbumAccess() {
    if (!activeCloudAlbum) {
      return;
    }

    revokeAlbumAuthorization(activeCloudAlbum.id);
    setPendingPinAlbum(activeCloudAlbum.pin_code ? activeCloudAlbum : null);
    setActiveCloudAlbum(null);
    setAlbum(persist(createInitialData(album.editor)));
    setCloudStatus("Acceso local cerrado para este album.");
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
        stats={displayedStats}
        onEditorChange={handleEditorChange}
      />

      {!isCloudProtectedWithoutAccess ? <MetricsGrid stats={stats} /> : null}

      {resetNotice ? (
        <section className="mx-auto w-full max-w-7xl px-4 pt-3 sm:px-6 lg:px-8">
          <div className="rounded border border-yellow-300/70 bg-yellow-50 px-3 py-2 text-sm font-bold text-yellow-900 shadow-sm">
            {resetNotice}
          </div>
        </section>
      ) : null}

      {!isCloudProtectedWithoutAccess ? (
        <GroupsOverview stickers={album.stickers} />
      ) : null}

      <section className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <AlbumAccessPanel
          activeAlbum={activeCloudAlbum}
          pendingAlbum={pendingPinAlbum}
          recentAlbums={recentAlbums}
          error={albumAccessError}
          onOpenAlbum={handleOpenAlbum}
          onCreateAlbum={handleCreateAlbum}
          onOpenDefaultAlbum={() => handleOpenAlbum(DEFAULT_ALBUM_SHARE_CODE)}
          onCloseAccess={handleCloseAlbumAccess}
          onChangePin={handleChangeCurrentAlbumPin}
        />

        {!isCloudProtectedWithoutAccess ? (
          <>
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
          </>
        ) : (
          <div className="mt-4 rounded border border-yellow-300/70 bg-yellow-50 px-3 py-3 text-sm font-bold text-yellow-900 shadow-sm">
            Ingresa el PIN del album para ver y modificar sus cromos.
          </div>
        )}
      </section>
    </main>
  );
}
