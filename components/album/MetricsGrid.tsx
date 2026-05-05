import type { AlbumStats } from "../../lib/album";
import { Icon } from "./Icon";
import type { IconName } from "./types";

const METRICS: Array<{
  icon: IconName;
  label: string;
  getValue: (stats: AlbumStats) => number | string;
}> = [
  { icon: "grid", label: "Total cromos", getValue: (stats) => stats.total },
  { icon: "check", label: "Pegados", getValue: (stats) => stats.pegados },
  { icon: "missing", label: "Faltantes", getValue: (stats) => stats.faltantes },
  {
    icon: "stack",
    label: "Con repetidos",
    getValue: (stats) => stats.cromosConRepetidos
  },
  {
    icon: "plus",
    label: "Total repetidos",
    getValue: (stats) => stats.totalRepetidos
  },
  { icon: "progress", label: "Avance", getValue: (stats) => `${stats.avance}%` }
];

export function MetricsGrid({ stats }: { stats: AlbumStats }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
        {METRICS.map((metric) => (
          <MetricCard
            key={metric.label}
            icon={metric.icon}
            label={metric.label}
            value={metric.getValue(stats)}
          />
        ))}
      </div>
    </section>
  );
}

function MetricCard({
  icon,
  label,
  value
}: {
  icon: IconName;
  label: string;
  value: number | string;
}) {
  return (
    <div className="group relative overflow-hidden rounded border border-white/70 bg-[linear-gradient(145deg,#ffffff_0%,#f8f4e7_100%)] px-3 py-2.5 shadow-[0_10px_24px_rgba(12,35,29,.10)] transition duration-200 active:scale-[0.99] hover:-translate-y-0.5 hover:border-yellow-300/60 hover:shadow-[0_16px_32px_rgba(12,35,29,.16)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-yellow-300 via-emerald-400 to-cyan-300 opacity-80" />
      <div className="absolute -right-8 -top-8 h-16 w-16 rounded-full bg-yellow-200/20 transition group-hover:bg-yellow-200/35" />
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.13em] text-emerald-950/48">
            {label}
          </p>
          <p className="mt-1 text-xl font-black leading-none text-emerald-950">
            {value}
          </p>
        </div>
        <div className="relative rounded bg-emerald-950 p-1.5 text-yellow-100 ring-1 ring-yellow-200/30 transition group-hover:bg-emerald-800">
          <Icon name={icon} className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
