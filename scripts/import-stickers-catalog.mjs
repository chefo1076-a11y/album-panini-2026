import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

await loadDotEnvLocal();

const [, , inputPath] = process.argv;

if (!inputPath) {
  console.error("Uso: npm run import:catalog -- <catalogo.csv|catalogo.json>");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  process.exit(1);
}

const raw = await readFile(inputPath, "utf8");
const sourceRows = inputPath.toLowerCase().endsWith(".json")
  ? JSON.parse(raw)
  : parseCsv(raw);

if (!Array.isArray(sourceRows)) {
  console.error("El JSON debe ser un arreglo de cromos.");
  process.exit(1);
}

const rows = sourceRows.map(normalizeRow);
const selectionsDetected = new Set(rows.filter((row) => row.category === "Equipo").map((row) => row.country)).size;
const groupsDetected = new Set(rows.map((row) => row.group_code).filter(Boolean)).size;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const { error: deleteError } = await supabase
  .from("stickers_catalog")
  .delete()
  .neq("sticker_code", "__never__");

if (deleteError) {
  console.error(`No se pudo limpiar stickers_catalog: ${deleteError.message}`);
  console.error("Ejecuta el SQL actualizado para permitir DELETE en stickers_catalog.");
  process.exit(1);
}

for (const batch of chunk(rows, 500)) {
  const { error } = await supabase
    .from("stickers_catalog")
    .upsert(batch, { onConflict: "sticker_code" });

  if (error) {
    console.error(error.message);
    process.exit(1);
  }
}

console.log(`Catalogo importado: ${rows.length} cromos.`);
console.log(`Selecciones detectadas: ${selectionsDetected}`);
console.log(`Grupos detectados: ${groupsDetected}`);
console.log("Ejemplo de cromo:", rows[0]);

async function loadDotEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");

  try {
    const text = await readFile(envPath, "utf8");

    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }

      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // El script tambien puede funcionar con variables ya exportadas en el entorno.
  }
}

function normalizeRow(row, index) {
  const rowReader = createRowReader(row);
  const stickerCode = normalizeStickerCode(
    rowReader("Código", "Codigo", "sticker_code", "codigo", "code", "id")
  );

  if (!stickerCode) {
    throw new Error(`Fila ${index + 1}: falta la columna Código.`);
  }

  const selection = nullable(rowReader("Sección/País", "Seccion/Pais", "selection", "seleccion"));
  const rawCategory = value(rowReader("Tipo", "category", "categoria"));
  const rawStickerType = value(rowReader("Clase", "sticker_type", "tipo"));
  const name = value(rowReader("Nombre", "name", "nombre")) || stickerCode;
  const country = getCountryFromCode(stickerCode);
  const category = normalizeCategory(rawCategory, country);
  const stickerNumber = getNumberFromCode(stickerCode);
  const stickerType = normalizeStickerType(rawStickerType, category, stickerNumber);
  const groupCode =
    nullable(rowReader("Grupo", "group_code", "grupo", "group")) ??
    getGroupForCountry(country);

  return {
    sticker_code: stickerCode,
    sort_order: number(rowReader("sort_order", "orden", "order"), index + 1),
    category,
    section: selection || country,
    country,
    selection,
    group_code: groupCode,
    sticker_number: stickerNumber,
    sticker_type: stickerType,
    name,
    description: nullable(rowReader("Descripción", "Descripcion", "description", "descripcion")),
    flag: nullable(rowReader("Bandera", "flag", "bandera")),
    flag_url: nullable(rowReader("Bandera URL", "flag_url", "bandera_url"))
  };
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  const delimiter = detectDelimiter(lines[0] ?? "");
  const headers = splitCsvLine(lines[0] ?? "", delimiter).map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line, delimiter);

    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
}

