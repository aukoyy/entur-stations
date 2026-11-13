import type { CSSProperties } from "react";
import type { DepartureStatus } from "@/lib/departure-status";
import type { Departure } from "@/lib/entur";
import { formatDepartureTime } from "@/lib/time";

type DepartureRowProps = {
  departure: Departure;
  status?: DepartureStatus;
  /** Going south, show when the train gets to Kråkstad/Ski. */
  showArrival?: boolean;
};

function lineBadgeClass(departure: Departure): string {
  if (departure.cancelled) return "bg-red-700 text-white dark:bg-red-900/80 dark:text-red-100";
  if (departure.isRailReplacement) return "bg-amber-500 text-zinc-950";
  return "";
}

function lineBadgeStyle(departure: Departure): CSSProperties | undefined {
  if (departure.cancelled || departure.isRailReplacement) return undefined;
  return {
    backgroundColor: departure.lineColour,
    color: departure.lineTextColour,
  };
}

export function DepartureRow({ departure, status, showArrival = false }: DepartureRowProps) {
  const delayed = departure.delayMinutes >= 1 && !departure.cancelled;
  const timeClass = departure.cancelled
    ? "text-red-700 line-through dark:text-red-300"
    : delayed
      ? "text-amber-700 dark:text-yellow-300"
      : "text-foreground";

  const leaveHint = status?.leaveHint ?? null;
  const hasBadges = departure.cancelled || departure.isRailReplacement || delayed || leaveHint != null;

  return (
    <li
      className={[
        "grid grid-cols-[auto_4.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border-l-4 px-3 py-2.5 transition-opacity sm:gap-4 sm:px-4 sm:py-3",
        // Too late to get to the station, but the train hasn't left yet.
        status?.missed ? "opacity-40" : "",
        departure.cancelled
          ? "border-red-600 bg-red-50 ring-1 ring-red-200 dark:bg-red-950/40 dark:ring-red-800/60"
          : departure.isRailReplacement
            ? "border-amber-400 bg-amber-50 ring-1 ring-amber-300 dark:bg-amber-950/40 dark:ring-amber-600/50"
            : delayed
              ? "bg-amber-50 ring-1 ring-amber-200 dark:bg-yellow-900/20 dark:ring-yellow-700/35"
              : "bg-surface",
      ].join(" ")}
      style={
        departure.cancelled || departure.isRailReplacement
          ? undefined
          : { borderLeftColor: departure.lineColour }
      }
    >
      <span
        className={`inline-flex min-w-12 items-center justify-center rounded-md px-2 py-1 text-lg font-bold tabular-nums sm:min-w-14 sm:text-xl ${lineBadgeClass(departure)}`}
        style={lineBadgeStyle(departure)}
      >
        {departure.line}
      </span>

      <div className="leading-tight">
        {delayed ? (
          <>
            <time className="block text-sm text-subtle line-through tabular-nums">
              {formatDepartureTime(departure.aimedTime)}
            </time>
            <time className={`block text-xl font-semibold tabular-nums sm:text-2xl ${timeClass}`}>
              {formatDepartureTime(departure.expectedTime)}
            </time>
          </>
        ) : (
          <time className={`block text-xl font-semibold tabular-nums sm:text-2xl ${timeClass}`}>
            {formatDepartureTime(departure.expectedTime)}
          </time>
        )}
        {status?.countdown && !departure.cancelled ? (
          <span className="block text-xs font-medium tabular-nums text-muted sm:text-sm">
            {status.countdown}
          </span>
        ) : null}
      </div>

      <div className="min-w-0">
        <p
          className={`truncate text-lg font-medium sm:text-xl ${
            departure.cancelled ? "text-red-800 line-through dark:text-red-200" : "text-foreground"
          }`}
        >
          {departure.destination}
        </p>
        {showArrival && departure.arrivalTime ? (
          <p className="text-sm text-muted tabular-nums sm:text-base">
            Ankomst {formatDepartureTime(departure.arrivalTime)}
          </p>
        ) : null}
        {hasBadges ? (
          <div className="mt-0.5 flex flex-wrap gap-1.5 text-xs font-semibold uppercase tracking-wide sm:text-sm">
            {leaveHint ? (
              <span className="whitespace-nowrap rounded bg-emerald-600 px-1.5 py-0.5 text-white dark:bg-emerald-500 dark:text-zinc-950">
                {leaveHint}
              </span>
            ) : null}
            {departure.cancelled ? (
              <span className="whitespace-nowrap rounded bg-red-600 px-1.5 py-0.5 text-white">
                {departure.cancelledFrom ? `Innstilt fra ${departure.cancelledFrom}` : "Innstilt"}
              </span>
            ) : null}
            {departure.isRailReplacement ? (
              <span className="rounded bg-amber-400 px-1.5 py-0.5 text-zinc-950">
                Buss for tog
              </span>
            ) : null}
            {delayed ? (
              <span className="rounded bg-yellow-400 px-1.5 py-0.5 text-zinc-950">
                Forsinket +{departure.delayMinutes} min
              </span>
            ) : null}
          </div>
        ) : null}
        {departure.situations.map((situation) => (
          <p key={situation.id} className="mt-1 truncate text-sm text-amber-800 dark:text-amber-200">
            {situation.summary}
          </p>
        ))}
      </div>

      <span className="text-right text-sm text-muted sm:text-base">
        {departure.platform ? (
          <>
            <span className="block text-[0.7rem] uppercase tracking-wider">Spor</span>
            <span className="text-lg font-semibold text-foreground sm:text-xl">
              {departure.platform}
            </span>
          </>
        ) : (
          <span className="text-subtle">—</span>
        )}
      </span>
    </li>
  );
}
