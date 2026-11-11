# Avgangstavle — Kråkstad, Ski og Oslo S

Infoscreen for **regiontog og regionekspress** between Kråkstad/Ski and Oslo S, in both directions. Real-time departures come from [Entur Journey Planner](https://developer.entur.no/docs/open-services/journey-planner).

## What it shows

- Next **R / RE** trains for about **24 hours** (local L-lines are hidden)
- Direction: **Nord** (default), from Kråkstad/Ski to Oslo S, headed *Fra Kråkstad* / *Fra Ski*; or **Sør**, from Oslo S to Kråkstad/Ski, headed *Til Kråkstad* / *Til Ski*. Going south, each row shows the departure time and platform at Oslo S plus the arrival time at the station
- South gets its own violet accent: a band across the top and the Sør toggle
- The direction is picked from your location: closer to Oslo S than to Kråkstad/Ski means Sør, otherwise Nord. The position is only used in the browser. Tapping the toggle overrides it until the app has been in the background for 30 minutes; without location access it's Nord
- Typical travel time next to the heading (*til* / *fra Oslo S*): **20 min** for Kråkstad, **12 min** for Ski
- Line colours from Entur (regiontog red, regionekspress cyan)
- Delays, cancellations, rail-replacement buses, and Entur situation messages
- Day break (**I morgen**) and a **Morgen** heading after the overnight gap
- Station picker: Begge, Kråkstad, or Ski (one station fills the width). With Begge, the stations sit side by side on screens from 740px wide (iPads in portrait too) and on landscape screens from 560px (phones turned sideways); narrower screens stack them
- Theme: Auto (OS light/dark), Lys, or Mørk

The board polls `/api/departures` every 30 seconds.

## URL presets

Station and theme are stored in `localStorage` and mirrored in the query string, so a kiosk can open a fixed view. Direction is never stored (so the app doesn't open on a direction left over from last time); `retning` in the URL pins it and skips the location lookup:

| Param     | Values                     | Example                  |
| --------- | -------------------------- | ------------------------ |
| `retning` | `nord`, `sor`              | `?retning=sor`           |
| `stasjon` | `begge`, `krakstad`, `ski` | `?stasjon=krakstad`      |
| `tema`    | `auto`, `lys`, `mork`      | `?stasjon=ski&tema=mork` |

## Old iPads: `/tavle`

The main app needs Safari 16.4+ (Next.js 16, React 19, Tailwind 4), so on older iOS (e.g. an iPad stuck on iOS 12) it never loads departures. `/tavle` is a separate, lightweight version of the board for those devices:

- Plain server-rendered HTML with hand-written CSS and a small ES5 script, without React, Tailwind or Next.js client JavaScript
- Polls `/tavle?…&format=json` every 30 seconds and swaps in the new board; if a poll fails, the last board stays on screen
- The whole page scrolls. Narrow screens stack the stations; from 740px wide, or landscape from 560px (same rule as the main app), they sit side by side
- The station/theme links sit at the bottom of the page, after the last train
- Scroll position is kept across polls
- Reloads the full page every 6 hours (only right after a successful poll) to pick up new deploys; this also scrolls back to the top
- Same `retning`, `stasjon` and `tema` params as above; small links in the footer switch between them. No location lookup here: without `retning` it's Nord
- `tema=auto` is time-based here, since iOS 12 has no dark mode: dark from 21:00 to 06:00 Oslo time

Example: `/tavle?stasjon=begge&tema=auto`. On the iPad, use **Share → Add to Home Screen** to run it full-screen without the browser bar.

Code lives in `src/app/tavle/route.ts` and `src/lib/tavle/`.

## Local development

Requires Node.js 20+.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Entur requires an `ET-Client-Name` header. Set it in `.env.local`:

```
ENTUR_CLIENT_NAME=yourorg-entur-stations
```

The default in code is `aukoyy-entur-stations` if the env var is unset. Use the form `organization-application` (lowercase, no spaces).

| Script          | Purpose                    |
| --------------- | -------------------------- |
| `npm run dev`   | Next.js dev server         |
| `npm run build` | Production build           |
| `npm start`     | Serve the production build |
| `npm run lint`  | ESLint                     |

## Stack

- [Next.js](https://nextjs.org) 16 (App Router) and React 19
- Tailwind CSS 4
- Entur Journey Planner GraphQL (`https://api.entur.io/journey-planner/v3/graphql`)

Departures are fetched server-side in `src/app/api/departures/route.ts` so the client name stays off the browser.

## Deploy

Hosted on **AWS Amplify**, connected to the `main` branch of this repo. Amplify builds with `npm run build` and serves the Next.js app.

Set `ENTUR_CLIENT_NAME` in the Amplify environment if you do not want the in-code default.

## How it was built

This app was made in [Cursor](https://cursor.com) by prompting an AI coding agent, not from a written spec.

It started as `create-next-app` (Next.js App Router and Tailwind). Behaviour was shaped in conversation, one change at a time: pull departures from Entur’s GraphQL API, keep only Oslo S–bound R/RE trains, drop local L-lines, show a 24-hour window, add station and theme toggles, and so on. The agent edited the TypeScript and React, probed Entur to check the query shape, and we reviewed the board in the browser after each round.
