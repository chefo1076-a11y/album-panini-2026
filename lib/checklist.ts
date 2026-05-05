import type { WorldCupGroupId } from "./worldCupGroups";

export type ChecklistCategoria = "Inicial" | "FWC" | "CC" | "Equipo";

export type ChecklistTipo =
  | "Logo"
  | "Intro"
  | "Mascota"
  | "Balón"
  | "Sede/Estadio"
  | "Portero"
  | "Defensa"
  | "Mediocampista"
  | "Delantero"
  | "Jugador"
  | "Escudo"
  | "Selección";

export type ChecklistStickerType = "special" | "player" | "coca-cola";

export type ChecklistSticker = {
  id: string;
  codigo: string;
  categoria: ChecklistCategoria;
  seleccion: string | null;
  grupo: WorldCupGroupId | null;
  tipo: ChecklistTipo;
  nombre: string;
  descripcion: string | null;
  section: string;
  country: string;
  group?: WorldCupGroupId;
  flag: string;
  flagUrl?: string;
  number: number;
  type: ChecklistStickerType;
  label: string;
  playerName: string;
  description: string;
  position: string;
  club: string;
  isSpecial: boolean;
};

export type ChecklistSection = {
  id: string;
  title: string;
  stickers: ChecklistSticker[];
};

type TeamSection = {
  section: string;
  country: string;
  group: WorldCupGroupId;
  flag: string;
  flagUrl: string;
};

const PENDING_DESCRIPTION = "Pendiente de completar";

const FLAG_COUNTRY_CODES: Record<string, string> = {
  ENG: "gb",
  KOR: "kr",
  CZE: "cz",
  MEX: "mx",
  RSA: "za",
  CAN: "ca",
  BIH: "ba",
  QAT: "qa",
  SUI: "ch",
  BRA: "br",
  MAR: "ma",
  HAI: "ht",
  SCO: "gb-sct",
  USA: "us",
  PAR: "py",
  AUS: "au",
  TUR: "tr",
  GER: "de",
  CUW: "cw",
  CIV: "ci",
  ECU: "ec",
  NED: "nl",
  JPN: "jp",
  SWE: "se",
  TUN: "tn",
  BEL: "be",
  EGY: "eg",
  IRN: "ir",
  NZL: "nz",
  ESP: "es",
  CPV: "cv",
  KSA: "sa",
  URU: "uy",
  FRA: "fr",
  SEN: "sn",
  IRQ: "iq",
  NOR: "no",
  ARG: "ar",
  ALG: "dz",
  AUT: "at",
  JOR: "jo",
  POR: "pt",
  COD: "cd",
  UZB: "uz",
  COL: "co",
  CRO: "hr",
  GHA: "gh",
  PAN: "pa"
};

export function getFlagUrl(code: string) {
  const flagCode = FLAG_COUNTRY_CODES[code.toUpperCase()];

  return flagCode ? `https://flagcdn.com/w40/${flagCode}.png` : undefined;
}

