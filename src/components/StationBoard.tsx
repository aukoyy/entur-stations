import { emptyBoardText, osloTripLabel, stationHeading, type Direction } from "@/lib/direction";
import type { StationBoardData } from "@/lib/entur";
import { stationConfig } from "@/lib/stations";
import { formatDurationMinutes, groupByOsloDay } from "@/lib/time";
import { DepartureRow } from "./DepartureRow";

type StationBoardProps = {
  station: StationBoardData;
  direction: Direction;
  now: Date;
};

export function StationBoard({ station, direction, now }: StationBoardProps) {
  const sections = groupByOsloDay(station.departures, now);
  const config = stationConfig(station.id);
  const minutesToOsloS = config?.minutesToOsloS;
  const shortName = config?.shortName ?? station.name;

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
          {stationHeading(direction, shortName)}
        </h2>
        {minutesToOsloS != null ? (
          <p className="flex items-baseline gap-2 text-muted">
            <span className="text-xl font-semibold tabular-nums text-foreground sm:text-2xl lg:text-3xl">
              {formatDurationMinutes(minutesToOsloS)}
            </span>
            <span className="text-sm font-medium uppercase tracking-[0.18em] text-subtle">
              {osloTripLabel(direction)}
            </span>
          </p>
        ) : (
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-subtle sm:text-base">
            {osloTripLabel(direction)}
          </p>
        )}
      </div>

      {station.situations.length > 0 ? (
        <div className="mb-3 space-y-2">
          {station.situations.map((situation) => (
            <aside
              key={situation.id}
              className="rounded-lg border border-amber-400/80 bg-amber-50 px-3 py-2 text-amber-950 dark:border-amber-500/50 dark:bg-amber-950/50 dark:text-amber-100"
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                Avvik
              </p>
              <p className="text-base font-medium sm:text-lg">{situation.summary}</p>
              {situation.description ? (
                <p className="mt-1 text-sm text-amber-900/70 dark:text-amber-100/80">{situation.description}</p>
              ) : null}
            </aside>
          ))}
        </div>
      ) : null}

      {station.departures.length === 0 ? (
        <p className="rounded-lg bg-surface px-4 py-6 text-lg text-muted">
          {emptyBoardText(direction, shortName)}
        </p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.key} className="flex flex-col gap-2">
              {section.heading ? (
                <h3 className="mt-1 flex items-center gap-3 pt-1">
                  <span className="h-px min-w-4 flex-1 bg-line" aria-hidden />
                  <span className="text-center">
                    <span className="block text-sm font-semibold uppercase tracking-[0.18em] text-muted sm:text-base">
                      {section.heading.title}
                    </span>
                    {section.heading.subtitle ? (
                      <span className="mt-0.5 block text-xs text-subtle sm:text-sm">
                        {section.heading.subtitle}
                      </span>
                    ) : null}
                  </span>
                  <span className="h-px min-w-4 flex-1 bg-line" aria-hidden />
                </h3>
              ) : null}
              <ul className="flex flex-col gap-2">
                {section.items.map((departure) => (
                  <DepartureRow
                    key={`${departure.id}-${departure.aimedTime}`}
                    departure={departure}
                    showArrival={direction === "south"}
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
