import { CHECKLIST } from "./checklist";
import type { ChecklistSticker } from "./checklist";
import type { TeamCode, WorldCupGroupId } from "./worldCupGroups";

export const USERS = ["Juanjo", "Mari", "Mateo"] as const;
export const STORAGE_KEY = "panini-mundial-2026-v1";
export const ALBUM_SCHEMA_VERSION = 3;
export const TOTAL_STICKERS = CHECKLIST.length;

export type UserName = (typeof USERS)[number];
export type StickerId = ChecklistSticker["id"];
export type StatusFilter = "Todos" | "Pegados" | "Faltantes" | "Con repetidos";

export type StickerSnapshot = {
  pegado: boolean;
  repetidos: number;
  repetidosPorUsuario: Record<UserName, number>;
};

export type StickerHistoryEntry = {
  id: string;
  action: "sticker_updated";
  by: UserName;
  at: string;
  before: StickerSnapshot;
  after: StickerSnapshot;
};

export type StickerData = StickerSnapshot & {
  lastModifiedBy?: UserName;
  lastModifiedAt?: string;
  history?: StickerHistoryEntry[];
};

export type AlbumData = {
  schemaVersion: typeof ALBUM_SCHEMA_VERSION;
  editor: UserName;
  stickers: Record<StickerId, StickerData>;
};

export type NormalizeAlbumResult = {
  album: AlbumData;
  resetReason?: string;
};

export type AlbumStats = {
  total: number;
  pegados: number;
  faltantes: number;
  cromosConRepetidos: number;
  totalRepetidos: number;
  avance: number;
};

export type RepeatedStickerSummary = {
  sticker: ChecklistSticker;
  quantity: number;
  byUser: Record<UserName, number>;
};

export type ExchangeSuggestion = {
  repeated: RepeatedStickerSummary;
  missing: ChecklistSticker;
};

export type ExchangeListType = "all" | "missing" | "repeated";

export type Filters = {
  status: StatusFilter;
  query: string;
  groupId: "Todos" | WorldCupGroupId;
  teamCode: "Todos" | TeamCode | "FWC" | "CC" | "00";
};

export function createSticker(): StickerData {
  return {
    pegado: false,
    repetidos: 0,
    repetidosPorUsuario: createEmptyUserRepeatedMap()
  };
}

export function createInitialData(editor: UserName = "Juanjo"): AlbumData {
  return {
    schemaVersion: ALBUM_SCHEMA_VERSION,
    editor,
    stickers: Object.fromEntries(
      CHECKLIST.map((sticker) => [sticker.id, createSticker()])
    ) as Record<StickerId, StickerData>
  };
}

export function normalizeData(value: unknown): NormalizeAlbumResult {
  const initialData = createInitialData();

  if (!value || typeof value !== "object") {
    return { album: initialData };
  }

  const saved = value as {
    editor?: unknown;
    schemaVersion?: unknown;
    stickers?: Record<string, unknown>;
  };

  if (saved.schemaVersion !== ALBUM_SCHEMA_VERSION) {
    return {
      album: createInitialData(isUserName(saved.editor) ? saved.editor : "Juanjo"),
      resetReason:
        "Se detecto un formato anterior del album. Reiniciamos el progreso para usar el checklist oficial actualizado."
    };
  }

  if (!saved.stickers || typeof saved.stickers !== "object") {
    return {
      album: createInitialData(isUserName(saved.editor) ? saved.editor : "Juanjo"),
      resetReason:
        "El progreso guardado no era compatible con el checklist oficial y fue reiniciado."
    };
  }

  const editor = isUserName(saved.editor) ? saved.editor : "Juanjo";
  const normalizedAlbum = createInitialData(editor);

  for (const sticker of CHECKLIST) {
    normalizedAlbum.stickers[sticker.id] = normalizeSticker(
      saved.stickers[sticker.id] ??
        saved.stickers[sticker.codigo] ??
        saved.stickers[getLegacyStickerId(sticker)],
      editor
    );
  }

  return { album: normalizedAlbum };
}

