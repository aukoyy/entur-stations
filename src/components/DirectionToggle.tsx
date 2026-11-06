import {
  DIRECTION_LABELS,
  DIRECTION_QUERY_PARAM,
  DIRECTION_STORAGE_KEY,
  DIRECTIONS,
  directionSlug,
  parseDirection,
  type Direction,
} from "@/lib/direction";
import { SegmentedToggle } from "./SegmentedToggle";

const OPTIONS = DIRECTIONS.map((direction) => ({
  value: direction,
  label: DIRECTION_LABELS[direction],
}));

type DirectionToggleProps = {
  value: Direction;
  onChange: (direction: Direction) => void;
};

export function persistDirection(direction: Direction) {
  window.localStorage.setItem(DIRECTION_STORAGE_KEY, direction);
  const url = new URL(window.location.href);
  url.searchParams.set(DIRECTION_QUERY_PARAM, directionSlug(direction));
  window.history.replaceState(null, "", url);
}

export function readStoredDirection(): Direction {
  const params = new URLSearchParams(window.location.search);
  if (params.has(DIRECTION_QUERY_PARAM)) {
    return parseDirection(params.get(DIRECTION_QUERY_PARAM));
  }
  return parseDirection(window.localStorage.getItem(DIRECTION_STORAGE_KEY));
}

export function DirectionToggle({ value, onChange }: DirectionToggleProps) {
  return (
    <SegmentedToggle value={value} options={OPTIONS} ariaLabel="Velg retning" onChange={onChange} />
  );
}
