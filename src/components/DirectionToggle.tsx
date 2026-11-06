import { DIRECTION_LABELS, DIRECTIONS, type Direction } from "@/lib/direction";
import { SegmentedToggle } from "./SegmentedToggle";

const OPTIONS = DIRECTIONS.map((direction) => ({
  value: direction,
  label: DIRECTION_LABELS[direction],
  // Sør gets the south accent colour, matching the band and headings.
  activeClassName: direction === "south" ? "bg-south text-south-fg" : undefined,
}));

type DirectionToggleProps = {
  value: Direction;
  onChange: (direction: Direction) => void;
};

export function DirectionToggle({ value, onChange }: DirectionToggleProps) {
  return (
    <SegmentedToggle value={value} options={OPTIONS} ariaLabel="Velg retning" onChange={onChange} />
  );
}
