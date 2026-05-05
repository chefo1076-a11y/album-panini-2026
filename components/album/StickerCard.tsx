import type { StickerData, UserName } from "../../lib/album";
import type { ChecklistSticker } from "../../lib/checklist";
import { Icon } from "./Icon";

type StickerCardProps = {
  checklistSticker: ChecklistSticker;
  editor: UserName;
  sticker: StickerData;
  onTogglePegado: () => void;
  onIncrementRepeated: () => void;
  onDecrementRepeated: () => void;
};

export function StickerCard({
  checklistSticker,
  editor,
  sticker,
  onTogglePegado,
  onIncrementRepeated,
  onDecrementRepeated
}: StickerCardProps) {
  const sectionBadge = checklistSticker.group
    ? `Grupo ${checklistSticker.group}`
    : checklistSticker.country;

  return (
    <article
      className={`group relative overflow-hidden rounded border bg-[#fffdf7] shadow-[0_10px_22px_rgba(12,35,29,.10)] transition duration-200 active:scale-[0.985] hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(12,35,29,.18)] ${
        sticker.pegado
          ? "border-emerald-400/70 ring-1 ring-emerald-300/40"
          : "border-rose-200/80 ring-1 ring-rose-100/70"
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-2 ${
          sticker.pegado
            ? "bg-gradient-to-r from-emerald-300 via-green-400 to-cyan-300"
            : "bg-gradient-to-r from-rose-200 via-pink-300 to-orange-200"
        }`}
      />
      <div className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100 [background:linear-gradient(115deg,transparent_0_34%,rgba(255,255,255,.62)_40%,transparent_48%_100%)]" />
      <div className="absolute inset-x-3 bottom-2 top-3 rounded border border-emerald-950/5 pointer-events-none" />
      <div
        className={`relative border-b p-2.5 ${
          sticker.pegado
            ? "border-emerald-950/10 bg-[radial-gradient(circle_at_22%_14%,rgba(187,247,208,.82),transparent_32%),radial-gradient(circle_at_88%_8%,rgba(253,224,71,.32),transparent_24%),linear-gradient(135deg,#ffffff,#ecfdf5)]"
            : "border-rose-950/10 bg-[radial-gradient(circle_at_22%_14%,rgba(254,205,211,.64),transparent_32%),radial-gradient(circle_at_88%_8%,rgba(253,224,71,.24),transparent_24%),linear-gradient(135deg,#ffffff,#fff7ed)]"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-950/42">
              {sectionBadge}
            </p>
            <h2 className="text-5xl font-black leading-[0.86] text-emerald-950 drop-shadow-sm sm:text-4xl">
              {checklistSticker.label}
            </h2>
            <p className="mt-1 truncate text-xs font-black uppercase tracking-[0.1em] text-emerald-950/62">
              {checklistSticker.section}
            </p>
          </div>

          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] shadow-sm transition ${
              sticker.pegado
                ? "border-emerald-300 bg-emerald-950 text-emerald-50 shadow-emerald-900/20"
                : "border-rose-200 bg-rose-50 text-rose-800 shadow-rose-900/10"
            }`}
          >
            <Icon name={sticker.pegado ? "check" : "missing"} className="h-3 w-3" />
            {sticker.pegado ? "Pegado" : "Faltante"}
          </span>
        </div>
      </div>

      <div className="relative p-2.5">
        <div className="mb-2 flex items-center gap-2 rounded border border-yellow-900/10 bg-white/70 px-2 py-1.5">
          <FlagMark
            alt={checklistSticker.section}
            emoji={checklistSticker.flag}
            src={checklistSticker.flagUrl}
          />
          <div className="min-w-0">
            <p className="truncate text-xs font-black text-emerald-950">
              {checklistSticker.playerName || checklistSticker.section}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-950/45">
              {checklistSticker.group ? `Grupo ${checklistSticker.group}` : checklistSticker.tipo}
            </p>
          </div>
        </div>

        {checklistSticker.description ? (
          <p className="mb-2 line-clamp-3 rounded border border-yellow-900/10 bg-[#fffdf7] px-2 py-1.5 text-xs font-semibold leading-5 text-emerald-950/70">
            {checklistSticker.description}
          </p>
        ) : null}

        <button
          className={`flex h-9 w-full items-center justify-center gap-1.5 rounded border text-xs font-black transition active:scale-[0.98] ${
            sticker.pegado
              ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              : "border-emerald-950 bg-emerald-950 text-yellow-50 shadow-lg shadow-emerald-950/15 hover:bg-black"
          }`}
          type="button"
          onClick={onTogglePegado}
        >
          <Icon name={sticker.pegado ? "missing" : "check"} className="h-3.5 w-3.5" />
          {sticker.pegado ? "Desmarcar pegado" : "Marcar pegado"}
        </button>

        <div className={`mt-2 rounded border p-2 shadow-inner ${
          sticker.repetidos > 0
            ? "border-yellow-300/70 bg-[linear-gradient(135deg,#fffbeb,#ffffff)]"
            : "border-emerald-950/10 bg-gradient-to-br from-slate-50 to-white"
        }`}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-950/45">
                Repetidos
              </p>
              <p
                className={`mt-0.5 text-3xl font-black leading-none transition ${
                  sticker.repetidos > 0
                    ? "text-yellow-600 drop-shadow-[0_1px_0_rgba(255,255,255,.8)]"
                    : "text-emerald-950"
                }`}
              >
                {sticker.repetidos}
              </p>
              <p className="mt-1 text-[10px] font-bold text-emerald-950/45">
                {editor}: {sticker.repetidosPorUsuario[editor]}
              </p>
            </div>

            <div className="flex items-center rounded-full border border-yellow-900/10 bg-white p-0.5 shadow-inner">
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-black text-ink transition active:scale-90 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-35"
                type="button"
                disabled={sticker.repetidos === 0}
                aria-label={`Quitar repetido del cromo ${checklistSticker.id}`}
                onClick={onDecrementRepeated}
              >
                -
              </button>
              <span className="h-5 w-px bg-yellow-900/10" />
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-black text-ink transition active:scale-90 hover:bg-yellow-100 hover:text-yellow-700"
                type="button"
                aria-label={`Agregar repetido al cromo ${checklistSticker.id}`}
                onClick={onIncrementRepeated}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function FlagMark({
  alt,
  emoji,
  src
}: {
  alt: string;
  emoji: string;
  src?: string;
}) {
  if (!src) {
    return <span className="text-lg leading-none">{emoji}</span>;
  }

  return (
    <span className="flex h-7 w-9 shrink-0 items-center justify-center overflow-hidden rounded border border-emerald-950/10 bg-white shadow-sm">
      <img alt={`Bandera de ${alt}`} className="h-full w-full object-cover" src={src} />
    </span>
  );
}
