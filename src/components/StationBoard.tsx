import type { StationBoardData } from "@/lib/entur";
import { groupByOsloDay } from "@/lib/time";
import { DepartureRow } from "./DepartureRow";

type StationBoardProps = {
  station: StationBoardData;
  now: Date;
};

export function StationBoard({ station, now }: StationBoardProps) {
  const sections = groupByOsloDay(station.departures, now);

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <h2 className="mb-1 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl lg:text-4xl">
        {station.name}
      </h2>
      <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-zinc-500 sm:text-base">
        Mot Oslo S
      </p>

      {station.situations.length > 0 ? (
        <div className="mb-3 space-y-2">
          {station.situations.map((situation) => (
            <aside
              key={situation.id}
              className="rounded-lg border border-amber-500/60 bg-amber-950/70 px-3 py-2 text-amber-100"
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-amber-300">
                Avvik
              </p>
              <p className="text-base font-medium sm:text-lg">{situation.summary}</p>
              {situation.description ? (
                <p className="mt-1 text-sm text-amber-100/80">{situation.description}</p>
              ) : null}
            </aside>
          ))}
        </div>
      ) : null}

      {station.departures.length === 0 ? (
        <p className="rounded-lg bg-zinc-900/70 px-4 py-6 text-lg text-zinc-400">
          Ingen tog mot Oslo S det neste døgnet.
        </p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.key} className="flex flex-col gap-2">
              {section.heading ? (
                <h3 className="mt-1 flex items-center gap-3 pt-1">
                  <span className="h-px min-w-4 flex-1 bg-zinc-700" aria-hidden />
                  <span className="text-center">
                    <span className="block text-sm font-semibold uppercase tracking-[0.18em] text-zinc-300 sm:text-base">
                      {section.heading.title}
                    </span>
                    {section.heading.subtitle ? (
                      <span className="mt-0.5 block text-xs text-zinc-500 sm:text-sm">
                        {section.heading.subtitle}
                      </span>
                    ) : null}
                  </span>
                  <span className="h-px min-w-4 flex-1 bg-zinc-700" aria-hidden />
                </h3>
              ) : null}
              <ul className="flex flex-col gap-2">
                {section.items.map((departure) => (
                  <DepartureRow
                    key={`${departure.id}-${departure.aimedTime}`}
                    departure={departure}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
