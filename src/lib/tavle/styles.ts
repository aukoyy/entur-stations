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
 * Made to be read from a few metres away (an iPad on a hallway shelf): one
 * column, large rows, and the page script shows only as many trains as fit on
 * the screen (see fitToScreen in client.ts). Phone-width screens get smaller
 * sizes at the bottom of this file.
 */
.page {
  display: -webkit-box; display: -webkit-flex; display: flex;
  -webkit-flex-direction: column; flex-direction: column;
  min-height: 100%;
  padding: 18px 24px 0;
}

.top {
  display: -webkit-flex; display: flex;
  -webkit-justify-content: space-between; justify-content: space-between;
  -webkit-align-items: flex-end; align-items: flex-end;
  -webkit-flex-shrink: 0; flex-shrink: 0;
  margin-bottom: 18px;
}

.eyebrow {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--muted);
}

.clock {
  display: block;
  font-size: 76px;
  font-weight: 600;
  line-height: 1.05;
  font-variant-numeric: tabular-nums;
}

/* South (from Oslo S): coloured band on top. */
.page { border-top: 10px solid transparent; }
.dir-south { border-top-color: var(--south); }

.legend { list-style: none; margin: 8px 0 0; padding: 0; font-size: 16px; font-weight: 500; color: var(--muted); }
.legend li { display: inline-block; margin-right: 18px; }
.swatch { display: inline-block; width: 14px; height: 14px; border-radius: 3px; margin-right: 7px; vertical-align: -1px; }

.status { text-align: right; font-size: 18px; color: var(--muted); }
.status p { margin: 0; }
.status .small { margin-top: 4px; font-size: 14px; color: var(--subtle); }
.status .error { font-weight: 600; color: var(--danger); }

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

.boards-two .board + .board { margin-top: 22px; }

.board-head {
  display: -webkit-flex; display: flex;
  -webkit-flex-wrap: wrap; flex-wrap: wrap;
  -webkit-justify-content: space-between; justify-content: space-between;
  -webkit-align-items: baseline; align-items: baseline;
  -webkit-flex-shrink: 0; flex-shrink: 0;
  margin-bottom: 12px;
}

.board-head h2 { margin: 0 18px 0 0; font-size: 36px; font-weight: 600; letter-spacing: -0.01em; }
.trip { margin: 0; color: var(--muted); }
.trip strong { margin-right: 10px; font-size: 32px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--foreground); }
.trip span { font-size: 16px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: var(--subtle); }

.avvik {
  -webkit-flex-shrink: 0; flex-shrink: 0;
  margin-bottom: 10px;
  padding: 10px 14px;
  border: 1px solid var(--avvik-border);
  border-radius: 10px;
  background: var(--warn-bg);
  color: var(--avvik-text);
}
.avvik .label { margin: 0; font-size: 15px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--avvik-label); }
.avvik .summary { margin: 2px 0 0; font-size: 22px; font-weight: 500; }
.avvik .description { margin: 4px 0 0; font-size: 17px; opacity: 0.8; }

.day {
  display: -webkit-flex; display: flex;
  -webkit-align-items: center; align-items: center;
  margin: 6px 0 10px;
}
.day .rule { -webkit-flex: 1 1 auto; flex: 1 1 auto; min-width: 16px; height: 1px; background: var(--line); }
.day .label { padding: 0 14px; text-align: center; }
.day .title { display: block; font-size: 18px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); }
.day .sub { display: block; margin-top: 2px; font-size: 15px; color: var(--subtle); }

.deps { list-style: none; margin: 0; padding: 0; }

