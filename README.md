# Avgangstavle — Kråkstad og Ski mot Oslo S

Infoscreen for **regiontog og regionekspress** mot Oslo S from Kråkstad and Ski. Real-time departures come from [Entur Journey Planner](https://developer.entur.no/docs/open-services/journey-planner).

## What it shows

- Next Oslo-bound **R / RE** trains for about **24 hours** (local L-lines are hidden)
- Typical travel time next to the station name: **20 min** from Kråkstad, **12 min** from Ski
- Line colours from Entur (regiontog red, regionekspress cyan)
- Delays, cancellations, rail-replacement buses, and Entur situation messages
- Day break (**I morgen**) and a **Morgen** heading after the overnight gap
- Station picker: Begge, Kråkstad, or Ski (one station fills the width)
- Theme: Auto (OS light/dark), Lys, or Mørk

The board polls `/api/departures` every 30 seconds.

## URL presets

Choices are stored in `localStorage` and mirrored in the query string, so a kiosk can open a fixed view:

| Param     | Values                     | Example                  |
| --------- | -------------------------- | ------------------------ |
| `stasjon` | `begge`, `krakstad`, `ski` | `?stasjon=krakstad`      |
| `tema`    | `auto`, `lys`, `mork`      | `?stasjon=ski&tema=mork` |

## Old iPads: `/tavle`

The main app needs Safari 16.4+ (Next.js 16, React 19, Tailwind 4), so on older iOS (e.g. an iPad stuck on iOS 12) it never loads departures. `/tavle` is a separate, lightweight version of the board for those devices:

- Plain server-rendered HTML with hand-written CSS and a small ES5 script, without React, Tailwind or Next.js client JavaScript
- Polls `/tavle?…&format=json` every 30 seconds and swaps in the new board; if a poll fails, the last board stays on screen
- Portrait: stations stack and the whole page scrolls, with the footer links pinned to the bottom. Landscape: stations side by side, each list scrolls on its own
- Scroll position is kept across polls
- Reloads the full page every 6 hours (only right after a successful poll) to pick up new deploys; this also scrolls back to the top
- Same `stasjon` and `tema` params as above; small links in the footer switch between them
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