const RAW_TEAM_SECTIONS = [
  { section: "Mexico", country: "MEX", group: "A", flag: "🇲🇽" },
  { section: "South Africa", country: "RSA", group: "A", flag: "🇿🇦" },
  { section: "Korea Republic", country: "KOR", group: "A", flag: "🇰🇷" },
  { section: "Czechia", country: "CZE", group: "A", flag: "🇨🇿" },
  { section: "Canada", country: "CAN", group: "B", flag: "🇨🇦" },
  { section: "Bosnia-Herzegovina", country: "BIH", group: "B", flag: "🇧🇦" },
  { section: "Qatar", country: "QAT", group: "B", flag: "🇶🇦" },
  { section: "Switzerland", country: "SUI", group: "B", flag: "🇨🇭" },
  { section: "Brazil", country: "BRA", group: "C", flag: "🇧🇷" },
  { section: "Morocco", country: "MAR", group: "C", flag: "🇲🇦" },
  { section: "Haiti", country: "HAI", group: "C", flag: "🇭🇹" },
  { section: "Scotland", country: "SCO", group: "C", flag: "🏴" },
  { section: "USA", country: "USA", group: "D", flag: "🇺🇸" },
  { section: "Paraguay", country: "PAR", group: "D", flag: "🇵🇾" },
  { section: "Australia", country: "AUS", group: "D", flag: "🇦🇺" },
  { section: "Turkiye", country: "TUR", group: "D", flag: "🇹🇷" },
  { section: "Germany", country: "GER", group: "E", flag: "🇩🇪" },
  { section: "Curacao", country: "CUW", group: "E", flag: "🇨🇼" },
  { section: "Cote d'Ivoire", country: "CIV", group: "E", flag: "🇨🇮" },
  { section: "Ecuador", country: "ECU", group: "E", flag: "🇪🇨" },
  { section: "Netherlands", country: "NED", group: "F", flag: "🇳🇱" },
  { section: "Japan", country: "JPN", group: "F", flag: "🇯🇵" },
  { section: "Sweden", country: "SWE", group: "F", flag: "🇸🇪" },
  { section: "Tunisia", country: "TUN", group: "F", flag: "🇹🇳" },
  { section: "Belgium", country: "BEL", group: "G", flag: "🇧🇪" },
  { section: "Egypt", country: "EGY", group: "G", flag: "🇪🇬" },
  { section: "IR Iran", country: "IRN", group: "G", flag: "🇮🇷" },
  { section: "New Zealand", country: "NZL", group: "G", flag: "🇳🇿" },
  { section: "Spain", country: "ESP", group: "H", flag: "🇪🇸" },
  { section: "Cabo Verde", country: "CPV", group: "H", flag: "🇨🇻" },
  { section: "Saudi Arabia", country: "KSA", group: "H", flag: "🇸🇦" },
  { section: "Uruguay", country: "URU", group: "H", flag: "🇺🇾" },
  { section: "France", country: "FRA", group: "I", flag: "🇫🇷" },
  { section: "Senegal", country: "SEN", group: "I", flag: "🇸🇳" },
  { section: "Iraq", country: "IRQ", group: "I", flag: "🇮🇶" },
  { section: "Norway", country: "NOR", group: "I", flag: "🇳🇴" },
  { section: "Argentina", country: "ARG", group: "J", flag: "🇦🇷" },
  { section: "Algeria", country: "ALG", group: "J", flag: "🇩🇿" },
  { section: "Austria", country: "AUT", group: "J", flag: "🇦🇹" },
  { section: "Jordan", country: "JOR", group: "J", flag: "🇯🇴" },
  { section: "Portugal", country: "POR", group: "K", flag: "🇵🇹" },
  { section: "Congo DR", country: "COD", group: "K", flag: "🇨🇩" },
  { section: "Uzbekistan", country: "UZB", group: "K", flag: "🇺🇿" },
  { section: "Colombia", country: "COL", group: "K", flag: "🇨🇴" },
  { section: "England", country: "ENG", group: "L", flag: "🏴" },
  { section: "Croatia", country: "CRO", group: "L", flag: "🇭🇷" },
  { section: "Ghana", country: "GHA", group: "L", flag: "🇬🇭" },
  { section: "Panama", country: "PAN", group: "L", flag: "🇵🇦" }
] as const;

export const TEAM_SECTIONS: TeamSection[] = RAW_TEAM_SECTIONS.map((team) => ({
  ...team,
  group: team.group as WorldCupGroupId,
  flagUrl: getFlagUrl(team.country) ?? ""
}));

export const CHECKLIST_SECTIONS: ChecklistSection[] = [
  {
    id: "00",
    title: "Intro",
    stickers: [
      createSticker({
        codigo: "00",
        categoria: "Inicial",
        country: "00",
        flag: "🏆",
        section: "Intro",
        number: 0,
        type: "special",
        tipo: "Intro",
        nombre: "00",
        descripcion: PENDING_DESCRIPTION
      })
    ]
  },
  {
    id: "FWC",
    title: "FIFA World Cup 2026",
    stickers: createSpecialStickers({
      country: "FWC",
      flag: "🏆",
      section: "FIFA World Cup 2026",
      total: 19,
      categoria: "FWC",
      type: "special"
    })
  },
  ...TEAM_SECTIONS.map((team) => ({
    id: team.country,
    title: team.section,
    stickers: createTeamStickers(team)
  })),
  {
    id: "CC",
    title: "Coca-Cola",
    stickers: createSpecialStickers({
      country: "CC",
      flag: "🥤",
      section: "Coca-Cola",
      total: 14,
      categoria: "CC",
      type: "coca-cola"
    })
  }
];

