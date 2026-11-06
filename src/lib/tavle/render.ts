import type { Departure, DeparturesPayload, Situation, StationBoardData } from "@/lib/entur";
import { LINE_LEGEND } from "@/lib/lines";
import {
  parseStationView,
  POLL_INTERVAL_MS,
  STATIONS,
  stationConfig,
  stationViewSlug,
  type StationView,
} from "@/lib/stations";
import { parseThemePreference, THEME_QUERY_PARAM, themeSlug, type ThemePreference } from "@/lib/theme";
import {
  formatClock,
  formatDepartureTime,
  formatDurationMinutes,
  groupByOsloDay,
  osloHour,
} from "@/lib/time";
import { TAVLE_CLIENT_SCRIPT } from "./client";
import { TAVLE_CSS } from "./styles";

export const TAVLE_PATH = "/tavle";
const STATION_QUERY_PARAM = "stasjon";

/** With tema=auto the board goes dark from DARK_FROM_HOUR until DARK_UNTIL_HOUR (Oslo time). */
const DARK_FROM_HOUR = 21;
const DARK_UNTIL_HOUR = 6;

const FULL_RELOAD_MS = 6 * 60 * 60 * 1000;

export type TavleOptions = {
  view: StationView;
  theme: ThemePreference;
};

export type TavleParts = {
  theme: "light" | "dark";
  status: string;
  boards: string;
  boardsClass: string;
};

export function parseTavleOptions(params: URLSearchParams): TavleOptions {
  return {
    view: parseStationView(params.get(STATION_QUERY_PARAM)),
    theme: parseThemePreference(params.get(THEME_QUERY_PARAM)),
  };
}

