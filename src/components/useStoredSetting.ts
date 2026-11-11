"use client";

import { useSyncExternalStore } from "react";

const SETTINGS_EVENT = "entur-stations:settings";

/** Call after saving a setting so every useStoredSetting re-reads it. */
export function notifySettingsChanged() {
  window.dispatchEvent(new Event(SETTINGS_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(SETTINGS_EVENT, onChange);
  window.addEventListener("storage", onChange); // changed in another tab
  return () => {
    window.removeEventListener(SETTINGS_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Reads a setting stored in the URL/localStorage. The server (and the first
 * client render) uses `serverValue`; the browser value takes over right after.
 * `read` must return a primitive so React can compare snapshots.
 */
export function useStoredSetting<T extends string>(read: () => T, serverValue: T): T {
  return useSyncExternalStore(subscribe, read, () => serverValue);
}
