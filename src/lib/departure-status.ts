import type { Travel } from "./stations";

/*
 * Rules for what a departure row shows right now. The /tavle page has an ES5
 * copy of these in src/lib/tavle/client.ts (old iPads can't run this code);
 * keep the two in sync. The constants are passed to it from render.ts.
 */

/** A train stays on the board until this long after its expected departure. */
export const DEPARTED_AFTER_MS = 60_000;

/** Countdowns and leave hints are only shown within this many minutes. */
export const COUNTDOWN_WITHIN_MINUTES = 60;

/** With no successful update for this long, the board is marked as out of date. */
export const STALE_AFTER_MS = 5 * 60_000;

export const TRAVEL_VERBS: Record<Travel["mode"], string> = {
  drive: "Kjør",
  walk: "Gå",
};

export type DepartureStatus = {
  /** "om 7 min", "nå", or null when the train is an hour or more away. */
  countdown: string | null;
  /** Too late to get to the station, but the train hasn't left yet: shown faded. */
  missed: boolean;
  /** "Kjør om 2'" / "Gå nå" on the first train you can still make (' = minutes, keeps it short). */
  leaveHint: string | null;
};

type TimedDeparture = { expectedTime: string; cancelled: boolean };

export function hasDeparted(expectedTime: string, now: Date): boolean {
  return now.getTime() > Date.parse(expectedTime) + DEPARTED_AFTER_MS;
}

/** Drops trains that have left. Trains you can't make any more stay (faded). */
export function upcomingDepartures<T extends { expectedTime: string }>(departures: T[], now: Date): T[] {
  return departures.filter((departure) => !hasDeparted(departure.expectedTime, now));
}

function wholeMinutes(ms: number): number {
  return Math.floor(ms / 60_000);
}

export function countdownText(msUntil: number): string | null {
  const minutes = wholeMinutes(msUntil);
  if (minutes >= COUNTDOWN_WITHIN_MINUTES) return null;
  return minutes < 1 ? "nå" : `om ${minutes} min`;
}

export function departureStatuses(
  departures: TimedDeparture[],
  now: Date,
  travel: Travel | null,
): DepartureStatus[] {
  const travelMs = travel ? travel.minutes * 60_000 : 0;
  let hintGiven = false;

  return departures.map((departure) => {
    const msUntil = Date.parse(departure.expectedTime) - now.getTime();
    const missed = travel != null && !departure.cancelled && msUntil < travelMs;

    let leaveHint: string | null = null;
    if (travel && !hintGiven && !departure.cancelled && !missed) {
      hintGiven = true;
      const leaveIn = wholeMinutes(msUntil - travelMs);
      if (leaveIn < COUNTDOWN_WITHIN_MINUTES) {
        const verb = TRAVEL_VERBS[travel.mode];
        leaveHint = leaveIn < 1 ? `${verb} nå` : `${verb} om ${leaveIn}'`;
      }
    }

    return { countdown: countdownText(msUntil), missed, leaveHint };
  });
}

export function isStale(lastUpdateMs: number | null, now: Date): boolean {
  return lastUpdateMs != null && now.getTime() - lastUpdateMs > STALE_AFTER_MS;
}