export function resolveTavleTheme(preference: ThemePreference, now: Date): "light" | "dark" {
  if (preference !== "auto") return preference;
  const hour = osloHour(now);
  return hour >= DARK_FROM_HOUR || hour < DARK_UNTIL_HOUR ? "dark" : "light";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function tavleHref(view: StationView, theme: ThemePreference, extra = ""): string {
  return `${TAVLE_PATH}?${STATION_QUERY_PARAM}=${stationViewSlug(view)}&${THEME_QUERY_PARAM}=${themeSlug(theme)}${extra}`;
}

function renderDeparture(departure: Departure): string {
  const delayed = departure.delayMinutes >= 1 && !departure.cancelled;
  const rowClass = departure.cancelled
    ? "dep is-cancelled"
    : departure.isRailReplacement
      ? "dep is-replacement"
      : delayed
        ? "dep is-delayed"
        : "dep";
  const rowStyle =
    departure.cancelled || departure.isRailReplacement
      ? ""
      : ` style="border-left-color:${escapeHtml(departure.lineColour)}"`;

  const badgeClass = departure.cancelled
    ? "badge cancelled"
    : departure.isRailReplacement
      ? "badge replacement"
      : "badge";
  const badgeStyle =
    departure.cancelled || departure.isRailReplacement
      ? ""
      : ` style="background:${escapeHtml(departure.lineColour)};color:${escapeHtml(departure.lineTextColour)}"`;

  const nowClass = departure.cancelled ? "now cancelled" : delayed ? "now late" : "now";
  const time = `${
    delayed ? `<span class="was">${formatDepartureTime(departure.aimedTime)}</span>` : ""
  }<span class="${nowClass}">${formatDepartureTime(departure.expectedTime)}</span>`;

  const tags = [
    departure.cancelled ? '<span class="tag cancelled">Innstilt</span>' : "",
    departure.isRailReplacement ? '<span class="tag replacement">Buss for tog</span>' : "",
    delayed ? `<span class="tag delayed">Forsinket +${departure.delayMinutes} min</span>` : "",
  ].join("");

  const notes = departure.situations
    .map((situation) => `<p class="note">${escapeHtml(situation.summary)}</p>`)
    .join("");

  const platform = departure.platform
    ? `<small>Spor</small><strong>${escapeHtml(departure.platform)}</strong>`
    : "—";

  return `<li class="${rowClass}"${rowStyle}>
<span class="${badgeClass}"${badgeStyle}>${escapeHtml(departure.line)}</span>
<div class="time">${time}</div>
<div class="info"><p class="dest${departure.cancelled ? " cancelled" : ""}">${escapeHtml(departure.destination)}</p>${
    tags ? `<div class="tags">${tags}</div>` : ""
  }${notes}</div>
<span class="platform">${platform}</span>
</li>`;
}

function renderSituation(situation: Situation): string {
  return `<aside class="avvik"><p class="label">Avvik</p><p class="summary">${escapeHtml(situation.summary)}</p>${
    situation.description ? `<p class="description">${escapeHtml(situation.description)}</p>` : ""
  }</aside>`;
}

function renderStation(station: StationBoardData, now: Date): string {
  const minutesToOsloS = stationConfig(station.id)?.minutesToOsloS;
  const trip =
    minutesToOsloS != null
      ? `<p class="trip"><strong>${formatDurationMinutes(minutesToOsloS)}</strong><span>til Oslo S</span></p>`
      : '<p class="trip"><span>Mot Oslo S</span></p>';

  const departures = station.departures;
  const list =
    departures.length === 0
      ? '<p class="empty">Ingen tog mot Oslo S det neste døgnet.</p>'
      : groupByOsloDay(departures, now)
          .map((section) => {
            const heading = section.heading
              ? `<div class="day"><span class="rule"></span><span class="label"><span class="title">${escapeHtml(
                  section.heading.title,
                )}</span>${
                  section.heading.subtitle
                    ? `<span class="sub">${escapeHtml(section.heading.subtitle)}</span>`
                    : ""
                }</span><span class="rule"></span></div>`
              : "";
            return `${heading}<ul class="deps">${section.items.map(renderDeparture).join("")}</ul>`;
          })
          .join("");

  return `<section class="board">
<div class="board-head"><h2>${escapeHtml(station.name)}</h2>${trip}</div>
${station.situations.map(renderSituation).join("")}
<div class="list">${list}</div>
</section>`;
}

function renderStatus(fetchedAt: string | null, error: string | null): string {
  if (error) {
    return `<p class="error">Kunne ikke hente avganger</p><p class="small">${escapeHtml(error)}</p>`;
  }
  return `<p>Oppdatert ${fetchedAt ? formatClock(new Date(fetchedAt), true) : "—"}</p><p class="small">Oppdateres hvert 30. sekund</p>`;
}

function visibleStations(payload: DeparturesPayload, view: StationView): StationBoardData[] {
  return payload.stations.filter((station) => view === "all" || station.id === view);
}

function boardsClass(count: number): string {
  return count > 1 ? "boards boards-two" : "boards";
}

/** The parts of the page that change on every poll. */
export function renderTavleParts(
  payload: DeparturesPayload,
  options: TavleOptions,
  now: Date,
): TavleParts {
  const stations = visibleStations(payload, options.view);
  return {
    theme: resolveTavleTheme(options.theme, now),
    status: renderStatus(payload.fetchedAt, null),
    boards: stations.map((station) => renderStation(station, now)).join(""),
    boardsClass: boardsClass(stations.length),
  };
}

function renderFooter(options: TavleOptions): string {
  const stationLinks: Array<{ view: StationView; label: string }> = [
    { view: "all", label: "Begge" },
    ...STATIONS.map((station) => ({ view: station.id, label: station.shortName })),
  ];
  const themeLinks: Array<{ theme: ThemePreference; label: string }> = [
    { theme: "auto", label: "Auto" },
    { theme: "light", label: "Lys" },
    { theme: "dark", label: "Mørk" },
  ];

  const link = (href: string, label: string, active: boolean) =>
    `<a href="${escapeHtml(href)}"${active ? ' class="active"' : ""}>${escapeHtml(label)}</a>`;

  return `<nav class="bottom">
<span class="group">${stationLinks
    .map((item) => link(tavleHref(item.view, options.theme), item.label, item.view === options.view))
    .join("")}</span>
<span class="group">${themeLinks
    .map((item) => link(tavleHref(options.view, item.theme), item.label, item.theme === options.theme))
    .join("")}</span>
</nav>`;
}

export function renderTavlePage({
  payload,
  error,
  options,
  now,
}: {
  payload: DeparturesPayload | null;
  error: string | null;
  options: TavleOptions;
  now: Date;
}): string {
  const theme = resolveTavleTheme(options.theme, now);
  let status: string;
  let boards: string;
  let boardsClassName: string;

  if (payload) {
    const parts = renderTavleParts(payload, options, now);
    status = parts.status;
    boards = parts.boards;
    boardsClassName = parts.boardsClass;
  } else {
    status = renderStatus(null, error ?? "Ukjent feil");
    boards = `<p class="error-box">${escapeHtml(error ?? "Ukjent feil")}</p>`;
    boardsClassName = "boards";
  }

  const legend = LINE_LEGEND.map(
    (item) =>
      `<li><span class="swatch" style="background:${item.colour}"></span>${escapeHtml(item.label)}</li>`,
  ).join("");

  const config = {
    pollUrl: tavleHref(options.view, options.theme, "&format=json"),
    pollMs: POLL_INTERVAL_MS,
    reloadMs: FULL_RELOAD_MS,
  };
  const configJson = JSON.stringify(config).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="nb" class="${theme === "dark" ? "dark" : ""}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta name="apple-mobile-web-app-title" content="Avganger">
<noscript><meta http-equiv="refresh" content="${POLL_INTERVAL_MS / 1000}"></noscript>
<title>Avgangstavle — Kråkstad og Ski mot Oslo S</title>
<style>${TAVLE_CSS}</style>
</head>
<body>
<div class="page">
<header class="top">
<div>
<p class="eyebrow">Avgangstavle</p>
<span class="clock" id="clock">${formatClock(now)}</span>
<ul class="legend">${legend}</ul>
</div>
<div class="status" id="status">${status}</div>
</header>
<main class="${boardsClassName}" id="boards">${boards}</main>
${renderFooter(options)}
</div>
<script>window.TAVLE_CONFIG = ${configJson};</script>
<script>${TAVLE_CLIENT_SCRIPT}</script>
</body>
</html>`;
}
