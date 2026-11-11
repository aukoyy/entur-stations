import { describe, expect, it } from "vitest";
import {
  countdownText,
  departureStatuses,
  isStale,
  STALE_AFTER_MS,
  upcomingDepartures,
} from "./departure-status";

const NOW = new Date("2026-11-11T10:00:00+01:00");
const MINUTE = 60_000;

/** A departure leaving `minutes` from NOW. */
function at(minutes: number, cancelled = false) {
  return { expectedTime: new Date(NOW.getTime() + minutes * MINUTE).toISOString(), cancelled };
}

describe("upcomingDepartures", () => {
  it("keeps a train until a minute after it was due, then drops it", () => {
    const departures = [at(-2), at(-0.5), at(0), at(5)];
    expect(upcomingDepartures(departures, NOW)).toEqual([at(-0.5), at(0), at(5)]);
  });
});

describe("countdownText", () => {
  it("says nå under a minute, whole minutes after that, nothing from an hour", () => {
    expect(countdownText(-30_000)).toBe("nå");
    expect(countdownText(59_000)).toBe("nå");
    expect(countdownText(7.9 * MINUTE)).toBe("om 7 min");
    expect(countdownText(59.9 * MINUTE)).toBe("om 59 min");
    expect(countdownText(60 * MINUTE)).toBeNull();
  });
});

describe("departureStatuses", () => {
  const drive4 = { minutes: 4, mode: "drive" } as const;
  const walk12 = { minutes: 12, mode: "walk" } as const;

  it("fades trains you can't reach and hints on the first one you can", () => {
    const statuses = departureStatuses([at(2), at(3.9), at(10), at(20)], NOW, drive4);
    expect(statuses.map((status) => status.missed)).toEqual([true, true, false, false]);
    expect(statuses.map((status) => status.leaveHint)).toEqual([null, null, "Kjør om 6'", null]);
    expect(statuses.map((status) => status.countdown)).toEqual(["om 2 min", "om 3 min", "om 10 min", "om 20 min"]);
  });

  it("says Gå nå when it's time to leave", () => {
    expect(departureStatuses([at(12.5)], NOW, walk12)[0].leaveHint).toBe("Gå nå");
  });

  it("skips cancelled trains for the hint and never fades them", () => {
    const statuses = departureStatuses([at(2, true), at(15, true), at(30)], NOW, walk12);
    expect(statuses.map((status) => status.missed)).toEqual([false, false, false]);
    expect(statuses.map((status) => status.leaveHint)).toEqual([null, null, "Gå om 18'"]);
  });

  it("gives no hint when the next train you can make is an hour or more away", () => {
    const statuses = departureStatuses([at(2), at(90)], NOW, drive4);
    expect(statuses.map((status) => status.leaveHint)).toEqual([null, null]);
    expect(statuses[1].missed).toBe(false);
  });

  it("without a travel time, only counts down", () => {
    const statuses = departureStatuses([at(1), at(30)], NOW, null);
    expect(statuses).toEqual([
      { countdown: "om 1 min", missed: false, leaveHint: null },
      { countdown: "om 30 min", missed: false, leaveHint: null },
    ]);
  });
});

describe("isStale", () => {
  it("is stale only after a while without updates", () => {
    expect(isStale(null, NOW)).toBe(false);
    expect(isStale(NOW.getTime() - STALE_AFTER_MS, NOW)).toBe(false);
    expect(isStale(NOW.getTime() - STALE_AFTER_MS - 1, NOW)).toBe(true);
  });
});
