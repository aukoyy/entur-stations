export type StationConfig = {
  id: string;
  name: string;
};

export const STATIONS: StationConfig[] = [
  { id: "NSR:StopPlace:60944", name: "Ski stasjon" },
  { id: "NSR:StopPlace:60016", name: "Kråkstad stasjon" },
];

export const STATION_IDS = STATIONS.map((station) => station.id);

export const OSLO_S_STOP_PLACE_ID = "NSR:StopPlace:59872";

export const DEPARTURES_PER_STATION = 8;
export const POLL_INTERVAL_MS = 30_000;
