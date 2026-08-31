import { osloCalendarDate, osloHour } from "./time";

export type StationConfig = {
  id: string;
  name: string;
  maxToday: number;
  maxNextDay: number;
  maxTotal: number;
};

export const STATIONS: StationConfig[] = [
  {
    id: "NSR:StopPlace:60944",
    name: "Ski stasjon",
    maxToday: 10,
    maxNextDay: 6,
    maxTotal: 16,
  },
  {
    id: "NSR:StopPlace:60016",
    name: "Kråkstad stasjon",
    maxToday: 14,
    maxNextDay: 12,
    maxTotal: 14,
  },
];

export const STATION_IDS = STATIONS.map((station) => station.id);

export const OSLO_S_STOP_PLACE_ID = "NSR:StopPlace:59872";

export const ENTUR_DEPARTURE_COUNT = 120;
export const LOOKAHEAD_SECONDS = 72_000;
export const NEXT_DAY_AFTER_HOUR = 18;
export const POLL_INTERVAL_MS = 30_000;

const STATION_BY_ID = new Map(STATIONS.map((station) => [station.id, station]));

export function stationConfig(stopId: string): StationConfig | undefined {
  return STATION_BY_ID.get(stopId);
}

export function pickStationDepartures<T extends { expectedTime: string }>(
  departures: T[],
  config: Pick<StationConfig, "maxToday" | "maxNextDay" | "maxTotal">,
  now: Date,
): T[] {
  const today = osloCalendarDate(now);
  const todayDepartures: T[] = [];
  const laterDepartures: T[] = [];

  for (const departure of departures) {
    if (osloCalendarDate(departure.expectedTime) === today) {
      todayDepartures.push(departure);
    } else {
      laterDepartures.push(departure);
    }
  }

  const todayShown = todayDepartures.slice(0, config.maxToday);
  const includeLater =
    laterDepartures.length > 0 &&
    (todayDepartures.length <= config.maxToday || osloHour(now) >= NEXT_DAY_AFTER_HOUR);

  if (!includeLater) return todayShown;

  const remaining = Math.max(0, config.maxTotal - todayShown.length);
  const laterShown = laterDepartures.slice(0, Math.min(config.maxNextDay, remaining));
  return [...todayShown, ...laterShown];
}
