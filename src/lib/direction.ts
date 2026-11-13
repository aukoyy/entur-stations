import {
  OSLO_S_POSITION,
  stationConfig,
  STATIONS,
  WORK_TO_OSLO_S,
  type GeoPosition,
  type Travel,
} from "./stations";

/**
 * Travel direction. North: from Kråkstad/Ski to Oslo S (the default).
 * South: from Oslo S to Kråkstad/Ski.
 */
export type Direction = "north" | "south";

export const DIRECTIONS: Direction[] = ["north", "south"];
export const DIRECTION_QUERY_PARAM = "retning";

export const DIRECTION_LABELS: Record<Direction, string> = {
  north: "Nord",
  south: "Sør",
};

export function parseDirection(value: string | null | undefined): Direction {
  if (value === "south" || value === "sor" || value === "sør") return "south";
  return "north";
}

export function directionSlug(direction: Direction): string {
  return direction === "south" ? "sor" : "nord";
}

/**
 * Time to get to where you board: from home to the station going north (if
 * configured), from work to Oslo S going south. Null means no leave hints.
 */
export function travelToBoarding(direction: Direction, stationId: string): Travel | null {
  if (direction === "south") return WORK_TO_OSLO_S;
  return stationConfig(stationId)?.fromHome ?? null;
}

/** Distance in km. An equirectangular approximation is plenty at this scale. */
function distanceKm(a: GeoPosition, b: GeoPosition): number {
  const toRadians = Math.PI / 180;
  const x = (b.longitude - a.longitude) * toRadians * Math.cos(((a.latitude + b.latitude) / 2) * toRadians);
  const y = (b.latitude - a.latitude) * toRadians;
  return Math.sqrt(x * x + y * y) * 6371;
}

/**
 * Closer to Oslo S than to Kråkstad/Ski means you're heading home (south);
 * otherwise you're heading to Oslo (north).
 */
export function directionForPosition(position: GeoPosition): Direction {
  const toOslo = distanceKm(position, OSLO_S_POSITION);
  const toHome = Math.min(...STATIONS.map((station) => distanceKm(position, station.position)));
  return toOslo < toHome ? "south" : "north";
}

/** "Fra Kråkstad" (north) / "Til Kråkstad" (south). */
export function stationHeading(direction: Direction, stationShortName: string): string {
  return `${direction === "south" ? "Til" : "Fra"} ${stationShortName}`;
}

/** Shown after the travel time: "20 min til Oslo S" / "20 min fra Oslo S". */
export function osloTripLabel(direction: Direction): string {
  return direction === "south" ? "fra Oslo S" : "til Oslo S";
}

export function emptyBoardText(direction: Direction, stationShortName: string): string {
  return direction === "south"
    ? `Ingen tog fra Oslo S til ${stationShortName} de neste 18 timene.`
    : "Ingen tog mot Oslo S de neste 18 timene.";
}
