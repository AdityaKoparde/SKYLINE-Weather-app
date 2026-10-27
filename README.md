# Skyline — Full-Stack Weather App

A complete weather dashboard built for an internship project. Search any city, see live
conditions, a 24-hour outlook and a 7-day forecast, and pin your favourite cities so they
are one click away.

**Live:** https://site-473b0ed67b9b4763abcb7ae78a8ccb3b.freebuff.page

No API key, no signup, no database server to run — `npm install && npm run dev` is the whole
setup, and the app runs on Cloudflare Workers in production.

| Stack     | Choice                                                              |
| --------- | ------------------------------------------------------------------- |
| Framework | Next.js 16 (App Router, TypeScript)                                  |
| UI        | React 19 + Tailwind CSS 4, hand-built SVG icons and charts           |
| Backend   | Next.js Route Handlers (`app/api/*`) — a real HTTP API layer          |
| Data      | Cloudflare D1 (SQLite) via the `DB` binding                           |
| Forecast  | [Open-Meteo](https://open-meteo.com) — free, no API key required      |
| Hosting   | Cloudflare Workers through Freebuff Sites (OpenNext adapter)          |

## Features

- **City search** with debounced autocomplete and full keyboard navigation (↑ ↓ Enter Esc)
- **Current conditions**: temperature, feels like, condition, high/low, humidity, wind,
  gusts, pressure, UV index, visibility, sunrise/sunset
- **24-hour chart** — smoothed temperature curve with rain-chance bars, drawn as hand-built SVG
- **7-day forecast** with per-day rain probability and min→max temperature range bars
- **Pinned cities** persisted server-side in D1, with a 12-city limit and duplicate protection
- **°C / °F toggle** — the conversion happens on the server, not in the browser
- **Condition-aware design**: the background gradient, glow and chart colour change with the
  weather and with day/night
- **Resilient UI**: loading skeletons, an error card with retry, a stale-data banner, and a
  remembered last-viewed city
- **Accessible**: labelled controls, `aria-pressed`/`aria-current`/`role=listbox`, reduced-motion
  support, responsive from 320 px up

## Getting started

Requires **Node.js 20.9+** (Node 22/24 recommended).

```bash
npm install
npm run dev          # http://localhost:3000
```

Other scripts:

```bash
npm run build        # Next.js production build
npm start            # run the production build
npm run typecheck    # tsc --noEmit
```

`next dev` uses the OpenNext adapter (`initOpenNextCloudflareForDev` in `next.config.ts`) so
local requests get the same `DB` binding the deployed Worker uses. The local D1 database is
simulated by Miniflare and stored under `.wrangler/state` — delete that folder to reset your
pinned cities.

## How it works

```
Browser
  │  fetch /api/weather?lat=…&lon=…&unit=metric
  ▼
app/api/weather/route.ts      validate input → cache → normalise → convert units
  │
  ├─ lib/weather.ts           Open-Meteo client, 5-minute in-memory cache,
  │                           WMO code mapping, metric ⇄ imperial conversion
  ├─ lib/geocode.ts           city search + 1-hour cache
  └─ lib/db.ts                D1 schema, queries, 12-city limit
```

The browser never calls Open-Meteo directly. Every upstream request goes through the server,
which keeps input validation, caching and unit conversion in one place, and means a key could
be added later without touching the client.

### API

| Method   | Route                       | Purpose                                              |
| -------- | --------------------------- | ---------------------------------------------------- |
| `GET`    | `/api/weather?lat&lon&unit` | Normalised forecast: current, 24 hourly, 7 daily     |
| `GET`    | `/api/geocode?q=`           | City search (name, region, country, coordinates)     |
| `GET`    | `/api/locations`            | List pinned cities                                   |
| `POST`   | `/api/locations`            | Pin a city (201, or 409 when the limit is reached)   |
| `DELETE` | `/api/locations?id=`        | Unpin a city (204 / 404)                             |

Inputs are validated: coordinates must be inside ±90/±180, `unit` must be `metric` or
`imperial`, text is trimmed, control characters stripped and length-capped. The D1 table is
created automatically on the first request.

## Project structure

```
app/
  layout.tsx                 metadata, font, global styles
  page.tsx                   server component — reads pinned cities from D1
  globals.css                Tailwind theme, glass cards, animations
  api/
    weather/route.ts         forecast endpoint
    geocode/route.ts         city search endpoint
    locations/route.ts       pinned-cities CRUD
components/
  Dashboard.tsx              client shell: fetching, units, pinning, layout
  SearchBar.tsx              debounced autocomplete + keyboard nav
  CurrentWeather.tsx         hero card
  Metrics.tsx                six supporting metrics
  HourlyChart.tsx            24-hour SVG chart
  DailyForecast.tsx          7-day list with range bars
  SavedLocations.tsx         pinned-city list
  WeatherIcon.tsx            animated SVG icon set
lib/
  types.ts                   shared domain types
  config.ts                  API URLs, cache TTLs, default city, limits
  weather.ts                 forecast service (server only)
  geocode.ts                 geocoding service (server only)
  db.ts                      D1 persistence (server only)
  weather-codes.ts           WMO code → label/icon group
  sky.ts                     background theme per condition
  format.ts                  time/temperature/description formatting
```

`freebuff.wrangler.jsonc` and `freebuff.open-next.config.ts` are generated by the hosting
integration and committed so that `npm run dev` can resolve the local D1 binding. The
`freebuff-sites-build/` folder is regenerated build output and is gitignored.

## Configuration

Everything worth changing lives in [`lib/config.ts`](lib/config.ts):

- `DEFAULT_PLACE` — the city shown before anything is pinned (defaults to Bengaluru)
- `MAX_SAVED_LOCATIONS` — pin limit (default 12)
- `WEATHER_CACHE_TTL` — how long upstream forecasts are cached (default 5 min)

## Deployment

The app runs on Cloudflare Workers through the OpenNext adapter, with a D1 database bound as
`DB`. The hosting integration generates `freebuff.wrangler.jsonc`, `freebuff.open-next.config.ts`
and the Worker bundle in `freebuff-sites-build/`, then uploads that bundle with the D1 binding.

To ship a change, publish the site again from Freebuff (Sites panel → Publish) — it rebuilds the
Next.js app and redeploys it. To verify a build locally against the Workers runtime first:

```bash
npx wrangler dev --config freebuff.wrangler.jsonc --port 8787
```

## Notes and limitations

- **Single-user storage.** Pinned cities are global for the deployment, not per account.
  Adding auth and a `user_id` column is the natural next step.
- **In-memory cache.** The 5-minute forecast cache is per Worker isolate; a cold isolate simply
  refetches from Open-Meteo.
- **Two environments.** The live URL above is the *preview* environment. Production is a
  separate deployment with its own database; publish there when you are ready for a stable URL.
- **Attribution.** Weather data by [Open-Meteo](https://open-meteo.com) (CC-BY 4.0).
