# Lotto Honey PWA - App Outline

## 1) Current App (What Exists Now)

## Stack
- Frontend: React + Vite
- Rendering: Three.js honeycomb visualization
- PWA: `vite-plugin-pwa` service worker + manifest
- Data source: local static file `data.js`

## Main UX
- Honeycomb grid highlights draw numbers.
- Row list shows draw sets and bonus number (bonus at 50% visual opacity).
- Top pill shows selected row date + jackpot (`date - $amountM`), fallback to latest draw.
- Onion-skin mode layers forward draws.
- Navigation:
  - Buttons (up/down style)
  - Keyboard arrows (`ArrowUp`, `ArrowDown`)

## Data Flow (Current)
1. `data.js` exports raw draw rows.
2. `src/lib/draws.js` maps raw rows into UI rows:
   - `nums`
   - `bonus`
   - `jackpot`
   - `maxNum`
3. `src/App.jsx` consumes mapped rows and drives rendering + interactions.

## Key Files
- `src/App.jsx` - primary UI, state, interactions, Three.js scene
- `src/lib/draws.js` - data adapter layer
- `data.js` - static draw history
- `vite.config.js` - PWA config

---

## 2) Planned Backend Direction (Convex, later)

## Why Convex for this app
- Realtime by default (new draw appears instantly in UI).
- Type-safe backend functions with minimal boilerplate.
- Good fit for append-only draw history + scheduled ingestion.

## Proposed Convex Model
- Table: `draws`
  - `drawDate` (string or normalized date)
  - `drawDay` (`"t"` / `"f"`)
  - `numbers` (array length 7)
  - `bonus` (number)
  - `jackpot` (number)
  - `createdAt` (number)
- Index:
  - by `drawDate` (uniqueness check)
  - by newest-first sort strategy

## Proposed Convex Functions
- Query: `listDraws`
  - Returns latest draws sorted newest first.
- Mutation: `insertDrawIfNew`
  - Inserts only if draw date does not already exist.
- Action: `scrapeLatestDraw`
  - Fetches/parses official source and calls `insertDrawIfNew`.
- Scheduler/Cron:
  - Runs after official draw windows.

## Frontend Migration Plan
1. Keep current UI unchanged.
2. Replace `src/lib/draws.js` static read with Convex query adapter.
3. Keep same output shape so `App.jsx` requires minimal/no refactor.

---

## 3) Deployment Notes (Vercel + Vite)
- Vite is suitable for this frontend.
- Convex runs as managed backend service.
- Vercel hosts static frontend; frontend talks to Convex over API/WebSocket.

---

## 4) Future Enhancements
- Draw source health checks + alerting.
- Manual override/admin insert for missed scrape.
- Retry/backoff and parser versioning.
- Historical analytics layer (hot/cold numbers, frequency windows).
