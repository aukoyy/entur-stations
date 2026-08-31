import type { StationBoardData } from "@/lib/entur";
import { DepartureRow } from "./DepartureRow";

type StationBoardProps = {
  station: StationBoardData;
};

export function StationBoard({ station }: StationBoardProps) {
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
          Ingen tog mot Oslo S de neste timene.
        </p>
      ) : (
        <ul className="flex min-h-0 flex-col gap-2 overflow-y-auto">
          {station.departures.map((departure) => (
            <DepartureRow key={departure.id} departure={departure} />
          ))}
        </ul>
      )}
    </section>
  );
}
