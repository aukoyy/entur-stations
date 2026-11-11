import {
  persistTheme as saveTheme,
  readStoredTheme,
  type ThemePreference,
} from "@/lib/theme";
import { notifySettingsChanged } from "./useStoredSetting";

function persistTheme(preference: ThemePreference) {
  saveTheme(preference);
  notifySettingsChanged();
}

const CYCLE: ThemePreference[] = ["auto", "light", "dark"];

const LABELS: Record<ThemePreference, string> = {
  auto: "Auto",
  light: "Lys",
  dark: "Mørk",
};

function ThemeIcon({ value }: { value: ThemePreference }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "size-5",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (value === "light") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    );
  }
  if (value === "dark") {
    return (
      <svg {...common}>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    );
  }
  // Auto: half-filled circle (follows the device's light/dark setting).
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none" />
    </svg>
  );
}

type ThemeToggleProps = {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
};

/** One small button that cycles Auto → Lys → Mørk; the icon shows the current theme. */
export function ThemeToggle({ value, onChange }: ThemeToggleProps) {
  const next = CYCLE[(CYCLE.indexOf(value) + 1) % CYCLE.length];
  const label = `Tema: ${LABELS[value]}. Trykk for ${LABELS[next]}.`;
  return (
    <button
      type="button"
      onClick={() => onChange(next)}
      aria-label={label}
      title={label}
      className="inline-flex size-10 items-center justify-center rounded-lg bg-toggle-track text-muted ring-1 ring-line transition-colors hover:text-foreground"
    >
      <ThemeIcon value={value} />
    </button>
  );
}

export { persistTheme, readStoredTheme };
