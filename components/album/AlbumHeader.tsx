import type { AlbumStats, UserName } from "../../lib/album";
import { USERS } from "../../lib/album";

type AlbumHeaderProps = {
  editor: UserName;
  stats: AlbumStats;
  onEditorChange: (editor: UserName) => void;
};

export function AlbumHeader({ editor, stats, onEditorChange }: AlbumHeaderProps) {
  const progressWidth = stats.avance > 0 ? `max(${stats.avance}%, 10px)` : "0%";

  return (
    <section className="relative overflow-hidden border-b border-yellow-300/25 bg-[radial-gradient(circle_at_12%_10%,rgba(250,204,21,0.34),transparent_22%),radial-gradient(circle_at_85%_8%,rgba(45,212,191,0.26),transparent_20%),linear-gradient(135deg,#071e1a_0%,#0e5e45_48%,#16122f_100%)] text-white shadow-2xl shadow-emerald-950/30">
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(115deg,transparent_0_43%,rgba(255,255,255,.22)_44%,transparent_46%_100%),linear-gradient(65deg,transparent_0_47%,rgba(255,255,255,.16)_48%,transparent_50%_100%)] [background-size:30px_30px]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-yellow-200/70 to-transparent" />
      <div className="absolute -right-14 -top-20 h-48 w-48 rounded-full border border-yellow-200/20 shadow-[inset_0_0_60px_rgba(250,204,21,.12)]" />
      <div className="absolute -bottom-20 left-8 h-40 w-40 rounded-full border border-cyan-200/15 shadow-[inset_0_0_50px_rgba(45,212,191,.12)]" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
              <p className="inline-flex rounded-full border border-yellow-200/35 bg-yellow-200/12 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-yellow-100 shadow-sm backdrop-blur">
                Mundial 2026
              </p>
              <h1 className="mt-3 text-3xl font-black leading-none tracking-normal text-white drop-shadow-sm sm:text-4xl">
                Album Panini familiar
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-emerald-50/80 sm:text-base">
                Tu companion familiar para perseguir, pegar e intercambiar cromos del Mundial.
              </p>
            </div>

          <label className="flex min-w-56 flex-col gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-yellow-100">
            Registrando como
            <select
              className="h-11 rounded border border-yellow-200/30 bg-white px-3 text-base font-black normal-case tracking-normal text-ink shadow-xl shadow-black/20 outline-none transition focus:border-yellow-200 focus:ring-4 focus:ring-yellow-200/25"
              value={editor}
              onChange={(event) => onEditorChange(event.target.value as UserName)}
            >
              {USERS.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded border border-white/15 bg-white/10 p-3 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-yellow-100/95">
                  Progreso del album
                </p>
                <p className="mt-0.5 text-xs font-semibold text-emerald-50/72 sm:text-sm">
                  {stats.pegados} de {stats.total} cromos pegados
                </p>
              </div>
            <p className="text-2xl font-black text-yellow-100 sm:text-3xl">{stats.avance}%</p>
          </div>
          <div className="mt-3 h-4 overflow-hidden rounded-full bg-black/30 p-0.5 ring-1 ring-yellow-100/15">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#fde047_0%,#34d399_42%,#22d3ee_100%)] shadow-[0_0_24px_rgba(253,224,71,.42),0_0_18px_rgba(45,212,191,.45)] transition-all duration-700 ease-out after:block after:h-full after:rounded-full after:bg-[linear-gradient(115deg,rgba(255,255,255,.58),transparent_38%,rgba(255,255,255,.36)_68%,transparent)]"
              style={{ width: progressWidth }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
