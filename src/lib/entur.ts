import { presentationForLine } from "./lines";
import { DEPARTURES_PER_STATION, OSLO_S_STOP_PLACE_ID, STATION_IDS } from "./stations";

const ENTUR_GRAPHQL_URL = "https://api.entur.io/journey-planner/v3/graphql";
const DEFAULT_CLIENT_NAME = "aukoyy-entur-stations";

const DEPARTURES_QUERY = `
  query Departures($ids: [String!]!) {
    stopPlaces(ids: $ids) {
      id
      name
      estimatedCalls(
        numberOfDepartures: 80
        timeRange: 28800
        arrivalDeparture: departures
        includeCancelledTrips: true
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
          estimatedCalls {
            aimedArrivalTime
            expectedArrivalTime
            aimedDepartureTime
            expectedDepartureTime
            quay {
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
  quay?: {
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

export type Departure = {
  id: string;
  aimedTime: string;
  expectedTime: string;
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
  terminatesAtOsloS: boolean;
  durationToOsloSMinutes: number | null;
  situations: Situation[];
};

export type StationBoardData = {
  id: string;
  name: string;
  departures: Departure[];
  situations: Situation[];
};

export type DeparturesPayload = {
  stations: StationBoardData[];
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

function osloSLeg(
  calls: EnturJourneyCall[] | null | undefined,
  stopId: string,
  aimedTime: string,
  expectedTime: string,
): { terminatesAtOsloS: boolean; durationToOsloSMinutes: number | null } | null {
  if (!calls?.length) return null;

  const currentIndex = findCurrentCallIndex(calls, stopId, aimedTime);
  if (currentIndex < 0) return null;

  const later = calls.slice(currentIndex + 1);
  const osloCall = later.find((call) => isStopPlace(call, OSLO_S_STOP_PLACE_ID));
  if (!osloCall) return null;

  const lastCall = calls[calls.length - 1];
  const osloArrival = arrivalTime(osloCall);
  const durationToOsloSMinutes =
    osloArrival == null
      ? null
      : Math.max(0, Math.round((Date.parse(osloArrival) - Date.parse(expectedTime)) / 60_000));

  return {
    terminatesAtOsloS: lastCall != null && isStopPlace(lastCall, OSLO_S_STOP_PLACE_ID),
    durationToOsloSMinutes,
  };
}

function isTrainOrReplacement(call: EnturEstimatedCall): boolean {
  const line = call.serviceJourney?.line;
  if (!line) return false;
  if (line.transportMode === "rail") return true;
  return line.transportSubmode === "railReplacementBus";
}

function mapDeparture(call: EnturEstimatedCall, stopId: string, index: number): Departure | null {
  const aimedTime = call.aimedDepartureTime;
  if (!aimedTime) return null;

  const expectedTime = call.expectedDepartureTime ?? aimedTime;
  const leg = osloSLeg(call.serviceJourney?.estimatedCalls, stopId, aimedTime, expectedTime);
  if (!leg) return null;

  const line = call.serviceJourney?.line;
  const transportSubmode = line?.transportSubmode ?? null;
  const publicCode = line?.publicCode ?? "—";
  const colors = presentationForLine(publicCode, line?.presentation);

  return {
    id: call.serviceJourney?.id ?? `${stopId}-${aimedTime}-${index}`,
    aimedTime,
    expectedTime,
    delayMinutes: delayMinutes(aimedTime, expectedTime),
    cancelled: Boolean(call.cancellation),
    realtime: Boolean(call.realtime),
    destination: call.destinationDisplay?.frontText ?? "Ukjent destinasjon",
    line: publicCode,
    lineColour: colors.colour,
    lineTextColour: colors.textColour,
    transportMode: line?.transportMode ?? "unknown",
    transportSubmode,
    isRailReplacement: transportSubmode === "railReplacementBus",
    platform: call.quay?.publicCode ?? null,
    terminatesAtOsloS: leg.terminatesAtOsloS,
    durationToOsloSMinutes: leg.durationToOsloSMinutes,
    situations: uniqueSituations(call.situations),
  };
}

export function mapStopPlaces(stopPlaces: Array<EnturStopPlace | null> | null | undefined): StationBoardData[] {
  return (stopPlaces ?? [])
    .filter((stop): stop is EnturStopPlace => stop !== null)
    .map((stop) => ({
      id: stop.id,
      name: stop.name,
      departures: (stop.estimatedCalls ?? [])
        .filter(isTrainOrReplacement)
        .map((call, index) => mapDeparture(call, stop.id, index))
        .filter((departure): departure is Departure => departure !== null)
        .slice(0, DEPARTURES_PER_STATION),
      situations: uniqueSituations(stop.situations),
    }));
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
      variables: { ids: STATION_IDS },
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
    stations: mapStopPlaces(payload.data?.stopPlaces),
    fetchedAt: new Date().toISOString(),
  };
}
