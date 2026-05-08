import { getChecklistSections } from "../../lib/checklist";
import { WORLD_CUP_GROUPS } from "../../lib/worldCupGroups";
import type { TeamCode } from "../../lib/worldCupGroups";
import type { Filters, StatusFilter } from "../../lib/album";

type FiltersBarProps = {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onResetAlbum: () => void;
};

export function FiltersBar({
  filters,
  onFiltersChange,
  onResetAlbum
}: FiltersBarProps) {
  const checklistSections = getChecklistSections();
  const teamOptions =
    filters.groupId === "Todos"
      ? checklistSections.map((section) => ({
          code: section.id,
          flag: section.stickers[0]?.flag ?? "",
          name: section.title
        }))
      : checklistSections
          .filter((section) =>
            section.stickers.some((sticker) => sticker.group === filters.groupId)
          )
          .map((section) => ({
            code: section.id,
            flag: section.stickers[0]?.flag ?? "",
            name: section.title
          }));

  console.log("[album-debug] filters options", {
    selections: checklistSections.filter((section) =>
      section.stickers.some((sticker) => sticker.categoria === "Equipo")
    ).length,
    groups: new Set(
      checklistSections.flatMap((section) =>
        section.stickers.map((sticker) => sticker.group).filter(Boolean)
      )
    ).size
  });

  return (
    <div className="sticky top-0 z-10 -mx-4 border-y border-yellow-900/10 bg-[#f7f4ea]/90 px-4 py-2.5 shadow-sm shadow-emerald-950/5 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
        <label className="flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-emerald-950/70">
          Buscar
          <input
            className="h-10 rounded border border-yellow-900/15 bg-white px-3 text-base font-bold normal-case tracking-normal shadow-sm outline-none transition focus:border-yellow-500 focus:ring-4 focus:ring-yellow-300/20"
            placeholder="Ej. ARG 1, MEX 20, Ecuador"
            type="search"
            value={filters.query}
            onChange={(event) =>
              onFiltersChange({ ...filters, query: event.target.value })
            }
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-emerald-950/70">
          Grupo
          <select
            className="h-10 rounded border border-yellow-900/15 bg-white px-3 text-base font-bold normal-case tracking-normal shadow-sm outline-none transition focus:border-yellow-500 focus:ring-4 focus:ring-yellow-300/20"
            value={filters.groupId}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                groupId: event.target.value as Filters["groupId"],
                teamCode: "Todos"
              })
            }
          >
            <option value="Todos">Todos</option>
            {WORLD_CUP_GROUPS.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-emerald-950/70">
          Seleccion
          <select
            className="h-10 rounded border border-yellow-900/15 bg-white px-3 text-base font-bold normal-case tracking-normal shadow-sm outline-none transition focus:border-yellow-500 focus:ring-4 focus:ring-yellow-300/20"
            value={filters.teamCode}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                teamCode: event.target.value as "Todos" | TeamCode | "FWC" | "CC" | "00"
              })
            }
          >
            <option value="Todos">Todas</option>
            {teamOptions.map((team) => (
              <option key={team.code} value={team.code}>
                {team.flag} {team.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-emerald-950/70">
          Filtro
          <select
            className="h-10 rounded border border-yellow-900/15 bg-white px-3 text-base font-bold normal-case tracking-normal shadow-sm outline-none transition focus:border-yellow-500 focus:ring-4 focus:ring-yellow-300/20"
            value={filters.status}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                status: event.target.value as StatusFilter
              })
            }
          >
            <option value="Todos">Todos</option>
            <option value="Pegados">Pegados</option>
            <option value="Faltantes">Faltantes</option>
            <option value="Con repetidos">Con repetidos</option>
          </select>
        </label>

        <button
          className="h-10 self-end rounded bg-emerald-950 px-4 font-black text-yellow-100 shadow-lg shadow-emerald-950/15 transition active:scale-[0.98] hover:-translate-y-0.5 hover:bg-black hover:shadow-xl"
          type="button"
          onClick={onResetAlbum}
        >
          Reiniciar album
        </button>
      </div>
    </div>
  );
}
