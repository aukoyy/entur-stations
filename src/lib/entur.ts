import type { Direction } from "./direction";
import { isLocalLine, presentationForLine } from "./lines";
import {
  ENTUR_DEPARTURE_COUNT,
  LOOKAHEAD_SECONDS,
  OSLO_S_STOP_PLACE_ID,
  pickStationDepartures,
  STATION_IDS,
} from "./stations";

const ENTUR_GRAPHQL_URL = "https://api.entur.io/journey-planner/v3/graphql";
const DEFAULT_CLIENT_NAME = "aukoyy-entur-stations";

const DEPARTURES_QUERY = `
  query Departures($ids: [String!]!, $numberOfDepartures: Int!, $timeRange: Int!) {
    stopPlaces(ids: $ids) {
      id
      name
      estimatedCalls(
        numberOfDepartures: $numberOfDepartures
        timeRange: $timeRange
        arrivalDeparture: departures
        includeCancelledTrips: true
        whiteListedModes: [rail]
      ) {
        realtime
        cancellation
        aimedDepartureTime
        expectedDepartureTime
        quay {
          publicCode
        }
        destinationDisplay {
          frontText
        }
        serviceJourney {
          id
          line {
            publicCode
            transportMode
            transportSubmode
            presentation {
              colour
              textColour
            }
          }
        }
        # Unlike serviceJourney.estimatedCalls, these are dated for the day this
        # train actually runs (serviceJourney's are always dated today).
        datedServiceJourney {
          estimatedCalls {
            aimedArrivalTime
            expectedArrivalTime
            aimedDepartureTime
            expectedDepartureTime
            cancellation
            quay {
              publicCode
              stopPlace {
                id
                name
                parent {
                  id
                  name
                }
              }
            }
          }
        }
        situations {
          situationNumber
          severity
          summary {
            language
            value
          }
          description {
            language
            value
          }
        }
      }
      situations {
        situationNumber
        severity
        summary {
          language
          value
        }
        description {
          language
          value
        }
      }
    }
  }
`;

type LocalizedText = {
  language?: string | null;
  value?: string | null;
};

type EnturSituation = {
  situationNumber?: string | null;
  severity?: string | null;
  summary?: LocalizedText[] | null;
  description?: LocalizedText[] | null;
};

type EnturJourneyCall = {
  aimedArrivalTime?: string | null;
  expectedArrivalTime?: string | null;
  aimedDepartureTime?: string | null;
  expectedDepartureTime?: string | null;
  cancellation?: boolean | null;
  quay?: {
    publicCode?: string | null;
    stopPlace?: {
      id?: string | null;
      name?: string | null;
      parent?: {
        id?: string | null;
        name?: string | null;
      } | null;
    } | null;
  } | null;
};

type EnturEstimatedCall = {
  realtime?: boolean | null;
  cancellation?: boolean | null;
  aimedDepartureTime?: string | null;
  expectedDepartureTime?: string | null;
  quay?: { publicCode?: string | null } | null;
  destinationDisplay?: { frontText?: string | null } | null;
  serviceJourney?: {
    id?: string | null;
    line?: {
      publicCode?: string | null;
      transportMode?: string | null;
      transportSubmode?: string | null;
      presentation?: {
        colour?: string | null;
        textColour?: string | null;
      } | null;
    } | null;
  } | null;
  datedServiceJourney?: {
    estimatedCalls?: EnturJourneyCall[] | null;
  } | null;
  situations?: EnturSituation[] | null;
};

type EnturStopPlace = {
  id: string;
  name: string;
  estimatedCalls?: EnturEstimatedCall[] | null;
  situations?: EnturSituation[] | null;
};

type EnturResponse = {
  data?: { stopPlaces?: Array<EnturStopPlace | null> | null };
  errors?: Array<{ message: string }>;
};

export type Situation = {
  id: string;
  severity: string | null;
  summary: string;
  description: string | null;
};

/**
 * One train on a board. Times and platform are for where you board: the
 * station going north, Oslo S going south.
 */
export type Departure = {
  id: string;
  aimedTime: string;
  expectedTime: string;
  /** Expected arrival where you get off: Oslo S going north, the station going south. */
  arrivalTime: string | null;
  delayMinutes: number;
  cancelled: boolean;
  realtime: boolean;
  destination: string;
  line: string;
  lineColour: string;
  lineTextColour: string;
  transportMode: string;
  transportSubmode: string | null;
  isRailReplacement: boolean;
  platform: string | null;
  situations: Situation[];
};