export const CHECKLIST: ChecklistSticker[] = CHECKLIST_SECTIONS.flatMap(
  (section) => section.stickers
);

function createSpecialStickers({
  country,
  flag,
  section,
  total,
  categoria,
  type
}: {
  country: "FWC" | "CC";
  flag: string;
  section: string;
  total: number;
  categoria: "FWC" | "CC";
  type: ChecklistStickerType;
}) {
  return Array.from({ length: total }, (_, index) => {
    const number = index + 1;
    const codigo = country === "CC" ? `CC${number}` : `FWC ${number}`;

    return createSticker({
      codigo,
      categoria,
      country,
      flag,
      section,
      number,
      type,
      tipo: getSpecialType(country, number),
      nombre: getKnownSpecialName(country, number) ?? codigo,
      descripcion: getKnownSpecialDescription(country, number) ?? PENDING_DESCRIPTION
    });
  });
}

function createTeamStickers(team: TeamSection) {
  return Array.from({ length: 20 }, (_, index) => {
    const number = index + 1;
    const codigo = `${team.country} ${number}`;
    const tipo = getTeamStickerType(number);

    return createSticker({
      codigo,
      categoria: "Equipo",
      seleccion: team.section,
      grupo: team.group,
      country: team.country,
      flag: team.flag,
      flagUrl: team.flagUrl,
      section: team.section,
      number,
      type: "player",
      tipo,
      nombre: codigo,
      descripcion: PENDING_DESCRIPTION
    });
  });
}

function createSticker({
  codigo,
  categoria,
  seleccion = null,
  grupo = null,
  country,
  flag,
  flagUrl,
  section,
  number,
  type,
  tipo,
  nombre,
  descripcion
}: {
  codigo: string;
  categoria: ChecklistCategoria;
  seleccion?: string | null;
  grupo?: WorldCupGroupId | null;
  country: string;
  flag: string;
  flagUrl?: string;
  section: string;
  number: number;
  type: ChecklistStickerType;
  tipo: ChecklistTipo;
  nombre: string;
  descripcion: string | null;
}): ChecklistSticker {
  return {
    id: codigo,
    codigo,
    categoria,
    seleccion,
    grupo,
    country,
    flag,
    ...(flagUrl ? { flagUrl } : {}),
    section,
    ...(grupo ? { group: grupo } : {}),
    number,
    type,
    tipo,
    nombre,
    descripcion,
    label: codigo,
    playerName: nombre === codigo ? "" : nombre,
    description: descripcion ?? "",
    position: tipo,
    club: "",
    isSpecial: categoria !== "Equipo"
  };
}

function getTeamStickerType(number: number): ChecklistTipo {
  if (number === 1) {
    return "Escudo";
  }

  if (number === 2) {
    return "Selección";
  }

  return "Jugador";
}

function getSpecialType(country: "FWC" | "CC", number: number): ChecklistTipo {
  if (country === "CC") {
    return "Intro";
  }

  if (number === 1) {
    return "Balón";
  }

  if (number >= 2 && number <= 4) {
    return "Sede/Estadio";
  }

  if (number === 5) {
    return "Mascota";
  }

  return "Intro";
}

function getKnownSpecialName(country: "FWC" | "CC", number: number) {
  if (country === "FWC" && number === 1) {
    return "TRIONDA - Official Match Ball";
  }

  return null;
}

function getKnownSpecialDescription(country: "FWC" | "CC", number: number) {
  if (country === "FWC" && number === 1) {
    return "Balón oficial de partido de FIFA World Cup 2026.";
  }

  return null;
}

if (CHECKLIST.length !== 994) {
  throw new Error(`El checklist oficial debe tener 994 cromos. Actual: ${CHECKLIST.length}`);
}
