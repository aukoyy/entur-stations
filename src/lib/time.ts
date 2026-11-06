const OSLO = "Europe/Oslo";

export function formatClock(date: Date, withSeconds = false): string {
  return new Intl.DateTimeFormat("nb-NO", {
    timeZone: OSLO,
    hour: "2-digit",
    minute: "2-digit",
    second: withSeconds ? "2-digit" : undefined,
    hour12: false,
  }).format(date);
}

/** Hour of day (0–23) in Oslo. */
export function osloHour(date: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: OSLO, hour: "2-digit", hourCycle: "h23" }).format(date),
  );
}

export function formatDepartureTime(iso: string): string {
  return formatClock(new Date(iso));
}

export function formatDurationMinutes(minutes: number): string {
  return `${minutes} min`;
}

export function osloCalendarDate(value: Date | string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: OSLO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(typeof value === "string" ? new Date(value) : value);
}

function addCalendarDays(ymd: string, days: number): string {
  const [year, month, day] = ymd.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

function formatLongOsloDate(ymd: string): string {
  const label = new Intl.DateTimeFormat("nb-NO", {
    timeZone: OSLO,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${ymd}T12:00:00Z`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const NIGHT_GAP_MS = 3 * 60 * 60 * 1000;

export type DayHeading = {
  title: string;
  subtitle: string | null;
};

export function dayHeadingFor(ymd: string, now: Date): DayHeading | null {
  const today = osloCalendarDate(now);
  if (ymd === today) return null;
  const longDate = formatLongOsloDate(ymd);
  if (ymd === addCalendarDays(today, 1)) {
    return { title: "I morgen", subtitle: longDate };
  }
  return { title: longDate, subtitle: null };
}

export type DepartureDaySection<T extends { expectedTime: string }> = {
  key: string;
  ymd: string;
  heading: DayHeading | null;
  items: T[];
};

export function groupByOsloDay<T extends { expectedTime: string }>(
  items: T[],
  now: Date,
): DepartureDaySection<T>[] {
  const sections: DepartureDaySection<T>[] = [];
  let previousTime: number | null = null;

  for (const item of items) {
    const ymd = osloCalendarDate(item.expectedTime);
    const time = Date.parse(item.expectedTime);
    const current = sections[sections.length - 1];
    const newDay = current == null || current.ymd !== ymd;
    const nightGap =
      previousTime != null && time - previousTime >= NIGHT_GAP_MS && !newDay;

    if (newDay) {
      sections.push({
        key: `${ymd}:${sections.length}`,
        ymd,
        heading: dayHeadingFor(ymd, now),
        items: [item],
      });
    } else if (nightGap && current) {
      sections.push({
        key: `${ymd}:morgen:${sections.length}`,
        ymd,
        heading: { title: "Morgen", subtitle: null },
        items: [item],
      });
    } else if (current) {
      current.items.push(item);
    }

    previousTime = time;
  }

  return sections;
}