export type StationBoardData = {
  id: string;
  name: string;
  departures: Departure[];
  situations: Situation[];
};

export type DeparturesPayload = {
  directions: Record<Direction, StationBoardData[]>;
  fetchedAt: string;
};

function pickText(texts: LocalizedText[] | null | undefined): string | null {
  if (!texts?.length) return null;
  const preferred =
    texts.find((text) => text.language === "no" || text.language === "nb") ??
    texts.find((text) => text.language === "en") ??
    texts[0];
  const value = preferred.value?.trim();
  return value ? value : null;
}

function mapSituation(situation: EnturSituation, index: number): Situation | null {
  const summary = pickText(situation.summary);
  const description = pickText(situation.description);
  if (!summary && !description) return null;

  return {
    id: situation.situationNumber ?? `situation-${index}`,
    severity: situation.severity ?? null,
    summary: summary ?? description ?? "",
    description: summary && description && description !== summary ? description : null,
  };
}

function uniqueSituations(situations: EnturSituation[] | null | undefined): Situation[] {
  const mapped = (situations ?? [])
    .map((situation, index) => mapSituation(situation, index))
    .filter((situation): situation is Situation => situation !== null);

  const seen = new Set<string>();
  return mapped.filter((situation) => {
    if (seen.has(situation.id)) return false;
    seen.add(situation.id);
    return true;
  });
}

function delayMinutes(aimed: string, expected: string): number {
  return Math.round((Date.parse(expected) - Date.parse(aimed)) / 60_000);
}

function stopPlaceIds(call: EnturJourneyCall): string[] {
  const stop = call.quay?.stopPlace;
  const ids: string[] = [];
  if (stop?.id) ids.push(stop.id);
  if (stop?.parent?.id) ids.push(stop.parent.id);
  return ids;
}

function isStopPlace(call: EnturJourneyCall, stopId: string): boolean {
  return stopPlaceIds(call).includes(stopId);
}

function findCurrentCallIndex(
  calls: EnturJourneyCall[],
  stopId: string,
  aimedDepartureTime: string,
): number {
  const exact = calls.findIndex(
    (call) => isStopPlace(call, stopId) && call.aimedDepartureTime === aimedDepartureTime,
  );
  if (exact >= 0) return exact;
  return calls.findIndex((call) => isStopPlace(call, stopId));
}

function arrivalTime(call: EnturJourneyCall): string | null {
  return (
    call.expectedArrivalTime ??
    call.aimedArrivalTime ??
    call.expectedDepartureTime ??
    call.aimedDepartureTime ??
    null
  );
}

type Leg = { from: EnturJourneyCall; to: EnturJourneyCall };

/**
 * The part of the journey you ride: station → Oslo S going north,
 * Oslo S → station going south. Null if the train doesn't go that way.
 */
function legFor(
  calls: EnturJourneyCall[] | null | undefined,
  stopId: string,
  aimedDepartureTime: string,
  direction: Direction,
): Leg | null {
  if (!calls?.length) return null;

  const currentIndex = findCurrentCallIndex(calls, stopId, aimedDepartureTime);
  if (currentIndex < 0) return null;
  const current = calls[currentIndex];

  if (direction === "north") {
    const osloCall = calls.slice(currentIndex + 1).find((call) => isStopPlace(call, OSLO_S_STOP_PLACE_ID));
    return osloCall ? { from: current, to: osloCall } : null;
  }

  for (let index = currentIndex - 1; index >= 0; index--) {
    if (isStopPlace(calls[index], OSLO_S_STOP_PLACE_ID)) return { from: calls[index], to: current };
  }
  return null;
}

function isTrainOrReplacement(call: EnturEstimatedCall): boolean {
  const line = call.serviceJourney?.line;
  if (!line) return false;
  if (line.transportMode === "rail") return true;
  return line.transportSubmode === "railReplacementBus";
}

function isRegionalTrainOrReplacement(call: EnturEstimatedCall): boolean {
  if (!isTrainOrReplacement(call)) return false;
  const publicCode = call.serviceJourney?.line?.publicCode ?? "";
  return !isLocalLine(publicCode);
}

