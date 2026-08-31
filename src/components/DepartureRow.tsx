import type { CSSProperties } from "react";
import type { Departure } from "@/lib/entur";
import { formatDepartureTime, formatDurationMinutes } from "@/lib/time";

type DepartureRowProps = {
  departure: Departure;
};

function lineBadgeClass(departure: Departure): string {
  if (departure.cancelled) return "bg-red-900/80 text-red-100";
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

export function DepartureRow({ departure }: DepartureRowProps) {
  const delayed = departure.delayMinutes >= 1 && !departure.cancelled;
  const timeClass = departure.cancelled
    ? "text-red-300 line-through"
    : delayed
      ? "text-yellow-300"
      : "text-zinc-50";

  const hasBadges = departure.cancelled || departure.isRailReplacement || delayed;

  return (
    <li
      className={[
        "grid grid-cols-[auto_4.5rem_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-lg border-l-4 px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3",
        departure.cancelled
          ? "border-red-600 bg-red-950/50 ring-1 ring-red-800/70"
          : departure.isRailReplacement
            ? "border-amber-400 bg-amber-950/50 ring-1 ring-amber-600/60"
            : delayed
              ? "bg-yellow-950/30 ring-1 ring-yellow-700/40"
              : "bg-zinc-900/80",
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
            <time className="block text-sm text-zinc-500 line-through tabular-nums">
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
      </div>

      <div className="min-w-0">
        <p
          className={`truncate text-lg font-medium sm:text-xl ${
            departure.cancelled ? "text-red-200 line-through" : "text-zinc-50"
          }`}
        >
          {departure.destination}
        </p>
        {hasBadges ? (
          <div className="mt-0.5 flex flex-wrap gap-1.5 text-xs font-semibold uppercase tracking-wide sm:text-sm">
            {departure.cancelled ? (
              <span className="rounded bg-red-600 px-1.5 py-0.5 text-white">Innstilt</span>
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
          <p key={situation.id} className="mt-1 truncate text-sm text-amber-200">
            {situation.summary}
          </p>
        ))}
      </div>

      <span
        className={`text-right leading-tight ${
          departure.cancelled ? "text-red-300/80" : "text-zinc-300"
        }`}
      >
        {departure.durationToOsloSMinutes != null ? (
          <>
            <span className="block text-[0.7rem] uppercase tracking-wider text-zinc-500">
              Til Oslo S
            </span>
            <span className="text-lg font-semibold tabular-nums sm:text-xl">
              {formatDurationMinutes(departure.durationToOsloSMinutes)}
            </span>
          </>
        ) : (
          <span className="text-zinc-600">—</span>
        )}
      </span>

      <span className="text-right text-sm text-zinc-400 sm:text-base">
        {departure.platform ? (
          <>
            <span className="block text-[0.7rem] uppercase tracking-wider">Spor</span>
            <span className="text-lg font-semibold text-zinc-100 sm:text-xl">
              {departure.platform}
            </span>
          </>
        ) : (
          <span className="text-zinc-600">—</span>
        )}
      </span>
    </li>
  );
}
