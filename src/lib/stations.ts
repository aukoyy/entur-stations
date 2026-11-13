export type StationConfig = {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  /** Typical travel time between the station and Oslo S (same both ways). */
  minutesToOsloS: number;
  position: GeoPosition;
  /** How long it takes to get from home to this station, if you go from there. */
  fromHome?: Travel;
};

export type GeoPosition = { latitude: number; longitude: number };

/** Getting to the station you board at, before the train leaves. */
export type Travel = { minutes: number; mode: "drive" | "walk" };

/** From work to Oslo S, where every southbound train starts. */
export const WORK_TO_OSLO_S: Travel = { minutes: 12, mode: "walk" };

export const STATIONS: StationConfig[] = [
  {
    id: "NSR:StopPlace:60016",
    name: "Kråkstad stasjon",
    shortName: "Kråkstad",
    slug: "krakstad",
    minutesToOsloS: 20,
    fromHome: { minutes: 6, mode: "drive" },
    position: { latitude: 59.683362, longitude: 10.890785 },
  },
  {
    id: "NSR:StopPlace:60944",
    name: "Ski stasjon",
    shortName: "Ski",
    slug: "ski",
    minutesToOsloS: 12,
    fromHome: { minutes: 9, mode: "drive" },
    position: { latitude: 59.718294, longitude: 10.833673 },
  },
];

export const STATION_IDS = STATIONS.map((station) => station.id);

export const OSLO_S_STOP_PLACE_ID = "NSR:StopPlace:59872";
export const OSLO_S_POSITION: GeoPosition = { latitude: 59.910357, longitude: 10.753051 };

export const ENTUR_DEPARTURE_COUNT = 250;
export const LOOKAHEAD_SECONDS = 18 * 60 * 60;
export const POLL_INTERVAL_MS = 30_000;
export const STATION_VIEW_STORAGE_KEY = "entur-stations-view";

export type StationView = "all" | string;

export function parseStationView(value: string | null | undefined): StationView {
  if (!value || value === "all" || value === "begge") return "all";
  const match = STATIONS.find((station) => station.id === value || station.slug === value);
  return match?.id ?? "all";
}

export function stationViewSlug(view: StationView): string {
  if (view === "all") return "begge";
  return STATIONS.find((station) => station.id === view)?.slug ?? "begge";
}

const STATION_BY_ID = new Map(STATIONS.map((station) => [station.id, station]));

export function stationConfig(stopId: string): StationConfig | undefined {
  return STATION_BY_ID.get(stopId);
}

export function pickStationDepartures<T extends { expectedTime: string }>(
  departures: T[],
  now: Date,
): T[] {
  const cutoff = now.getTime() + LOOKAHEAD_SECONDS * 1000;
  return departures.filter((departure) => {
    const time = Date.parse(departure.expectedTime);
    return Number.isFinite(time) && time <= cutoff;
  });
}
