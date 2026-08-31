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

export function formatDepartureTime(iso: string): string {
  return formatClock(new Date(iso));
}

export function formatDurationMinutes(minutes: number): string {
  return `${minutes} min`;
}
