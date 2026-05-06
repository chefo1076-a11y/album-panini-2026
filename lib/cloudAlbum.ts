import { CHECKLIST } from "./checklist";
import {
  USERS,
  createEmptyUserRepeatedMap,
  createInitialData,
  getTotalRepeated
} from "./album";
import type { AlbumData, StickerData, StickerId, UserName } from "./album";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

export type AlbumStickerRow = {
  album_id: string;
  id: string;
  code: string;
  category: string;
  selection: string | null;
  type: string | null;
  name: string | null;
  stuck: boolean;
  repeats: number;
  updated_by: string | null;
  updated_at?: string | null;
};

export type CloudAlbumRecord = {
  id: string;
  name: string;
  share_code: string;
  pin_code: string | null;
  created_at?: string;
};

export type CloudLoadResult = {
  album: AlbumData;
  source: "supabase" | "local";
  message?: string;
};

export type MigrationSummary = {
  migrated: number;
  pegados: number;
  repetidos: number;
};

export const DEFAULT_ALBUM_NAME = "Album Juanjo";
export const DEFAULT_ALBUM_SHARE_CODE = "album-juanjo";
export const ACTIVE_ALBUM_STORAGE_KEY = "panini-active-album-share-code";
export const ALBUM_AUTH_STORAGE_PREFIX = "panini-album-authorized-";

export function hasCloudAlbum() {
  return isSupabaseConfigured && Boolean(supabase);
}

export async function loadCloudAlbum(
  editor: UserName,
  albumId: string
): Promise<CloudLoadResult> {
  if (!supabase) {
    return {
      album: createInitialData(editor),
      source: "local",
      message:
        "Supabase no esta configurado. Usando localStorage como respaldo temporal."
    };
  }

  const { data, error } = await supabase
    .from("album_stickers")
    .select("*")
    .eq("album_id", albumId);

  if (error) {
    return {
      album: createInitialData(editor),
      source: "local",
      message:
        "No pudimos conectar con Supabase. Usando localStorage como respaldo temporal."
    };
  }

  const album = createInitialData(editor);

  for (const row of (data ?? []) as AlbumStickerRow[]) {
    if (!album.stickers[row.id as StickerId]) {
      continue;
    }

    album.stickers[row.id as StickerId] = rowToSticker(row, editor);
  }

  return { album, source: "supabase" };
}

export async function upsertCloudSticker(
  album: AlbumData,
  stickerId: StickerId,
  albumId: string
) {
  if (!supabase) {
    throw new Error("Supabase no esta configurado.");
  }

  const row = albumStickerToRow(album, stickerId, albumId);
  const { error } = await supabase
    .from("album_stickers")
    .upsert(row, { onConflict: "album_id,id" });

  if (error) {
    throw error;
  }
}

export async function upsertCloudAlbum(album: AlbumData, albumId: string) {
  if (!supabase) {
    throw new Error("Supabase no esta configurado.");
  }

  const rows = Object.keys(album.stickers).map((stickerId) =>
    albumStickerToRow(album, stickerId as StickerId, albumId)
  );
  const { error } = await supabase
    .from("album_stickers")
    .upsert(rows, { onConflict: "album_id,id" });

  if (error) {
    throw error;
  }

  return summarizeAlbum(album);
}

export async function ensureDefaultCloudAlbum() {
  if (!supabase) {
    throw new Error("Supabase no esta configurado.");
  }

  const existing = await getCloudAlbumByShareCode(DEFAULT_ALBUM_SHARE_CODE);

  if (existing) {
    return existing;
  }

  return createCloudAlbum(DEFAULT_ALBUM_NAME);
}

export async function getCloudAlbumByShareCode(shareCode: string) {
  if (!supabase) {
    throw new Error("Supabase no esta configurado.");
  }

  const { data, error } = await supabase
    .from("albums")
    .select("*")
    .eq("share_code", shareCode)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as CloudAlbumRecord | null;
}

