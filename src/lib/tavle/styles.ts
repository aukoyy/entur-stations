/**
 * Hand-written CSS for the /tavle board. It must work in Safari 12 (iOS 12),
 * so: no flexbox `gap`, no `@layer`, no `:where`/`:is`, no color-mix/oklch,
 * no `inset`/`aspect-ratio`. Spacing uses margins.
 */
export const TAVLE_CSS = `
:root {
  --background: #e6e8ed;
  --foreground: #1e232b;
  --muted: #5f6670;
  --subtle: #8a9099;
  --surface: #f3f4f7;
  --line: #cfd3db;
  --toggle-active: #1e232b;
  --toggle-active-fg: #f3f4f7;
  --south: #6d28d9;
  --south-fg: #ffffff;
  --danger: #b91c1c;
  --danger-bg: #fef2f2;
  --danger-ring: #fecaca;
  --warn-text: #b45309;
  --warn-bg: #fffbeb;
  --warn-ring: #fde68a;
  --avvik-border: #fbbf24;
  --avvik-label: #92400e;
  --avvik-text: #451a03;
  --note: #92400e;
}

.dark {
  --background: #2c2f36;
  --foreground: #ece9e4;
  --muted: #a7a39c;
  --subtle: #7e7a74;
  --surface: #3a3e46;
  --line: #4c515a;
  --toggle-active: #ece9e4;
  --toggle-active-fg: #2c2f36;
  --south: #a78bfa;
  --south-fg: #1e1638;
  --danger: #fca5a5;
  --danger-bg: rgba(69, 10, 10, 0.45);
  --danger-ring: rgba(153, 27, 27, 0.6);
  --warn-text: #fde047;
  --warn-bg: rgba(113, 63, 18, 0.25);
  --warn-ring: rgba(161, 98, 7, 0.4);
  --avvik-border: rgba(245, 158, 11, 0.5);
  --avvik-label: #fcd34d;
  --avvik-text: #fef3c7;
  --note: #fcd34d;
}

* { box-sizing: border-box; }

html, body { margin: 0; height: 100%; }

html { -webkit-text-size-adjust: 100%; }

body {
  background: var(--background);
  color: var(--foreground);
  font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/*
 * Portrait / narrow (default): stations stack and the whole page scrolls,
 * like the main app. Landscape / wide (min-width: 900px, further down): the
 * page fits the screen and each station list scrolls on its own.
 */
.page {
  display: -webkit-box; display: -webkit-flex; display: flex;
  -webkit-flex-direction: column; flex-direction: column;
  min-height: 100%;
  padding: 16px 20px 0;
}

.top {
  display: -webkit-flex; display: flex;
  -webkit-justify-content: space-between; justify-content: space-between;
  -webkit-align-items: flex-end; align-items: flex-end;
  -webkit-flex-shrink: 0; flex-shrink: 0;
  margin-bottom: 16px;
}

/* Clock and destination share one big line: "22:41  → Oslo S". */
.headline { font-size: 56px; font-weight: 600; line-height: 1.05; }
.clock { display: inline-block; margin-right: 24px; font-variant-numeric: tabular-nums; }
.route { display: inline-block; }

/* South (from Oslo S): coloured band on top, coloured destination and headings. */
.page { border-top: 8px solid transparent; }
.dir-south { border-top-color: var(--south); }
.dir-south .route,
.dir-south .board-head h2 { color: var(--south); }

.legend { list-style: none; margin: 8px 0 0; padding: 0; font-size: 13px; font-weight: 500; color: var(--muted); }
.legend li { display: inline-block; margin-right: 16px; }
.swatch { display: inline-block; width: 12px; height: 12px; border-radius: 2px; margin-right: 6px; vertical-align: -1px; }

.status { text-align: right; font-size: 15px; color: var(--muted); }
.status p { margin: 0; }
.status .small { margin-top: 4px; font-size: 12px; color: var(--subtle); }
.status .error { font-weight: 500; color: var(--danger); }

.boards {
  display: -webkit-flex; display: flex;
  -webkit-flex-direction: column; flex-direction: column;
  -webkit-flex: 1 0 auto; flex: 1 0 auto;
}

.board {
  display: -webkit-flex; display: flex;
  -webkit-flex-direction: column; flex-direction: column;
  min-width: 0;
}

.boards-two .board + .board { margin-top: 28px; }

@media (min-width: 900px) {
  .page { height: 100%; }
  .boards { -webkit-flex: 1 1 auto; flex: 1 1 auto; min-height: 0; }
  .boards-two { -webkit-flex-direction: row; flex-direction: row; }
  .boards-two .board + .board { margin-top: 0; margin-left: 32px; }
  .board { -webkit-flex: 1 1 0%; flex: 1 1 0%; min-height: 0; overflow: hidden; }
  .list {
    -webkit-flex: 1 1 auto; flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}

.board-head {
  display: -webkit-flex; display: flex;
  -webkit-flex-wrap: wrap; flex-wrap: wrap;
  -webkit-justify-content: space-between; justify-content: space-between;
  -webkit-align-items: baseline; align-items: baseline;
  -webkit-flex-shrink: 0; flex-shrink: 0;
  margin-bottom: 12px;
}

.board-head h2 { margin: 0 16px 0 0; font-size: 30px; font-weight: 600; letter-spacing: -0.01em; }
.trip { margin: 0; color: var(--muted); }
.trip strong { margin-right: 8px; font-size: 24px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--foreground); }
.trip span { font-size: 13px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: var(--subtle); }

.avvik {
  -webkit-flex-shrink: 0; flex-shrink: 0;
  margin-bottom: 8px;
  padding: 8px 12px;
  border: 1px solid var(--avvik-border);
  border-radius: 8px;
  background: var(--warn-bg);
  color: var(--avvik-text);
}
.avvik .label { margin: 0; font-size: 13px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--avvik-label); }
.avvik .summary { margin: 2px 0 0; font-size: 17px; font-weight: 500; }
.avvik .description { margin: 4px 0 0; font-size: 14px; opacity: 0.8; }

.day {
  display: -webkit-flex; display: flex;
  -webkit-align-items: center; align-items: center;
  margin: 10px 0 8px;
}
.day .rule { -webkit-flex: 1 1 auto; flex: 1 1 auto; min-width: 16px; height: 1px; background: var(--line); }
.day .label { padding: 0 12px; text-align: center; }
.day .title { display: block; font-size: 14px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); }
.day .sub { display: block; margin-top: 2px; font-size: 12px; color: var(--subtle); }

.deps { list-style: none; margin: 0; padding: 0; }

.dep {
  display: -webkit-flex; display: flex;
  -webkit-align-items: center; align-items: center;
  margin-bottom: 8px;
  padding: 10px 14px;
  border-left: 4px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
}
.dep.is-delayed { background: var(--warn-bg); box-shadow: 0 0 0 1px var(--warn-ring); }
.dep.is-replacement { border-left-color: #fbbf24; background: var(--warn-bg); box-shadow: 0 0 0 1px var(--warn-ring); }
.dep.is-cancelled { border-left-color: #dc2626; background: var(--danger-bg); box-shadow: 0 0 0 1px var(--danger-ring); }

.badge {
  -webkit-flex-shrink: 0; flex-shrink: 0;
  min-width: 52px;
  margin-right: 14px;
  padding: 4px 8px;
  border-radius: 6px;
  text-align: center;
  font-size: 19px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.badge.cancelled { background: #b91c1c; color: #fff; }
.badge.replacement { background: #f59e0b; color: #09090b; }

.time { -webkit-flex-shrink: 0; flex-shrink: 0; width: 72px; margin-right: 14px; line-height: 1.15; }
.time .now { display: block; font-size: 22px; font-weight: 600; font-variant-numeric: tabular-nums; }
.time .now.late { color: var(--warn-text); }
.time .now.cancelled { color: var(--danger); text-decoration: line-through; }
.time .was { display: block; font-size: 13px; color: var(--subtle); text-decoration: line-through; font-variant-numeric: tabular-nums; }

.info { -webkit-flex: 1 1 auto; flex: 1 1 auto; min-width: 0; }
.dest { margin: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 19px; font-weight: 500; }
.dest.cancelled { color: var(--danger); text-decoration: line-through; }
.arrival { margin: 1px 0 0; font-size: 15px; color: var(--muted); font-variant-numeric: tabular-nums; }

.tags { margin-top: 3px; font-size: 12px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
.tag { display: inline-block; margin-right: 6px; padding: 1px 6px; border-radius: 4px; }
.tag.cancelled { background: #dc2626; color: #fff; }
.tag.replacement { background: #fbbf24; color: #09090b; }
.tag.delayed { background: #facc15; color: #09090b; }

.note { margin: 4px 0 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 14px; color: var(--note); }

.platform { -webkit-flex-shrink: 0; flex-shrink: 0; margin-left: 14px; text-align: right; color: var(--muted); }
.platform small { display: block; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; }
.platform strong { font-size: 20px; font-weight: 600; color: var(--foreground); }

.empty, .error-box { margin: 0; padding: 20px 16px; border-radius: 8px; font-size: 18px; }
.empty { background: var(--surface); color: var(--muted); }
.error-box { background: var(--danger-bg); color: var(--danger); }

/* Sticky so the station/theme links stay in reach when the page scrolls in portrait. */
.bottom {
  position: -webkit-sticky; position: sticky;
  bottom: 0;
  -webkit-flex-shrink: 0; flex-shrink: 0;
  margin-top: 10px;
  padding: 8px 0 10px;
  border-top: 1px solid var(--line);
  background: var(--background);
  font-size: 14px;
}
.bottom .group { display: inline-block; margin-right: 24px; }
.bottom a {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 6px;
  color: var(--subtle);
  text-decoration: none;
}
.bottom a.active { background: var(--toggle-active); color: var(--toggle-active-fg); }
.bottom a.active.south { background: var(--south); color: var(--south-fg); }
`;