function mapDeparture(
  call: EnturEstimatedCall,
  stopId: string,
  index: number,
  direction: Direction,
): Departure | null {
  const stationAimedTime = call.aimedDepartureTime;
  if (!stationAimedTime) return null;

  const leg = legFor(call.datedServiceJourney?.estimatedCalls, stopId, stationAimedTime, direction);
  if (!leg) return null;

  // Going north you board here, so use the call itself. Going south you board at Oslo S.
  const boarding =
    direction === "north"
      ? {
          aimedTime: stationAimedTime,
          expectedTime: call.expectedDepartureTime ?? stationAimedTime,
          cancelled: Boolean(call.cancellation),
          platform: call.quay?.publicCode ?? null,
        }
      : {
          aimedTime: leg.from.aimedDepartureTime ?? null,
          expectedTime: leg.from.expectedDepartureTime ?? leg.from.aimedDepartureTime ?? null,
          cancelled: Boolean(call.cancellation || leg.from.cancellation),
          platform: leg.from.quay?.publicCode ?? null,
        };
  if (!boarding.aimedTime || !boarding.expectedTime) return null;

  const line = call.serviceJourney?.line;
  const transportSubmode = line?.transportSubmode ?? null;
  const publicCode = line?.publicCode ?? "—";
  const colors = presentationForLine(publicCode, line?.presentation);

  return {
    id: call.serviceJourney?.id ?? `${stopId}-${stationAimedTime}-${index}`,
    aimedTime: boarding.aimedTime,
    expectedTime: boarding.expectedTime,
    arrivalTime: arrivalTime(leg.to),
    delayMinutes: delayMinutes(boarding.aimedTime, boarding.expectedTime),
    cancelled: boarding.cancelled,
    realtime: Boolean(call.realtime),
    destination: call.destinationDisplay?.frontText ?? "Ukjent destinasjon",
    line: publicCode,
    lineColour: colors.colour,
    lineTextColour: colors.textColour,
    transportMode: line?.transportMode ?? "unknown",
    transportSubmode,
    isRailReplacement: transportSubmode === "railReplacementBus",
    platform: boarding.platform,
    situations: uniqueSituations(call.situations),
  };
}

/** Trains that already left Oslo S still show up at the station; drop them. */
const ALREADY_LEFT_GRACE_MS = 60_000;

function mapBoards(
  stopPlaces: EnturStopPlace[],
  direction: Direction,
  now: Date,
): StationBoardData[] {
  const boards = stopPlaces.map((stop) => {
    const mapped = (stop.estimatedCalls ?? [])
      .filter(isRegionalTrainOrReplacement)
      .map((call, index) => mapDeparture(call, stop.id, index, direction))
      .filter((departure): departure is Departure => departure !== null)
      .filter((departure) => Date.parse(departure.expectedTime) >= now.getTime() - ALREADY_LEFT_GRACE_MS)
      .sort((a, b) => Date.parse(a.expectedTime) - Date.parse(b.expectedTime));

    return {
      id: stop.id,
      name: stop.name,
      departures: pickStationDepartures(mapped, now),
      situations: uniqueSituations(stop.situations),
    };
  });

  return boards.sort((a, b) => STATION_IDS.indexOf(a.id) - STATION_IDS.indexOf(b.id));
}

export function mapStopPlaces(
  stopPlaces: Array<EnturStopPlace | null> | null | undefined,
  now = new Date(),
): Record<Direction, StationBoardData[]> {
  const stops = (stopPlaces ?? []).filter((stop): stop is EnturStopPlace => stop !== null);
  return {
    north: mapBoards(stops, "north", now),
    south: mapBoards(stops, "south", now),
  };
}

export async function fetchDepartures(): Promise<DeparturesPayload> {
  const clientName = process.env.ENTUR_CLIENT_NAME ?? DEFAULT_CLIENT_NAME;

  const response = await fetch(ENTUR_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ET-Client-Name": clientName,
    },
    body: JSON.stringify({
      query: DEPARTURES_QUERY,
      variables: {
        ids: STATION_IDS,
        numberOfDepartures: ENTUR_DEPARTURE_COUNT,
        timeRange: LOOKAHEAD_SECONDS,
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Entur svarte med ${response.status}`);
  }

  const payload = (await response.json()) as EnturResponse;
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  return {
    directions: mapStopPlaces(payload.data?.stopPlaces),
    fetchedAt: new Date().toISOString(),
  };
}
