import { getChecklist } from "../../lib/checklist";
import type { StickerData, StickerId } from "../../lib/album";
import { WORLD_CUP_GROUPS } from "../../lib/worldCupGroups";

type GroupsOverviewProps = {
  stickers: Record<StickerId, StickerData>;
};

type GroupProgress = {
  groupId: string;
  total: number;
  pegados: number;
  avance: number;
  countries: {
    code: string;
    name: string;
    flag: string;
    flagUrl?: string;
  }[];
};

export function GroupsOverview({ stickers }: GroupsOverviewProps) {
  const progressByGroup = getProgressByGroup(stickers);
  console.log("[album-debug] groups overview detected", {
    groups: Object.values(progressByGroup).filter((group) => group.total > 0).length,
    selections: Object.values(progressByGroup).reduce(
      (total, group) => total + group.countries.length,
      0
    )
  });

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-2 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded border border-yellow-300/35 bg-[linear-gradient(135deg,#fffdf5,#eef8ed)] shadow-[0_14px_34px_rgba(12,35,29,.10)]">
        <div className="border-b border-yellow-900/10 bg-[linear-gradient(135deg,#123b32,#0f2a26)] px-3 py-3 text-white sm:px-4">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-yellow-100">
            Grupos del Mundial
          </p>
          <h2 className="mt-1 text-xl font-black leading-none">
            Progreso por selecciones
          </h2>
        </div>

        <div className="grid gap-2.5 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {WORLD_CUP_GROUPS.map((group) => {
            const progress = progressByGroup[group.id];

            return (
              <article
                className="rounded border border-yellow-900/10 bg-white p-3 shadow-sm"
                key={group.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-950/45">
                      {group.name}
                    </p>
                    <p className="mt-1 text-2xl font-black leading-none text-emerald-950">
                      {progress.avance}%
                    </p>
                  </div>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-800">
                    {progress.pegados}/{progress.total}
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-950/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-300 via-emerald-400 to-cyan-300 transition-all duration-700"
                    style={{
                      width:
                        progress.avance > 0 ? `max(${progress.avance}%, 8px)` : "0%"
                    }}
                  />
                </div>

                <div className="mt-3 grid gap-1.5">
                  {progress.countries.map((team) => (
                    <div
                      className="flex items-center justify-between gap-2 rounded border border-emerald-950/8 bg-[#fffdf7] px-2 py-1.5"
                      key={team.code}
                    >
                      <span className="min-w-0 truncate text-sm font-bold text-emerald-950">
                        <FlagMark
                          alt={team.name}
                          emoji={team.flag}
                          src={team.flagUrl}
                        />
                        {team.name}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-[0.1em] text-emerald-950/45">
                        {team.code}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
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
    return <span className="mr-1">{emoji}</span>;
  }

  return (
    <span className="mr-2 inline-flex h-4 w-6 translate-y-0.5 overflow-hidden rounded-sm border border-emerald-950/10 bg-white shadow-sm">
      <img alt={`Bandera de ${alt}`} className="h-full w-full object-cover" src={src} />
    </span>
  );
}

function getProgressByGroup(stickers: Record<StickerId, StickerData>) {
  const progress = WORLD_CUP_GROUPS.reduce<Record<string, GroupProgress>>(
    (result, group) => {
      result[group.id] = {
        groupId: group.id,
        total: 0,
        pegados: 0,
        avance: 0,
        countries: []
      };

      return result;
    },
    {}
  );

  for (const checklistSticker of getChecklist()) {
    if (!checklistSticker.group) {
      continue;
    }

    const sticker = stickers[checklistSticker.id];
    const groupProgress = progress[checklistSticker.group];

    groupProgress.total += 1;

    if (!groupProgress.countries.some((country) => country.code === checklistSticker.country)) {
      groupProgress.countries.push({
        code: checklistSticker.country,
        name: checklistSticker.section,
        flag: checklistSticker.flag,
        flagUrl: checklistSticker.flagUrl
      });
    }

    if (sticker?.pegado) {
      groupProgress.pegados += 1;
    }
  }

  for (const groupProgress of Object.values(progress)) {
    groupProgress.avance =
      groupProgress.total > 0
        ? Number(((groupProgress.pegados / groupProgress.total) * 100).toFixed(1))
        : 0;
  }

  return progress;
}