export async function createCloudAlbum(name: string, pinCode?: string) {
  if (!supabase) {
    throw new Error("Supabase no esta configurado.");
  }

  const shareCode = createShareCode(name);
  const { data, error } = await supabase
    .from("albums")
    .insert({
      name: name.trim(),
      share_code: shareCode,
      pin_code: pinCode?.trim() || null
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as CloudAlbumRecord;
}

export async function updateCloudAlbumPin(albumId: string, pinCode?: string) {
  if (!supabase) {
    throw new Error("Supabase no esta configurado.");
  }

  const { data, error } = await supabase
    .from("albums")
    .update({ pin_code: pinCode?.trim() || null })
    .eq("id", albumId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as CloudAlbumRecord;
}

export function isAlbumAuthorized(album: CloudAlbumRecord) {
  if (!album.pin_code) {
    return true;
  }

  return window.localStorage.getItem(getAlbumAuthStorageKey(album.id)) === "true";
}

export function authorizeAlbum(albumId: string) {
  window.localStorage.setItem(getAlbumAuthStorageKey(albumId), "true");
}

export function revokeAlbumAuthorization(albumId: string) {
  window.localStorage.removeItem(getAlbumAuthStorageKey(albumId));
}

export function getAlbumAuthStorageKey(albumId: string) {
  return `${ALBUM_AUTH_STORAGE_PREFIX}${albumId}`;
}

export function summarizeAlbum(album: AlbumData): MigrationSummary {
  const stickers = Object.values(album.stickers);

  return {
    migrated: stickers.length,
    pegados: stickers.filter((sticker) => sticker.pegado).length,
    repetidos: stickers.reduce((total, sticker) => total + sticker.repetidos, 0)
  };
}

export function applyCloudRowToAlbum(
  album: AlbumData,
  row: AlbumStickerRow
): AlbumData {
  if (!album.stickers[row.id as StickerId]) {
    return album;
  }

  return {
    ...album,
    stickers: {
      ...album.stickers,
      [row.id]: rowToSticker(row, album.editor)
    }
  };
}

export function removeCloudRowFromAlbum(
  album: AlbumData,
  stickerId: StickerId
): AlbumData {
  if (!album.stickers[stickerId]) {
    return album;
  }

  const cleanAlbum = createInitialData(album.editor);

  return {
    ...album,
    stickers: {
      ...album.stickers,
      [stickerId]: cleanAlbum.stickers[stickerId]
    }
  };
}

function rowToSticker(row: AlbumStickerRow, fallbackEditor: UserName): StickerData {
  const repeatedByUser = createEmptyUserRepeatedMap();
  const updatedBy = isUserName(row.updated_by) ? row.updated_by : fallbackEditor;
  repeatedByUser[updatedBy] = row.repeats > 0 ? Math.floor(row.repeats) : 0;

  return {
    pegado: Boolean(row.stuck),
    repetidos: getTotalRepeated(repeatedByUser),
    repetidosPorUsuario: repeatedByUser,
    ...(isUserName(row.updated_by) ? { lastModifiedBy: row.updated_by } : {}),
    ...(row.updated_at ? { lastModifiedAt: row.updated_at } : {})
  };
}

function albumStickerToRow(
  album: AlbumData,
  stickerId: StickerId,
  albumId: string
): AlbumStickerRow {
  const checklistSticker = CHECKLIST.find((sticker) => sticker.id === stickerId);
  const sticker = album.stickers[stickerId];

  if (!checklistSticker) {
    throw new Error(`Cromo no encontrado en checklist: ${stickerId}`);
  }

  return {
    album_id: albumId,
    id: checklistSticker.id,
    code: checklistSticker.codigo,
    category: checklistSticker.categoria,
    selection: checklistSticker.seleccion,
    type: checklistSticker.tipo,
    name: checklistSticker.nombre,
    stuck: sticker.pegado,
    repeats: sticker.repetidos,
    updated_by: album.editor,
    updated_at: new Date().toISOString()
  };
}

function createShareCode(name: string) {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 28);
  const suffix = Math.random().toString(36).slice(2, 8);

  return `${slug || "album"}-${suffix}`;
}

function isUserName(value: unknown): value is UserName {
  return USERS.includes(value as UserName);
}
