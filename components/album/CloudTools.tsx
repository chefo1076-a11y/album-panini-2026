import type { ChangeEvent } from "react";
import type { MigrationSummary } from "../../lib/cloudAlbum";

type CloudToolsProps = {
  cloudEnabled: boolean;
  status: string | null;
  syncStatus: string;
  isBusy: boolean;
  onMigrateLocal: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
};

export function CloudTools({
  cloudEnabled,
  status,
  syncStatus,
  isBusy,
  onMigrateLocal,
  onExportBackup,
  onImportBackup
}: CloudToolsProps) {
  function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      onImportBackup(file);
      event.target.value = "";
    }
  }

  return (
    <section className="mt-4 overflow-hidden rounded border border-yellow-300/40 bg-white/85 shadow-[0_12px_28px_rgba(12,35,29,.10)]">
      <div className="border-b border-yellow-900/10 bg-[#fffdf7] px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-950/45">
              Herramientas
            </p>
            <h2 className="mt-1 text-lg font-black text-emerald-950">
              Nube y respaldos
            </h2>
          </div>

          <span className="rounded-full border border-emerald-950/10 bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-950">
            {syncStatus}
          </span>
        </div>

        <p className="mt-1 text-sm font-bold text-emerald-950/60">
          {cloudEnabled
            ? "Supabase configurado. Los cambios se guardan en la nube."
            : "Supabase no esta configurado. La app usa localStorage como respaldo."}
        </p>
      </div>

      <div className="grid gap-2.5 p-3 sm:grid-cols-3 sm:p-4">
        <button
          className="h-10 rounded border border-emerald-950/10 bg-emerald-950 px-3 text-sm font-black text-yellow-100 shadow-lg shadow-emerald-950/10 transition active:scale-[0.98] hover:bg-black disabled:cursor-not-allowed disabled:opacity-45"
          type="button"
          disabled={isBusy || !cloudEnabled}
          onClick={onMigrateLocal}
        >
          Migrar progreso local a nube
        </button>

        <button
          className="h-10 rounded border border-emerald-950/10 bg-white px-3 text-sm font-black text-emerald-950 shadow-sm transition active:scale-[0.98] hover:bg-yellow-50"
          type="button"
          disabled={isBusy}
          onClick={onExportBackup}
        >
          Exportar respaldo JSON
        </button>

        <label className="flex h-10 cursor-pointer items-center justify-center rounded border border-emerald-950/10 bg-white px-3 text-sm font-black text-emerald-950 shadow-sm transition hover:bg-yellow-50">
          Importar respaldo JSON
          <input
            className="hidden"
            type="file"
            accept="application/json,.json"
            disabled={isBusy}
            onChange={handleImport}
          />
        </label>
      </div>

      {status ? (
        <p className="border-t border-yellow-900/10 px-3 py-2 text-sm font-bold text-emerald-950/70 sm:px-4">
          {status}
        </p>
      ) : null}
    </section>
  );
}

export function formatMigrationSummary(summary: MigrationSummary) {
  return `${summary.migrated} cromos migrados, ${summary.pegados} pegados, ${summary.repetidos} repetidos.`;
}
