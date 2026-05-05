import { useMemo, useState } from "react";
import type { ChecklistSticker } from "../../lib/checklist";
import type {
  ExchangeListType,
  ExchangeSuggestion,
  RepeatedStickerSummary
} from "../../lib/album";
import { formatExchangeText, getExchangeSuggestions, USERS } from "../../lib/album";
import { Icon } from "./Icon";

type ExchangePanelProps = {
  missingStickers: ChecklistSticker[];
  repeatedStickers: RepeatedStickerSummary[];
};

const COPY_LABELS: Record<ExchangeListType, string> = {
  all: "Copiar lista para WhatsApp",
  missing: "Copiar solo faltantes",
  repeated: "Copiar solo repetidos"
};

export function ExchangePanel({
  missingStickers,
  repeatedStickers
}: ExchangePanelProps) {
  const [copiedType, setCopiedType] = useState<ExchangeListType | null>(null);
  const suggestions = useMemo(
    () => getExchangeSuggestions(missingStickers, repeatedStickers),
    [missingStickers, repeatedStickers]
  );
  const previewMissing = useMemo(
    () => formatStickerPreview(missingStickers),
    [missingStickers]
  );
  const previewRepeated = useMemo(
    () => formatRepeatedPreview(repeatedStickers),
    [repeatedStickers]
  );
  const selectionSummary = useMemo(
    () => getSelectionSummary(missingStickers, repeatedStickers),
    [missingStickers, repeatedStickers]
  );

  async function copyExchangeList(type: ExchangeListType) {
    const text = formatExchangeText(missingStickers, repeatedStickers, type);

    await navigator.clipboard.writeText(text);
    setCopiedType(type);
    window.setTimeout(() => setCopiedType(null), 1800);
  }

  return (
    <section className="mt-4 overflow-hidden rounded border border-yellow-300/40 bg-[linear-gradient(135deg,#fffdf5_0%,#f4fbf1_100%)] shadow-[0_14px_34px_rgba(12,35,29,.12)]">
      <div className="relative border-b border-yellow-900/10 bg-[radial-gradient(circle_at_12%_0%,rgba(250,204,21,.2),transparent_28%),linear-gradient(135deg,#123b32,#0f2a26)] px-3 py-3 text-white sm:px-4">
        <div className="absolute inset-0 opacity-18 [background-image:linear-gradient(115deg,transparent_0_43%,rgba(255,255,255,.22)_44%,transparent_46%_100%)] [background-size:28px_28px]" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-yellow-100">
              Intercambio familiar
            </p>
            <h2 className="mt-1 text-xl font-black leading-none">
              Intercambios sugeridos
            </h2>
          </div>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded border border-yellow-200/30 bg-yellow-200 px-3 text-sm font-black text-emerald-950 shadow-lg shadow-black/20 transition active:scale-[0.98] hover:-translate-y-0.5 hover:bg-yellow-100"
            type="button"
            onClick={() => copyExchangeList("all")}
          >
            <Icon name="stack" className="h-4 w-4" />
            {copiedType === "all" ? "Copiado" : COPY_LABELS.all}
          </button>
        </div>
      </div>

      <div className="grid gap-3 p-3 lg:grid-cols-[1.2fr_.8fr] lg:p-4">
        <SuggestionsCard suggestions={suggestions} />

        <article className="rounded border border-yellow-900/10 bg-white p-3 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-950/45">
            Resumen por selección
          </p>
          <div className="mt-3 grid max-h-56 gap-1.5 overflow-auto pr-1">
            {selectionSummary.length > 0 ? (
              selectionSummary.slice(0, 16).map((summary) => (
                <div
                  className="flex items-center justify-between gap-2 rounded border border-emerald-950/8 bg-[#fffdf7] px-2 py-1.5 text-xs font-bold text-emerald-950"
                  key={summary.code}
                >
                  <span>{summary.code}</span>
                  <span className="text-emerald-950/55">
                    F {summary.missing} / R {summary.repeated}
                  </span>
                </div>
              ))
            ) : (
              <p className="rounded border border-emerald-950/10 bg-[#fffdf7] p-2 text-sm font-bold text-emerald-950/65">
                Sin selecciones pendientes
              </p>
            )}
          </div>
        </article>
      </div>

      <div className="grid gap-3 border-t border-yellow-900/10 p-3 sm:grid-cols-2 sm:p-4">
        <ExchangeListCard
          accent="missing"
          title="Faltantes del álbum"
          count={missingStickers.length}
          preview={previewMissing}
          buttonLabel={copiedType === "missing" ? "Copiado" : COPY_LABELS.missing}
          onCopy={() => copyExchangeList("missing")}
        />
        <ExchangeListCard
          accent="repeated"
          title="Repetidos disponibles"
          count={repeatedStickers.length}
          preview={previewRepeated}
          buttonLabel={copiedType === "repeated" ? "Copiado" : COPY_LABELS.repeated}
          onCopy={() => copyExchangeList("repeated")}
        />
      </div>
    </section>
  );
}

