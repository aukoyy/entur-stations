"use client";

import { useCallback, useEffect, useState } from "react";
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
import { applyTheme, type ThemePreference } from "@/lib/theme";
import { DirectionToggle } from "./DirectionToggle";
import { useDirection } from "./useDirection";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: DeparturesPayload }
  | { status: "error"; message: string; data: DeparturesPayload | null };

export function Infoscreen() {
  const [now, setNow] = useState<Date | null>(null);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [view, setView] = useState<StationView>("all");
  const { direction, source: directionSource, selectDirection } = useDirection();
  const [theme, setTheme] = useState<ThemePreference>("auto");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/departures", { cache: "no-store" });
      const payload = (await response.json()) as DeparturesPayload & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? `HTTP ${response.status}`);
      }
      setState({ status: "ready", data: payload });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ukjent feil";
      setState((previous) => ({
        status: "error",
        message,
        data: previous.status === "ready" ? previous.data : previous.status === "error" ? previous.data : null,
      }));
    }
  }, []);

  useEffect(() => {
    setView(readStoredStationView());
    const storedTheme = readStoredTheme();
    setTheme(storedTheme);
    applyTheme(storedTheme);
  }, []);

  const selectView = useCallback((next: StationView) => {
    setView(next);
    persistStationView(next);
  }, []);

  const selectTheme = useCallback((next: ThemePreference) => {
    setTheme(next);
    persistTheme(next);
  }, []);

  useEffect(() => {
    if (theme !== "auto") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("auto");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

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

  const data = state.status === "ready" ? state.data : state.status === "error" ? state.data : null;
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
      <header className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
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
            {state.status === "error" ? (
              <p className="font-medium text-red-600 dark:text-red-400">Kunne ikke hente avganger</p>
            ) : data ? (
              <p title="Oppdateres hvert 30. sekund">
                Oppdatert {formatClock(new Date(data.fetchedAt), true)}
              </p>
            ) : (
              <p>Henter avganger…</p>
            )}
            {state.status === "error" ? (
              <p className="mt-1 max-w-xs text-xs text-red-600/80 dark:text-red-300/80">{state.message}</p>
            ) : null}
          </div>
        </div>
      </header>

      {data && visibleStations ? (
        <div
          className={[
            "grid min-h-0 flex-1 grid-cols-1 gap-8 lg:gap-10",
            multiColumn ? "lg:grid-cols-2" : "",
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
      ) : state.status === "error" ? (
        <p className="rounded-lg bg-red-50 px-4 py-6 text-lg text-red-800 dark:bg-red-950/40 dark:text-red-200">
          {state.message}
        </p>
      ) : (
        <div
          className={[
            "grid flex-1 grid-cols-1 gap-8",
            multiColumn ? "lg:grid-cols-2" : "",
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