export function getAlbumStats(stickers: Record<StickerId, StickerData>): AlbumStats {
  const entries = CHECKLIST.map((sticker) => stickers[sticker.id]);
  const pegados = entries.filter((sticker) => sticker.pegado).length;
  const faltantes = TOTAL_STICKERS - pegados;
  const cromosConRepetidos = entries.filter(
    (sticker) => sticker.repetidos > 0
  ).length;
  const totalRepetidos = entries.reduce(
    (total, sticker) => total + sticker.repetidos,
    0
  );
  const avance = Number(((pegados / TOTAL_STICKERS) * 100).toFixed(1));

  return {
    total: TOTAL_STICKERS,
    pegados,
    faltantes,
    cromosConRepetidos,
    totalRepetidos,
    avance
  };
}

export function getVisibleStickers(
  stickers: Record<StickerId, StickerData>,
  filters: Filters
) {
  const normalizedQuery = normalizeSearch(filters.query);

  return CHECKLIST.filter((checklistSticker) => {
    const sticker = stickers[checklistSticker.id];
    const matchesQuery =
      normalizedQuery === "" ||
      normalizeSearch(
        [
          checklistSticker.id,
          checklistSticker.codigo,
          checklistSticker.label,
          checklistSticker.section,
          checklistSticker.country,
          checklistSticker.playerName,
          checklistSticker.nombre,
          checklistSticker.descripcion ?? "",
          checklistSticker.seleccion ?? "",
          checklistSticker.tipo
        ].join(" ")
      ).includes(normalizedQuery);
    const matchesGroup =
      filters.groupId === "Todos" || checklistSticker.group === filters.groupId;
    const matchesTeam =
      filters.teamCode === "Todos" || checklistSticker.country === filters.teamCode;

    return (
      matchesQuery &&
      matchesGroup &&
      matchesTeam &&
      matchesStatus(sticker, filters.status)
    );
  });
}

export function getMissingStickers(stickers: Record<StickerId, StickerData>) {
  return CHECKLIST.filter((checklistSticker) => !stickers[checklistSticker.id].pegado);
}

export function getRepeatedStickerSummaries(
  stickers: Record<StickerId, StickerData>
): RepeatedStickerSummary[] {
  return CHECKLIST.map((checklistSticker) => ({
    sticker: checklistSticker,
    quantity: stickers[checklistSticker.id].repetidos,
    byUser: stickers[checklistSticker.id].repetidosPorUsuario
  })).filter((sticker) => sticker.quantity > 0);
}

export function getExchangeSuggestions(
  missingStickers: ChecklistSticker[],
  repeatedStickers: RepeatedStickerSummary[]
): ExchangeSuggestion[] {
  const maxSuggestions = Math.min(8, missingStickers.length, repeatedStickers.length);

  return Array.from({ length: maxSuggestions }, (_, index) => ({
    repeated: repeatedStickers[index],
    missing: missingStickers[index]
  }));
}

export function formatExchangeText(
  missingStickers: ChecklistSticker[],
  repeatedStickers: RepeatedStickerSummary[],
  type: ExchangeListType = "all"
) {
  const sections = ["ÁLBUM PANINI MUNDIAL 2026"];

  if (type === "all" || type === "missing") {
    sections.push(["📌 FALTANTES:", formatMissingList(missingStickers)].join("\n\n"));
  }

  if (type === "all" || type === "repeated") {
    sections.push(
      ["🔁 REPETIDOS DISPONIBLES:", formatRepeatedList(repeatedStickers)].join(
        "\n\n"
      )
    );
  }

  return sections.join("\n\n");
}
export function updateAlbumSticker(
  album: AlbumData,
  stickerId: StickerId,
  updater: (sticker: StickerData) => StickerData,
  modifiedAt = new Date().toISOString()
): AlbumData {
  const currentSticker = album.stickers[stickerId] ?? createSticker();
  const nextSticker = normalizeSticker(
    {
      ...updater(currentSticker),
      lastModifiedBy: album.editor,
      lastModifiedAt: modifiedAt
    },
    album.editor
  );

  return {
    ...album,
    stickers: {
      ...album.stickers,
      [stickerId]: nextSticker
    }
  };
}