function SuggestionsCard({ suggestions }: { suggestions: ExchangeSuggestion[] }) {
  return (
    <article className="rounded border border-yellow-900/10 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-950/45">
            Sugerencias útiles
          </p>
          <p className="mt-1 text-2xl font-black leading-none text-emerald-950">
            {suggestions.length}
          </p>
        </div>
        <span className="rounded-full border border-yellow-300 bg-yellow-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-yellow-800">
          Propuestas
        </span>
      </div>

      <div className="mt-3 grid gap-2">
        {suggestions.length > 0 ? (
          suggestions.map((suggestion) => (
            <div
              className="rounded border border-emerald-950/10 bg-[#fffdf7] p-2 text-sm font-bold leading-5 text-emerald-950/75"
              key={`${suggestion.repeated.sticker.id}-${suggestion.missing.id}`}
            >
              Tenemos repetido{" "}
              <span className="font-black text-yellow-700">
                {suggestion.repeated.sticker.codigo}
              </span>{" "}
              y falta{" "}
              <span className="font-black text-rose-700">
                {suggestion.missing.codigo}
              </span>
              <p className="mt-1 text-[11px] font-bold text-emerald-950/45">
                Disponible: {formatOwners(suggestion.repeated)}
              </p>
            </div>
          ))
        ) : (
          <p className="rounded border border-emerald-950/10 bg-[#fffdf7] p-3 text-sm font-bold text-emerald-950/65">
            Aún no hay sugerencias: necesitas al menos un repetido disponible y un
            faltante.
          </p>
        )}
      </div>
    </article>
  );
}

function ExchangeListCard({
  accent,
  title,
  count,
  preview,
  buttonLabel,
  onCopy
}: {
  accent: "missing" | "repeated";
  title: string;
  count: number;
  preview: string;
  buttonLabel: string;
  onCopy: () => void;
}) {
  const accentClasses =
    accent === "missing"
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : "border-yellow-300 bg-yellow-50 text-yellow-800";

  return (
    <article className="relative overflow-hidden rounded border border-yellow-900/10 bg-white p-3 shadow-sm">
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-yellow-200/20" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-950/45">
            {title}
          </p>
          <p className="mt-1 text-3xl font-black leading-none text-emerald-950">
            {count}
          </p>
        </div>
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${accentClasses}`}
        >
          {accent === "missing" ? "Buscar" : "Cambiar"}
        </span>
      </div>

      <p className="relative mt-3 min-h-12 rounded border border-emerald-950/10 bg-[#fffdf7] p-2 text-sm font-bold leading-6 text-emerald-950/75">
        {preview}
      </p>

      <button
        className="relative mt-3 h-10 w-full rounded border border-emerald-950/10 bg-emerald-950 px-3 text-sm font-black text-yellow-100 shadow-lg shadow-emerald-950/10 transition active:scale-[0.98] hover:bg-black"
        type="button"
        onClick={onCopy}
      >
        {buttonLabel}
      </button>
    </article>
  );
}

function formatStickerPreview(stickers: ChecklistSticker[]) {
  if (stickers.length === 0) {
    return "Ninguno";
  }

  return `${stickers
    .slice(0, 18)
    .map((sticker) => sticker.codigo)
    .join(", ")}${stickers.length > 18 ? "..." : ""}`;
}

function formatRepeatedPreview(repeatedStickers: RepeatedStickerSummary[]) {
  if (repeatedStickers.length === 0) {
    return "Ninguno";
  }

  const preview = repeatedStickers
    .slice(0, 14)
    .map((sticker) => `${sticker.sticker.codigo}(x${sticker.quantity})`)
    .join(", ");

  return `${preview}${repeatedStickers.length > 14 ? "..." : ""}`;
}

function formatOwners(summary: RepeatedStickerSummary) {
  const owners = USERS.filter((user) => summary.byUser[user] > 0).map(
    (user) => `${user} x${summary.byUser[user]}`
  );

  return owners.length > 0 ? owners.join(", ") : "Sin editor asignado";
}

function getSelectionSummary(
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

  return selectionCodes.map((code) => ({
    code,
    missing: missingStickers.filter((sticker) => sticker.country === code).length,
    repeated: repeatedStickers
      .filter((summary) => summary.sticker.country === code)
      .reduce((total, summary) => total + summary.quantity, 0)
  }));
}
