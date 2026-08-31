"use client";

import { useCallback, useEffect, useState } from "react";
import type { DeparturesPayload } from "@/lib/entur";
import { LINE_LEGEND } from "@/lib/lines";
import { POLL_INTERVAL_MS } from "@/lib/stations";
import { formatClock } from "@/lib/time";
import { StationBoard } from "./StationBoard";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: DeparturesPayload }
  | { status: "error"; message: string; data: DeparturesPayload | null };

export function Infoscreen() {
  const [now, setNow] = useState<Date | null>(null);
  const [state, setState] = useState<LoadState>({ status: "loading" });

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

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-950 px-4 py-4 text-zinc-100 sm:px-6 sm:py-5 lg:px-8">
      <header className="mb-4 flex items-end justify-between gap-4 sm:mb-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            Avgangstavle
          </p>
          <time className="block font-semibold tabular-nums text-4xl sm:text-5xl lg:text-6xl">
            {now ? formatClock(now) : "--:--"}
          </time>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-zinc-400 sm:text-sm">
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
        <div className="text-right text-sm text-zinc-400 sm:text-base">
          {state.status === "error" ? (
            <p className="font-medium text-red-400">Kunne ikke hente avganger</p>
          ) : data ? (
            <p>
              Oppdatert {formatClock(new Date(data.fetchedAt), true)}
            </p>
          ) : (
            <p>Henter avganger…</p>
          )}
          {state.status === "error" ? (
            <p className="mt-1 max-w-xs text-xs text-red-300/80">{state.message}</p>
          ) : (
            <p className="mt-1 text-xs text-zinc-600">Oppdateres hvert 30. sekund</p>
          )}
        </div>
      </header>

      {data ? (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
          {data.stations.map((station) => (
            <StationBoard
              key={station.id}
              station={station}
              now={now ?? new Date(data.fetchedAt)}
            />
          ))}
        </div>
      ) : state.status === "error" ? (
        <p className="rounded-lg bg-red-950/40 px-4 py-6 text-lg text-red-200">
          {state.message}
        </p>
      ) : (
        <div className="grid flex-1 grid-cols-1 gap-8 lg:grid-cols-2">
          {["Ski stasjon", "Kråkstad stasjon"].map((name) => (
            <section key={name} className="animate-pulse">
              <div className="mb-3 h-9 w-56 rounded bg-zinc-800" />
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-16 rounded-lg bg-zinc-900" />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
