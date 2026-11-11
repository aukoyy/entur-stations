import { describe, expect, it } from "vitest";
import { mapStopPlaces } from "./entur";
import { OSLO_S_STOP_PLACE_ID } from "./stations";

type StopPlaces = NonNullable<Parameters<typeof mapStopPlaces>[0]>;
type StopPlace = NonNullable<StopPlaces[number]>;
type Call = NonNullable<StopPlace["estimatedCalls"]>[number];

const KRAKSTAD = "NSR:StopPlace:60016";
const SKI = "NSR:StopPlace:60944";
const OSLO = OSLO_S_STOP_PLACE_ID;
const MYSEN = "NSR:StopPlace:mysen";

const NOW = new Date("2026-11-11T09:30:00+01:00");
const t = (hhmm: string, day = "2026-11-11") => `${day}T${hhmm}:00+01:00`;

type StopOnJourney = {
  id: string;
  arrive?: string;
  depart?: string;
  expectedDepart?: string;
  platform?: string;
  cancelled?: boolean;
};

/** A train's call at `stationId`, with the train's whole dated stop list. */
function callAt(
  stationId: string,
  journey: StopOnJourney[],
  { line = "R22", destination = "Oslo S" }: { line?: string; destination?: string } = {},
): Call {
  const id = `${line}-${journey[0].depart}`;
  const here = journey.find((stop) => stop.id === stationId)!;
  return {
    realtime: true,
    cancellation: here.cancelled ?? false,
    aimedDepartureTime: here.depart,
    expectedDepartureTime: here.expectedDepart ?? here.depart,
    quay: { publicCode: here.platform ?? "1" },
    destinationDisplay: { frontText: destination },
    serviceJourney: {
      id,
      line: { publicCode: line, transportMode: "rail", transportSubmode: null, presentation: null },
    },
    datedServiceJourney: {
      estimatedCalls: journey.map((stop) => ({
        aimedArrivalTime: stop.arrive ?? null,
        expectedArrivalTime: stop.arrive ?? null,
        aimedDepartureTime: stop.depart ?? null,
        expectedDepartureTime: stop.expectedDepart ?? stop.depart ?? null,
        cancellation: stop.cancelled ?? false,
        quay: { publicCode: stop.platform ?? null, stopPlace: { id: stop.id, name: stop.id, parent: null } },
      })),
    },
    situations: [],
  };
}

function boards(calls: Record<string, Call[]>) {
  const stopPlaces: StopPlaces = Object.entries(calls).map(([id, estimatedCalls]) => ({
    id,
    name: id,
    estimatedCalls,
    situations: [],
  }));
  return mapStopPlaces(stopPlaces, NOW);
}

const departuresOf = (list: ReturnType<typeof boards>["north"], stationId: string) =>
  list.find((board) => board.id === stationId)?.departures ?? [];

describe("mapStopPlaces", () => {
  it("puts a train towards Oslo S on the north board, with its arrival at Oslo S", () => {
    const north = callAt(KRAKSTAD, [
      { id: MYSEN, depart: t("09:30") },
      { id: KRAKSTAD, arrive: t("09:59"), depart: t("10:00"), platform: "1" },
      { id: SKI, arrive: t("10:06"), depart: t("10:07") },
      { id: OSLO, arrive: t("10:20") },
    ]);
    const result = boards({ [KRAKSTAD]: [north] });

    expect(departuresOf(result.north, KRAKSTAD)).toMatchObject([
      { line: "R22", aimedTime: t("10:00"), platform: "1", arrivalTime: t("10:20") },
    ]);
    expect(departuresOf(result.south, KRAKSTAD)).toEqual([]);
  });

  it("puts a train from Oslo S on the south board, with Oslo S time and platform", () => {
    const south = callAt(
      KRAKSTAD,
      [
        { id: OSLO, depart: t("11:00"), platform: "16" },
        { id: SKI, arrive: t("11:12"), depart: t("11:13") },
        { id: KRAKSTAD, arrive: t("11:17"), depart: t("11:18"), platform: "2" },
        { id: MYSEN, arrive: t("11:50") },
      ],
      { destination: "Mysen" },
    );
    const result = boards({ [KRAKSTAD]: [south] });

    expect(departuresOf(result.south, KRAKSTAD)).toMatchObject([
      { aimedTime: t("11:00"), platform: "16", arrivalTime: t("11:17"), destination: "Mysen" },
    ]);
    expect(departuresOf(result.north, KRAKSTAD)).toEqual([]);
  });

  it("takes delays and cancellations going south from the Oslo S stop", () => {
    const south = callAt(KRAKSTAD, [
      { id: OSLO, depart: t("12:00"), expectedDepart: t("12:04"), cancelled: true },
      { id: KRAKSTAD, arrive: t("12:17"), depart: t("12:18") },
    ]);
    expect(departuresOf(boards({ [KRAKSTAD]: [south] }).south, KRAKSTAD)).toMatchObject([
      { delayMinutes: 4, cancelled: true, expectedTime: t("12:04") },
    ]);
  });

  it("includes tomorrow's trains (stops are read from the dated journey)", () => {
    const tomorrow = callAt(KRAKSTAD, [
      { id: KRAKSTAD, depart: t("06:24", "2026-11-12") },
      { id: OSLO, arrive: t("06:44", "2026-11-12") },
    ]);
    expect(departuresOf(boards({ [KRAKSTAD]: [tomorrow] }).north, KRAKSTAD)).toMatchObject([
      { aimedTime: t("06:24", "2026-11-12"), arrivalTime: t("06:44", "2026-11-12") },
    ]);
  });

  it("leaves out local L trains", () => {
    const local = callAt(
      SKI,
      [
        { id: SKI, depart: t("10:00") },
        { id: OSLO, arrive: t("10:20") },
      ],
      { line: "L2" },
    );
    expect(departuresOf(boards({ [SKI]: [local] }).north, SKI)).toEqual([]);
  });

  it("drops southbound trains that already left Oslo S, but not ones leaving right now", () => {
    const gone = callAt(SKI, [
      { id: OSLO, depart: t("09:28") },
      { id: SKI, arrive: t("09:40"), depart: t("09:41") },
    ]);
    const leaving = callAt(SKI, [
      { id: OSLO, depart: "2026-11-11T09:29:30+01:00" },
      { id: SKI, arrive: t("09:42"), depart: t("09:43") },
    ]);
    expect(departuresOf(boards({ [SKI]: [gone, leaving] }).south, SKI)).toMatchObject([
      { aimedTime: "2026-11-11T09:29:30+01:00" },
    ]);
  });

  it("sorts southbound trains by their Oslo S departure, not by when they reach the station", () => {
    const slow = callAt(SKI, [
      { id: OSLO, depart: t("11:00") },
      { id: SKI, arrive: t("11:14"), depart: t("11:15") },
    ]);
    const fast = callAt(
      SKI,
      [
        { id: OSLO, depart: t("11:02") },
        { id: SKI, arrive: t("11:10"), depart: t("11:11") },
      ],
      { line: "RE20" },
    );
    const south = departuresOf(boards({ [SKI]: [fast, slow] }).south, SKI);
    expect(south.map((departure) => departure.aimedTime)).toEqual([t("11:00"), t("11:02")]);
  });
});
