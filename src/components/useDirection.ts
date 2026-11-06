"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  DIRECTION_QUERY_PARAM,
  directionForPosition,
  parseDirection,
  type Direction,
} from "@/lib/direction";

/** How the current direction was picked. */
export type DirectionSource = "default" | "url" | "location" | "manual";

/** Coming back after this long in the background drops a manual choice and checks the location again. */
const RESET_AFTER_HIDDEN_MS = 30 * 60 * 1000;

const noSubscription = () => () => {};
const readUrlParam = () => new URLSearchParams(window.location.search).get(DIRECTION_QUERY_PARAM);
const noUrlParamOnServer = () => null;

/**
 * Picks the direction, in order of precedence:
 * 1. a tap on the toggle (until the page has been in the background for a while),
 * 2. `?retning=nord|sor` in the URL (pins a kiosk such as the hallway iPad),
 * 3. the device's location: closer to Oslo S than to Kråkstad/Ski means south,
 * 4. north.
 *
 * Nothing is stored, so the app never opens on a direction left over from last time.
 * The position stays in the browser; it is never sent to the server.
 */
export function useDirection() {
  const urlParam = useSyncExternalStore(noSubscription, readUrlParam, noUrlParamOnServer);
  const urlDirection = urlParam ? parseDirection(urlParam) : null;
  const [manual, setManual] = useState<Direction | null>(null);
  const [located, setLocated] = useState<Direction | null>(null);
  const hiddenAt = useRef<number | null>(null);

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        setLocated(directionForPosition({ latitude: coords.latitude, longitude: coords.longitude })),
      // Denied, unavailable or timed out: keep whatever we have (north by default).
      () => {},
      { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 15_000 },
    );
  }, []);

  useEffect(() => {
    if (urlDirection) return;
    locate();

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt.current = Date.now();
        return;
      }
      const away = hiddenAt.current == null ? 0 : Date.now() - hiddenAt.current;
      hiddenAt.current = null;
      if (away >= RESET_AFTER_HIDDEN_MS) {
        setManual(null);
        locate();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [urlDirection, locate]);

  const direction: Direction = manual ?? urlDirection ?? located ?? "north";
  const source: DirectionSource = manual
    ? "manual"
    : urlDirection
      ? "url"
      : located
        ? "location"
        : "default";

  return { direction, source, selectDirection: setManual };
}