export function changeAlbumEditor(album: AlbumData, editor: UserName): AlbumData {
  return {
    ...album,
    editor
  };
}

export function resetAlbum(album: AlbumData): AlbumData {
  return createInitialData(album.editor);
}

export function createEmptyUserRepeatedMap(): Record<UserName, number> {
  return USERS.reduce(
    (result, user) => ({
      ...result,
      [user]: 0
    }),
    {} as Record<UserName, number>
  );
}

export function getTotalRepeated(repetidosPorUsuario: Record<UserName, number>) {
  return USERS.reduce((total, user) => total + repetidosPorUsuario[user], 0);
}

const flagEmojiMap: Record<string, string> = {
  MEX: "🇲🇽",
  RSA: "🇿🇦",
  KOR: "🇰🇷",
  CZE: "🇨🇿",
  CAN: "🇨🇦",
  BIH: "🇧🇦",
  QAT: "🇶🇦",
  SUI: "🇨🇭",
  BRA: "🇧🇷",
  MAR: "🇲🇦",
  HAI: "🇭🇹",
  SCO: "🏴",
  USA: "🇺🇸",
  PAR: "🇵🇾",
  AUS: "🇦🇺",
  TUR: "🇹🇷",
  GER: "🇩🇪",
  CUW: "🇨🇼",
  CIV: "🇨🇮",
  ECU: "🇪🇨",
  NED: "🇳🇱",
  JPN: "🇯🇵",
  SWE: "🇸🇪",
  TUN: "🇹🇳",
  BEL: "🇧🇪",
  EGY: "🇪🇬",
  IRN: "🇮🇷",
  NZL: "🇳🇿",
  ESP: "🇪🇸",
  CPV: "🇨🇻",
  KSA: "🇸🇦",
  URU: "🇺🇾",
  FRA: "🇫🇷",
  SEN: "🇸🇳",
  IRQ: "🇮🇶",
  NOR: "🇳🇴",
  ARG: "🇦🇷",
  ALG: "🇩🇿",
  AUT: "🇦🇹",
  JOR: "🇯🇴",
  POR: "🇵🇹",
  COD: "🇨🇩",
  UZB: "🇺🇿",
  COL: "🇨🇴",
  ENG: "🏴",
  CRO: "🇭🇷",
  GHA: "🇬🇭",
  PAN: "🇵🇦"
};

export function getFlagEmoji(countryCode: string) {
  return flagEmojiMap[countryCode.toUpperCase()] ?? "🏳️";

  const emojis: Record<string, string> = {
    MEX: "ðŸ‡²ðŸ‡½",
    RSA: "ðŸ‡¿ðŸ‡¦",
    KOR: "ðŸ‡°ðŸ‡·",
    CZE: "ðŸ‡¨ðŸ‡¿",
    CAN: "ðŸ‡¨ðŸ‡¦",
    BIH: "ðŸ‡§ðŸ‡¦",
    QAT: "ðŸ‡¶ðŸ‡¦",
    SUI: "ðŸ‡¨ðŸ‡­",
    BRA: "ðŸ‡§ðŸ‡·",
    MAR: "ðŸ‡²ðŸ‡¦",
    HAI: "ðŸ‡­ðŸ‡¹",
    SCO: "ðŸ´",
    USA: "ðŸ‡ºðŸ‡¸",
    PAR: "ðŸ‡µðŸ‡¾",
    AUS: "ðŸ‡¦ðŸ‡º",
    TUR: "ðŸ‡¹ðŸ‡·",
    GER: "ðŸ‡©ðŸ‡ª",
    CUW: "ðŸ‡¨ðŸ‡¼",
    CIV: "ðŸ‡¨ðŸ‡®",
    ECU: "ðŸ‡ªðŸ‡¨",
    NED: "ðŸ‡³ðŸ‡±",
    JPN: "ðŸ‡¯ðŸ‡µ",
    SWE: "ðŸ‡¸ðŸ‡ª",
    TUN: "ðŸ‡¹ðŸ‡³",
    BEL: "ðŸ‡§ðŸ‡ª",
    EGY: "ðŸ‡ªðŸ‡¬",
    IRN: "ðŸ‡®ðŸ‡·",
    NZL: "ðŸ‡³ðŸ‡¿",
    ESP: "ðŸ‡ªðŸ‡¸",
    CPV: "ðŸ‡¨ðŸ‡»",
    KSA: "ðŸ‡¸ðŸ‡¦",
    URU: "ðŸ‡ºðŸ‡¾",
    FRA: "ðŸ‡«ðŸ‡·",
    SEN: "ðŸ‡¸ðŸ‡³",
    IRQ: "ðŸ‡®ðŸ‡¶",
    NOR: "ðŸ‡³ðŸ‡´",
    ARG: "ðŸ‡¦ðŸ‡·",
    ALG: "ðŸ‡©ðŸ‡¿",
    AUT: "ðŸ‡¦ðŸ‡¹",
    JOR: "ðŸ‡¯ðŸ‡´",
    POR: "ðŸ‡µðŸ‡¹",
    COD: "ðŸ‡¨ðŸ‡©",
    UZB: "ðŸ‡ºðŸ‡¿",
    COL: "ðŸ‡¨ðŸ‡´",
    ENG: "ðŸ´",
    CRO: "ðŸ‡­ðŸ‡·",
    GHA: "ðŸ‡¬ðŸ‡­",
    PAN: "ðŸ‡µðŸ‡¦"
  };

  return emojis[countryCode] ?? "";
}

