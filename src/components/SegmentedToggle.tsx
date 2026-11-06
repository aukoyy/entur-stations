type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  /** Overrides the default selected colours for this option. */
  activeClassName?: string;
};

type SegmentedToggleProps<T extends string> = {
  value: T;
  options: Array<SegmentedOption<T>>;
  ariaLabel: string;
  onChange: (value: T) => void;
};

export function SegmentedToggle<T extends string>({
  value,
  options,
  ariaLabel,
  onChange,
}: SegmentedToggleProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex rounded-lg bg-toggle-track p-1 ring-1 ring-line"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={[
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:px-4 sm:text-base",
              selected
                ? (option.activeClassName ?? "bg-toggle-active text-toggle-active-fg")
                : "text-muted hover:text-foreground",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
