import { CHECKLIST } from "./checklist";
import {
  USERS,
  createEmptyUserRepeatedMap,
  createInitialData,
  getTotalRepeated
} from "./album";
import type { AlbumData, StickerData, StickerId, UserName } from "./album";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

type AlbumStickerRow = {
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

export function hasCloudAlbum() {
  return isSupabaseConfigured && Boolean(supabase);
}

export async function loadCloudAlbum(editor: UserName): Promise<CloudLoadResult> {
  if (!supabase) {
    return {
      album: createInitialData(editor),
      source: "local",
      message:
        "Supabase no esta configurado. Usando localStorage como respaldo temporal."
    };
  }

  const { data, error } = await supabase.from("album_stickers").select("*");

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
  stickerId: StickerId
) {
  if (!supabase) {
    throw new Error("Supabase no esta configurado.");
  }

  const row = albumStickerToRow(album, stickerId);
  const { error } = await supabase.from("album_stickers").upsert(row);

  if (error) {
    throw error;
  }
}

export async function upsertCloudAlbum(album: AlbumData) {
  if (!supabase) {
    throw new Error("Supabase no esta configurado.");
  }

  const rows = Object.keys(album.stickers).map((stickerId) =>
    albumStickerToRow(album, stickerId as StickerId)
  );
  const { error } = await supabase.from("album_stickers").upsert(rows);

  if (error) {
    throw error;
  }

  return summarizeAlbum(album);
}

export function summarizeAlbum(album: AlbumData): MigrationSummary {
  const stickers = Object.values(album.stickers);

  return {
    migrated: stickers.length,
    pegados: stickers.filter((sticker) => sticker.pegado).length,
    repetidos: stickers.reduce((total, sticker) => total + sticker.repetidos, 0)
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

function albumStickerToRow(album: AlbumData, stickerId: StickerId): AlbumStickerRow {
  const checklistSticker = CHECKLIST.find((sticker) => sticker.id === stickerId);
  const sticker = album.stickers[stickerId];

  if (!checklistSticker) {
    throw new Error(`Cromo no encontrado en checklist: ${stickerId}`);
  }

  return {
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

function isUserName(value: unknown): value is UserName {
  return USERS.includes(value as UserName);
}
