import type { Filters, UserName } from "../../lib/album";
import { FiltersBar } from "./FiltersBar";

type AlbumToolbarProps = {
  editor: UserName;
  filters: Filters;
  visibleCount: number;
  onFiltersChange: (filters: Filters) => void;
  onResetAlbum: () => void;
};

export function AlbumToolbar({
  editor,
  filters,
  visibleCount,
  onFiltersChange,
  onResetAlbum
}: AlbumToolbarProps) {
  return (
    <>
      <FiltersBar
        filters={filters}
        onFiltersChange={onFiltersChange}
        onResetAlbum={onResetAlbum}
      />

      <div className="mt-4 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="font-bold text-emerald-950">
          {visibleCount} cromos del album familiar
        </p>
        <p className="font-medium text-black/55">Registrando cambios como {editor}</p>
      </div>
    </>
  );
}
