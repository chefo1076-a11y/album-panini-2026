"use client";

import { useEffect, useState } from "react";
import type { CloudAlbumRecord } from "../../lib/cloudAlbum";

type AlbumAccessPanelProps = {
  activeAlbum: CloudAlbumRecord | null;
  pendingAlbum: CloudAlbumRecord | null;
  recentAlbums: CloudAlbumRecord[];
  error: string | null;
  onOpenAlbum: (shareCode: string, pinCode?: string) => void;
  onCreateAlbum: (name: string, pinCode?: string) => void;
  onOpenDefaultAlbum: () => void;
  onCloseAccess: () => void;
  onChangePin: (pinCode?: string) => void;
};

export function AlbumAccessPanel({
  activeAlbum,
  pendingAlbum,
  recentAlbums,
  error,
  onOpenAlbum,
  onCreateAlbum,
  onOpenDefaultAlbum,
  onCloseAccess,
  onChangePin
}: AlbumAccessPanelProps) {
  const [shareCode, setShareCode] = useState(activeAlbum?.share_code ?? "");
  const [pinCode, setPinCode] = useState("");
  const [name, setName] = useState("");
  const [newPinCode, setNewPinCode] = useState("");
  const [currentAlbumPinCode, setCurrentAlbumPinCode] = useState("");

  useEffect(() => {
    if (pendingAlbum) {
      setShareCode(pendingAlbum.share_code);
      setPinCode("");
      return;
    }

    if (activeAlbum) {
      setShareCode(activeAlbum.share_code);
    }
  }, [activeAlbum, pendingAlbum]);

  const shareUrl =
    typeof window === "undefined" || !activeAlbum
      ? ""
      : `${window.location.origin}/?album=${activeAlbum.share_code}`;

  return (
    <section className="mt-4 overflow-hidden rounded border border-yellow-300/40 bg-white/90 shadow-[0_12px_28px_rgba(12,35,29,.10)]">
      <div className="border-b border-yellow-900/10 bg-[#fffdf7] px-3 py-3 sm:px-4">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-950/45">
          Album privado
        </p>
        <h2 className="mt-1 text-lg font-black text-emerald-950">
          {activeAlbum ? activeAlbum.name : "Abrir album"}
        </h2>
        {shareUrl ? (
          <div className="mt-2 grid gap-1 text-sm font-bold text-emerald-950/65">
            <p>
              Codigo del album:{" "}
              <span className="rounded bg-emerald-950 px-2 py-0.5 font-black text-yellow-100">
                {activeAlbum?.share_code}
              </span>
            </p>
            <p className="break-all">Link para compartir: {shareUrl}</p>
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4">
        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            onOpenAlbum(shareCode, pinCode);
          }}
        >
          <label className="text-xs font-black uppercase tracking-[0.14em] text-emerald-950/55">
            Codigo del album
            <input
              className="mt-1 h-10 w-full rounded border border-emerald-950/10 bg-white px-3 text-sm font-bold normal-case tracking-normal text-emerald-950 outline-none focus:ring-4 focus:ring-yellow-200/40"
              value={shareCode}
              onChange={(event) => setShareCode(event.target.value)}
              placeholder="album-juanjo"
            />
            <span className="mt-1 block text-[11px] font-bold normal-case tracking-normal text-emerald-950/50">
              Ejemplo: album-juanjo
            </span>
          </label>

          {pendingAlbum ? (
            <label className="text-xs font-black uppercase tracking-[0.14em] text-emerald-950/55">
              PIN de {pendingAlbum.name}
              <input
                className="mt-1 h-10 w-full rounded border border-emerald-950/10 bg-white px-3 text-sm font-bold normal-case tracking-normal text-emerald-950 outline-none focus:ring-4 focus:ring-yellow-200/40"
                type="password"
                value={pinCode}
                onChange={(event) => setPinCode(event.target.value)}
                placeholder="PIN"
              />
            </label>
          ) : null}

          <button className="h-10 rounded bg-emerald-950 px-3 text-sm font-black text-yellow-100 transition hover:bg-black">
            Abrir album
          </button>

          <button
            className="h-10 rounded border border-emerald-950/10 bg-white px-3 text-sm font-black text-emerald-950 transition hover:bg-yellow-50"
            type="button"
            onClick={onOpenDefaultAlbum}
          >
            Volver a Album Juanjo
          </button>

          {recentAlbums.length > 0 ? (
            <div className="rounded border border-emerald-950/10 bg-emerald-50/50 p-2">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-950/50">
                Albumes recientes
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {recentAlbums.map((album) => (
                  <button
                    key={album.id}
                    className="rounded-full border border-emerald-950/10 bg-white px-2.5 py-1 text-xs font-black text-emerald-950 transition hover:bg-yellow-50"
                    type="button"
                    onClick={() => {
                      setShareCode(album.share_code);
                      onOpenAlbum(album.share_code);
                    }}
                  >
                    {album.name} · {album.share_code}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </form>

        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            onCreateAlbum(name, newPinCode);
            setName("");
            setNewPinCode("");
          }}
        >
          <label className="text-xs font-black uppercase tracking-[0.14em] text-emerald-950/55">
            Nuevo album
            <input
              className="mt-1 h-10 w-full rounded border border-emerald-950/10 bg-white px-3 text-sm font-bold normal-case tracking-normal text-emerald-950 outline-none focus:ring-4 focus:ring-yellow-200/40"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Album primos"
            />
          </label>

          <label className="text-xs font-black uppercase tracking-[0.14em] text-emerald-950/55">
            PIN opcional
            <input
              className="mt-1 h-10 w-full rounded border border-emerald-950/10 bg-white px-3 text-sm font-bold normal-case tracking-normal text-emerald-950 outline-none focus:ring-4 focus:ring-yellow-200/40"
              type="password"
              value={newPinCode}
              onChange={(event) => setNewPinCode(event.target.value)}
              placeholder="Opcional"
            />
          </label>

          <button className="h-10 rounded border border-emerald-950/10 bg-white px-3 text-sm font-black text-emerald-950 transition hover:bg-yellow-50">
            Crear album
          </button>
        </form>
      </div>

      {activeAlbum ? (
        <div className="grid gap-3 border-t border-yellow-900/10 p-3 sm:grid-cols-2 sm:p-4">
          <form
            className="grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              onChangePin(currentAlbumPinCode);
              setCurrentAlbumPinCode("");
            }}
          >
            <label className="text-xs font-black uppercase tracking-[0.14em] text-emerald-950/55">
              Crear/cambiar PIN del album actual
              <input
                className="mt-1 h-10 w-full rounded border border-emerald-950/10 bg-white px-3 text-sm font-bold normal-case tracking-normal text-emerald-950 outline-none focus:ring-4 focus:ring-yellow-200/40"
                type="password"
                value={currentAlbumPinCode}
                onChange={(event) => setCurrentAlbumPinCode(event.target.value)}
                placeholder="Nuevo PIN, vacio para quitarlo"
              />
            </label>

            <button className="h-10 rounded bg-emerald-950 px-3 text-sm font-black text-yellow-100 transition hover:bg-black">
              Guardar PIN
            </button>
          </form>

          <div className="flex flex-col justify-end">
            <button
              className="h-10 rounded border border-red-200 bg-red-50 px-3 text-sm font-black text-red-700 transition hover:bg-red-100"
              type="button"
              onClick={onCloseAccess}
            >
              Cerrar acceso del album
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="border-t border-yellow-900/10 px-3 py-2 text-sm font-bold text-red-700 sm:px-4">
          {error}
        </p>
      ) : null}
    </section>
  );
}
