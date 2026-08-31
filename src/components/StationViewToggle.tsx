import {
  parseStationView,
  STATIONS,
  STATION_VIEW_STORAGE_KEY,
  stationViewSlug,
  type StationView,
} from "@/lib/stations";
import { SegmentedToggle } from "./SegmentedToggle";

const OPTIONS: Array<{ value: StationView; label: string }> = [
  { value: "all", label: "Begge" },
  { value: STATIONS[0].id, label: STATIONS[0].shortName },
  { value: STATIONS[1].id, label: STATIONS[1].shortName },
];

type StationViewToggleProps = {
  value: StationView;
  onChange: (view: StationView) => void;
};

export function persistStationView(view: StationView) {
  window.localStorage.setItem(STATION_VIEW_STORAGE_KEY, view);
  const url = new URL(window.location.href);
  url.searchParams.set("stasjon", stationViewSlug(view));
  window.history.replaceState(null, "", url);
}

export function readStoredStationView(): StationView {
  const params = new URLSearchParams(window.location.search);
  if (params.has("stasjon")) {
    return parseStationView(params.get("stasjon"));
  }
  return parseStationView(window.localStorage.getItem(STATION_VIEW_STORAGE_KEY));
}

export function StationViewToggle({ value, onChange }: StationViewToggleProps) {
  return (
    <SegmentedToggle
      value={value}
      options={OPTIONS}
      ariaLabel="Velg stasjon"
      onChange={onChange}
    />
  );
}
