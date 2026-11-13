"use client";

import { useCallback, useEffect, useState } from "react";
import { isStale } from "@/lib/departure-status";
import type { DeparturesPayload } from "@/lib/entur";
import { LINE_LEGEND } from "@/lib/lines";
import { POLL_INTERVAL_MS, STATIONS, type StationView } from "@/lib/stations";
import { formatClock } from "@/lib/time";
import { StationBoard } from "./StationBoard";
import {
  persistStationView,
  readStoredStationView,
  StationViewToggle,
} from "./StationViewToggle";
import { persistTheme, readStoredTheme, ThemeToggle } from "./ThemeToggle";
import { isDarkHour, setDarkClass, type ThemePreference } from "@/lib/theme";
import { useStoredSetting } from "./useStoredSetting";
import { DirectionToggle } from "./DirectionToggle";
import { useDirection } from "./useDirection";

type LoadState = {
  /** The last departures we got; kept on screen when a later update fails. */
  data: DeparturesPayload | null;
  /** Device time of the last successful update, for the out-of-date warning. */
  receivedAt: number | null;
  error: string | null;
};

async function fetchDeparturesPayload(): Promise<DeparturesPayload> {
  const response = await fetch("/api/departures", { cache: "no-store" });
  const payload = (await response.json()) as DeparturesPayload & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? `HTTP ${response.status}`);
  }
  return payload;
}

export function Infoscreen() {
  const [now, setNow] = useState<Date | null>(null);
  const [state, setState] = useState<LoadState>({ data: null, receivedAt: null, error: null });
  const view = useStoredSetting<StationView>(readStoredStationView, "all");
  const theme = useStoredSetting<ThemePreference>(readStoredTheme, "auto");
  const { direction, source: directionSource, selectDirection } = useDirection();

  const load = useCallback(
    () =>
      fetchDeparturesPayload().then(
        (data) => setState({ data, receivedAt: Date.now(), error: null }),
        (error: unknown) =>
          setState((previous) => ({
            ...previous,
            error: error instanceof Error ? error.message : "Ukjent feil",
          })),
      ),
    [],
  );

  const selectView = useCallback((next: StationView) => {
    persistStationView(next);
  }, []);

  const selectTheme = useCallback((next: ThemePreference) => {
    persistTheme(next);
  }, []);

  const autoDark = now ? isDarkHour(now) : null;
  useEffect(() => {
    if (theme !== "auto" || autoDark === null) return;
    setDarkClass(autoDark);
  }, [theme, autoDark]);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const clock = window.setInterval(tick, 1000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    void load();
    const poll = window.setInterval(() => {
      void load();
    }, POLL_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void load();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [load]);

  const data = state.data;
  const stale = now != null && isStale(state.receivedAt, now);
  const visibleStations = data?.directions[direction].filter(
    (station) => view === "all" || station.id === view,
  );
  const visibleConfigs =
    view === "all" ? STATIONS : STATIONS.filter((station) => station.id === view);
  const multiColumn = (visibleStations?.length ?? visibleConfigs.length) !== 1;
  const south = direction === "south";

  return (
    <div
      className={[
        "flex min-h-full flex-1 flex-col border-t-8 bg-background px-4 py-4 text-foreground sm:px-6 sm:py-5 lg:px-8",
        // The coloured band at the top is the quickest tell that you're looking south.
        south ? "border-south" : "border-transparent",
      ].join(" ")}
    >
      <header className="mb-4 flex flex-col-reverse gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
            Avgangstavle
          </p>
          <time className="block font-semibold tabular-nums text-4xl sm:text-5xl lg:text-6xl">
            {now ? formatClock(now) : "--:--"}
          </time>
          {directionSource === "location" ? (
            <p className="mt-1 text-xs text-subtle sm:text-sm">Retning valgt ut fra hvor du er</p>
          ) : null}
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-muted sm:text-sm">
            {LINE_LEGEND.map((item) => (
              <li key={item.label} className="inline-flex items-center gap-1.5">
                <span
                  className="size-3 rounded-sm"
                  style={{ backgroundColor: item.colour }}
                  aria-hidden
                />
                {item.label}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col items-start gap-2 text-sm text-muted sm:items-end sm:text-right">
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <DirectionToggle value={direction} onChange={selectDirection} />
            <StationViewToggle value={view} onChange={selectView} />
            <ThemeToggle value={theme} onChange={selectTheme} />
          </div>
          <div>
            {state.error ? (
              <p className="font-medium text-red-600 dark:text-red-400">Kunne ikke hente avganger</p>
            ) : data ? (
              <p title="Oppdateres hvert 30. sekund">
                Oppdatert {formatClock(new Date(data.fetchedAt), true)}
              </p>
            ) : (
              <p>Henter avganger…</p>
            )}
            {state.error ? (
              <p className="mt-1 max-w-xs text-xs text-red-600/80 dark:text-red-300/80">{state.error}</p>
            ) : null}
          </div>
        </div>
      </header>

      {stale && data ? (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-red-600 px-4 py-3 text-base font-semibold text-white sm:text-lg"
        >
          Utdatert: sist oppdatert {formatClock(new Date(data.fetchedAt))}. Avgangene kan ha endret seg.
        </p>
      ) : null}

      {data && visibleStations ? (
        <div
          className={[
            "grid min-h-0 flex-1 grid-cols-1 gap-8 lg:gap-10",
            multiColumn ? "two-col:grid-cols-2" : "",
          ].join(" ")}
        >
          {visibleStations.map((station) => (
            <StationBoard
              key={station.id}
              station={station}
              direction={direction}
              now={now ?? new Date(data.fetchedAt)}
            />
          ))}
        </div>
      ) : state.error ? (
        <p className="rounded-lg bg-red-50 px-4 py-6 text-lg text-red-800 dark:bg-red-950/40 dark:text-red-200">
          {state.error}
        </p>
      ) : (
        <div
          className={[
            "grid flex-1 grid-cols-1 gap-8",
            multiColumn ? "two-col:grid-cols-2" : "",
          ].join(" ")}
        >
          {visibleConfigs.map((station) => (
            <section key={station.id} className="animate-pulse">
              <div className="mb-3 h-9 w-56 rounded bg-surface" />
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-16 rounded-lg bg-surface" />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
