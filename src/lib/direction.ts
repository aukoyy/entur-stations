/**
 * Travel direction. North: from Kråkstad/Ski to Oslo S (the default).
 * South: from Oslo S to Kråkstad/Ski.
 */
export type Direction = "north" | "south";

export const DIRECTIONS: Direction[] = ["north", "south"];
export const DIRECTION_QUERY_PARAM = "retning";
export const DIRECTION_STORAGE_KEY = "entur-stations-direction";

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
    ? `Ingen tog fra Oslo S til ${stationShortName} det neste døgnet.`
    : "Ingen tog mot Oslo S det neste døgnet.";
}
