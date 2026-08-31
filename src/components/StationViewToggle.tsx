import {
  parseStationView,
  STATIONS,
  STATION_VIEW_STORAGE_KEY,
  stationViewSlug,
  type StationView,
} from "@/lib/stations";

const OPTIONS: Array<{ view: StationView; label: string }> = [
  { view: STATIONS[0].id, label: STATIONS[0].shortName },
  { view: "all", label: "Begge" },
  { view: STATIONS[1].id, label: STATIONS[1].shortName },
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
    <div
      role="radiogroup"
      aria-label="Velg stasjon"
      className="inline-flex rounded-lg bg-zinc-900 p-1 ring-1 ring-zinc-800"
    >
      {OPTIONS.map((option) => {
        const selected = option.view === value;
        return (
          <button
            key={option.view}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.view)}
            className={[
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:px-4 sm:text-base",
              selected
                ? "bg-zinc-100 text-zinc-950"
                : "text-zinc-400 hover:text-zinc-100",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