function formatMissingList(missingStickers: ChecklistSticker[]) {
  return formatGroupedStickers(missingStickers, (sticker) => sticker.codigo);
}

function formatRepeatedList(repeatedStickers: RepeatedStickerSummary[]) {
  return formatGroupedRepeatedStickers(repeatedStickers);
}

function formatGroupedStickers(
  stickers: ChecklistSticker[],
  formatter: (sticker: ChecklistSticker) => string
) {
  if (stickers.length === 0) {
    return "Ninguno";
  }

  return getGroupedStickerEntries(stickers)
    .map(
      (group) =>
        `${formatGroupTitle(group.country, group.stickers[0])}\n${group.stickers
          .map(formatter)
          .join(", ")}`
    )
    .join("\n\n");
}

function formatGroupedRepeatedStickers(repeatedStickers: RepeatedStickerSummary[]) {
  if (repeatedStickers.length === 0) {
    return "Ninguno";
  }

  const grouped = new Map<string, RepeatedStickerSummary[]>();

  for (const repeatedSticker of repeatedStickers) {
    const country = repeatedSticker.sticker.country;
    grouped.set(country, [...(grouped.get(country) ?? []), repeatedSticker]);
  }

  return Array.from(grouped.entries())
    .map(([country, summaries]) => {
      const firstSticker = summaries[0].sticker;
      const repeatedLine = summaries
        .map((summary) => `${summary.sticker.codigo} (x${summary.quantity})`)
        .join(", ");

      return `${formatGroupTitle(country, firstSticker)}\n${repeatedLine}`;
    })
    .join("\n\n");
}

function getGroupedStickerEntries(stickers: ChecklistSticker[]) {
  const grouped = new Map<string, ChecklistSticker[]>();

  for (const sticker of stickers) {
    grouped.set(sticker.country, [...(grouped.get(sticker.country) ?? []), sticker]);
  }

  return Array.from(grouped.entries()).map(([country, groupStickers]) => ({
    country,
    stickers: groupStickers
  }));
}

function formatGroupTitle(country: string, firstSticker: ChecklistSticker) {
  if (country === "00") {
    return "🏆 Inicial";
  }

  if (country === "FWC") {
    return "🌟 Especiales FWC";
  }

  if (country === "CC") {
    return "🥤 Coca-Cola";
  }

  return `${getFlagEmoji(country)} ${getCountryDisplayName(firstSticker)}`.trim();
}

function getCountryDisplayName(sticker: ChecklistSticker) {
  const displayNames: Record<string, string> = {
    MEX: "México",
    BRA: "Brasil"
  };

  return displayNames[sticker.country] ?? sticker.seleccion ?? sticker.section;
}

