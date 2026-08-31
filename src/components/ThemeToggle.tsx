import { SegmentedToggle } from "./SegmentedToggle";
import {
  persistTheme,
  readStoredTheme,
  type ThemePreference,
} from "@/lib/theme";

const OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: "auto", label: "Auto" },
  { value: "light", label: "Lys" },
  { value: "dark", label: "Mørk" },
];

type ThemeToggleProps = {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
};

export function ThemeToggle({ value, onChange }: ThemeToggleProps) {
  return (
    <SegmentedToggle
      value={value}
      options={OPTIONS}
      ariaLabel="Velg fargetema"
      onChange={onChange}
    />
  );
}

export { persistTheme, readStoredTheme };