function detectDelimiter(headerLine) {
  const delimiters = [",", ";", "\t"];

  return delimiters
    .map((delimiter) => ({
      delimiter,
      count: splitCsvLine(headerLine, delimiter).length
    }))
    .sort((a, b) => b.count - a.count)[0].delimiter;
}

function splitCsvLine(line, delimiter) {
  const cells = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && quoted && nextChar === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells;
}

function createRowReader(row) {
  const entries = Object.entries(row);
  const normalizedEntries = new Map(
    entries.map(([key, value]) => [normalizeHeader(key), value])
  );

  return (...keys) => {
    for (const key of keys) {
      const value = normalizedEntries.get(normalizeHeader(key));

      if (value !== undefined) {
        return value;
      }
    }

    return "";
  };
}

function normalizeHeader(header) {
  return String(header)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function normalizeStickerCode(input) {
  return value(input).replace(/\s+/g, "").toUpperCase();
}

function getCountryFromCode(stickerCode) {
  if (stickerCode === "00") {
    return "00";
  }

  const match = stickerCode.match(/^[A-Z]+/);
  return match?.[0] ?? stickerCode;
}

function normalizeCategory(category, country) {
  const normalized = normalizeText(category);

  if (country === "00" || normalized === "inicial") {
    return "Inicial";
  }

  if (country === "FWC" || normalized === "fwc") {
    return "FWC";
  }

  if (country === "CC" || normalized === "cc" || normalized === "cocacola") {
    return "CC";
  }

  return "Equipo";
}

function normalizeStickerType(stickerType, category, stickerNumber) {
  const normalized = normalizeText(stickerType);
  const knownTypes = {
    logo: "Logo",
    intro: "Intro",
    mascota: "Mascota",
    balon: "Balón",
    sedeestadio: "Sede/Estadio",
    portero: "Portero",
    defensa: "Defensa",
    mediocampista: "Mediocampista",
    delantero: "Delantero",
    jugador: "Jugador",
    escudo: "Escudo",
    seleccion: "Selección"
  };

  if (knownTypes[normalized]) {
    return knownTypes[normalized];
  }

  if (category === "Equipo") {
    if (stickerNumber === 1) {
      return "Escudo";
    }

    if (stickerNumber === 2) {
      return "Selección";
    }

    return "Jugador";
  }

  return "Intro";
}

function getGroupForCountry(country) {
  const groupsByCountry = {
    MEX: "A",
    RSA: "A",
    KOR: "A",
    CZE: "A",
    CAN: "B",
    BIH: "B",
    QAT: "B",
    SUI: "B",
    BRA: "C",
    MAR: "C",
    HAI: "C",
    SCO: "C",
    USA: "D",
    PAR: "D",
    AUS: "D",
    TUR: "D",
    GER: "E",
    CUW: "E",
    CIV: "E",
    ECU: "E",
    NED: "F",
    JPN: "F",
    SWE: "F",
    TUN: "F",
    BEL: "G",
    EGY: "G",
    IRN: "G",
    NZL: "G",
    ESP: "H",
    CPV: "H",
    KSA: "H",
    URU: "H",
    FRA: "I",
    SEN: "I",
    IRQ: "I",
    NOR: "I",
    ARG: "J",
    ALG: "J",
    AUT: "J",
    JOR: "J",
    POR: "K",
    COD: "K",
    UZB: "K",
    COL: "K",
    ENG: "L",
    CRO: "L",
    GHA: "L",
    PAN: "L"
  };

  return groupsByCountry[country] ?? null;
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function getNumberFromCode(stickerCode) {
  const match = stickerCode.match(/\d+$/);
  return match ? Number(match[0]) : 0;
}

function chunk(items, size) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size)
  );
}

function value(input) {
  return String(input ?? "").trim();
}

function nullable(input) {
  const text = value(input);
  return text === "" ? null : text;
}

function number(input, fallback) {
  const parsed = Number(input);
  return Number.isFinite(parsed) ? parsed : fallback;
}