function formatSelectionSummary(
  missingStickers: ChecklistSticker[],
  repeatedStickers: RepeatedStickerSummary[]
) {
  const selectionCodes = Array.from(
    new Set([
      ...missingStickers.map((sticker) => sticker.country),
      ...repeatedStickers.map((summary) => summary.sticker.country)
    ])
  )
    .filter((code) => code !== "00" && code !== "FWC" && code !== "CC")
    .sort();

  if (selectionCodes.length === 0) {
    return "Sin selecciones pendientes";
  }

  return selectionCodes
    .map((code) => {
      const missingCount = missingStickers.filter(
        (sticker) => sticker.country === code
      ).length;
      const repeatedCount = repeatedStickers
        .filter((summary) => summary.sticker.country === code)
        .reduce((total, summary) => total + summary.quantity, 0);

      return `${getFlagEmoji(code)} ${code}: faltan ${missingCount}, repetidos ${repeatedCount}`;
    })
    .join("\n");
}

function getLegacyStickerId(sticker: ChecklistSticker) {
  if (sticker.codigo === "00") {
    return "00";
  }

  if (sticker.country === "CC") {
    return `CC-${sticker.number}`;
  }

  return `${sticker.country}-${sticker.number}`;
}

function normalizeSticker(value: unknown, fallbackEditor: UserName = "Juanjo"): StickerData {
  if (!value || typeof value !== "object") {
    return createSticker();
  }

  const sticker = value as Partial<StickerData>;
  const lastModifiedBy = isUserName(sticker.lastModifiedBy)
    ? sticker.lastModifiedBy
    : undefined;
  const repeatedOwner = lastModifiedBy ?? fallbackEditor;
  const repetidosPorUsuario = normalizeRepeatedByUser(
    sticker.repetidosPorUsuario,
    sticker.repetidos,
    repeatedOwner
  );
  const repetidos = getTotalRepeated(repetidosPorUsuario);
  const lastModifiedAt =
    typeof sticker.lastModifiedAt === "string" ? sticker.lastModifiedAt : undefined;
  const history = Array.isArray(sticker.history)
    ? sticker.history.filter(isStickerHistoryEntry)
    : undefined;

  return {
    pegado: Boolean(sticker.pegado),
    repetidos,
    repetidosPorUsuario,
    ...(lastModifiedBy ? { lastModifiedBy } : {}),
    ...(lastModifiedAt ? { lastModifiedAt } : {}),
    ...(history && history.length > 0 ? { history } : {})
  };
}

function normalizeRepeatedByUser(
  value: unknown,
  legacyRepeated: unknown,
  fallbackEditor: UserName
) {
  const repeatedByUser = createEmptyUserRepeatedMap();

  if (value && typeof value === "object") {
    const savedRepeatedByUser = value as Partial<Record<UserName, unknown>>;

    for (const user of USERS) {
      const quantity = savedRepeatedByUser[user];
      repeatedByUser[user] =
        typeof quantity === "number" && quantity > 0 ? Math.floor(quantity) : 0;
    }
  } else if (typeof legacyRepeated === "number" && legacyRepeated > 0) {
    repeatedByUser[fallbackEditor] = Math.floor(legacyRepeated);
  }

  return repeatedByUser;
}

function matchesStatus(sticker: StickerData, status: StatusFilter) {
  if (status === "Pegados") {
    return sticker.pegado;
  }

  if (status === "Faltantes") {
    return !sticker.pegado;
  }

  if (status === "Con repetidos") {
    return sticker.repetidos > 0;
  }

  return true;
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isUserName(value: unknown): value is UserName {
  return USERS.includes(value as UserName);
}

function isStickerHistoryEntry(value: unknown): value is StickerHistoryEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Partial<StickerHistoryEntry>;

  return (
    entry.action === "sticker_updated" &&
    isUserName(entry.by) &&
    typeof entry.at === "string" &&
    isStickerSnapshot(entry.before) &&
    isStickerSnapshot(entry.after)
  );
}

function isStickerSnapshot(value: unknown): value is StickerSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const snapshot = value as Partial<StickerSnapshot>;

  return (
    typeof snapshot.pegado === "boolean" &&
    typeof snapshot.repetidos === "number" &&
    snapshot.repetidos >= 0
  );
}