.dep {
  display: -webkit-flex; display: flex;
  -webkit-align-items: center; align-items: center;
  margin-bottom: 10px;
  padding: 14px 18px;
  border-left: 6px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
}
.dep.is-delayed { background: var(--warn-bg); box-shadow: 0 0 0 1px var(--warn-ring); }
.dep.is-replacement { border-left-color: #fbbf24; background: var(--warn-bg); box-shadow: 0 0 0 1px var(--warn-ring); }
/* Too late to get to the station, but the train hasn't left yet. */
.dep.is-missed { opacity: 0.4; }
.dep.is-cancelled { border-left-color: #dc2626; background: var(--danger-bg); box-shadow: 0 0 0 1px var(--danger-ring); }

.badge {
  -webkit-flex-shrink: 0; flex-shrink: 0;
  min-width: 84px;
  margin-right: 20px;
  padding: 6px 12px;
  border-radius: 8px;
  text-align: center;
  font-size: 30px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.badge.cancelled { background: #b91c1c; color: #fff; }
.badge.replacement { background: #f59e0b; color: #09090b; }

.time { -webkit-flex-shrink: 0; flex-shrink: 0; width: 124px; margin-right: 20px; line-height: 1.1; }
.time .now { display: block; font-size: 42px; font-weight: 600; font-variant-numeric: tabular-nums; }
.time .now.late { color: var(--warn-text); }
.time .now.cancelled { color: var(--danger); text-decoration: line-through; }
.time .countdown { display: block; margin-top: 2px; font-size: 19px; font-weight: 500; color: var(--muted); font-variant-numeric: tabular-nums; }
.time .countdown:empty { display: none; }
.time .was { display: block; font-size: 19px; color: var(--subtle); text-decoration: line-through; font-variant-numeric: tabular-nums; }

.info { -webkit-flex: 1 1 auto; flex: 1 1 auto; min-width: 0; }
.dest { margin: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 30px; font-weight: 500; }
.dest.cancelled { color: var(--danger); text-decoration: line-through; }
.arrival { margin: 2px 0 0; font-size: 21px; color: var(--muted); font-variant-numeric: tabular-nums; }

.tags { margin-top: 4px; font-size: 18px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
.tag { display: inline-block; margin-right: 8px; padding: 2px 9px; border-radius: 6px; white-space: nowrap; }
.tag.cancelled { background: #dc2626; color: #fff; }
.tag.replacement { background: #fbbf24; color: #09090b; }
.tag.leave { background: #059669; color: #fff; }
.dark .tag.leave { background: #10b981; color: #09090b; }
.tag.leave:empty { display: none; }
.tag.delayed { background: #facc15; color: #09090b; }

.platform { -webkit-flex-shrink: 0; flex-shrink: 0; margin-left: 18px; text-align: right; color: var(--muted); }
.platform small { display: block; font-size: 15px; letter-spacing: 0.1em; text-transform: uppercase; }
.platform strong { font-size: 36px; font-weight: 600; color: var(--foreground); }

.stale {
  margin: 0 0 18px;
  padding: 14px 18px;
  border-radius: 10px;
  background: #dc2626;
  color: #fff;
  font-size: 22px;
  font-weight: 600;
}
.stale:empty { display: none; }

.empty, .error-box { margin: 0; padding: 22px 18px; border-radius: 10px; font-size: 24px; }
.empty { background: var(--surface); color: var(--muted); }
.error-box { background: var(--danger-bg); color: var(--danger); }

/* At the bottom of the page, after the last train (not pinned to the screen). */
.bottom {
  -webkit-flex-shrink: 0; flex-shrink: 0;
  margin-top: 8px;
  padding: 8px 0 12px;
  border-top: 1px solid var(--line);
  font-size: 18px;
}
.bottom .group { display: inline-block; margin-right: 24px; }
.bottom a {
  display: inline-block;
  padding: 8px 12px;
  border-radius: 8px;
  color: var(--subtle);
  text-decoration: none;
}
.bottom a.active { background: var(--toggle-active); color: var(--toggle-active-fg); }
.bottom a.active.south { background: var(--south); color: var(--south-fg); }

/* Phone-width screens: stack the header with the clock last, and use smaller sizes. */
@media (max-width: 599px) {
  .page { padding: 14px 16px 0; }
  .top {
    -webkit-flex-direction: column-reverse; flex-direction: column-reverse;
    -webkit-align-items: flex-start; align-items: flex-start;
  }
  .top .status { margin-bottom: 10px; text-align: left; font-size: 15px; }
  .clock { font-size: 56px; }
  .board-head h2 { font-size: 26px; }
  .trip strong { font-size: 24px; }
  .trip span { font-size: 13px; }
  .dep { padding: 10px 12px; border-left-width: 4px; }
  .badge { min-width: 52px; margin-right: 12px; padding: 4px 8px; font-size: 19px; }
  .time { width: 76px; margin-right: 12px; }
  .time .now { font-size: 24px; }
  .time .countdown, .time .was { font-size: 13px; }
  .dest { font-size: 19px; }
  .arrival { font-size: 15px; }
  .tags { font-size: 12px; }
  .tag { padding: 1px 6px; }
  .platform { margin-left: 12px; }
  .platform small { font-size: 11px; }
  .platform strong { font-size: 22px; }
  .bottom { font-size: 15px; }
}
`;
