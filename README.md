# Avgangstavle — Kråkstad og Ski mot Oslo S

Infoscreen for **regiontog og regionekspress** mot Oslo S from Kråkstad and Ski. Real-time departures come from [Entur Journey Planner](https://developer.entur.no/docs/open-services/journey-planner).

**Live:** [https://main.d1kdar5zuntzhw.amplifyapp.com](https://main.d1kdar5zuntzhw.amplifyapp.com)

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

| Param | Values | Example |
| --- | --- | --- |
| `stasjon` | `begge`, `krakstad`, `ski` | `?stasjon=krakstad` |
| `tema` | `auto`, `lys`, `mork` | `?stasjon=ski&tema=mork` |

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

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |

## Stack

- [Next.js](https://nextjs.org) 16 (App Router) and React 19
- Tailwind CSS 4
- Entur Journey Planner GraphQL (`https://api.entur.io/journey-planner/v3/graphql`)

Departures are fetched server-side in `src/app/api/departures/route.ts` so the client name stays off the browser.

## Deploy

The app is hosted on **AWS Amplify**, connected to `entur-stations` on `main`. Amplify builds with `npm run build` and serves the Next.js app.

Set `ENTUR_CLIENT_NAME` in the Amplify environment if you do not want the in-code default.
