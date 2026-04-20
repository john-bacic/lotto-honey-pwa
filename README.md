# Lotto Honeycomb PWA

This app is a Progressive Web App built from `honeycomb-picker.jsx` and powered by draw data from `data.js`.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Current data source

- `src/lib/draws.js` reads static draw history from `data.js`.
- UI stays the same when swapping data sources later.

## Planned auto-update architecture (next step)

1. Move draw rows into a database table:
   - `draws(id, draw_date, draw_day, numbers_json, bonus, jackpot, created_at)`
2. Add an endpoint:
   - `GET /api/draws` returns newest-first rows.
3. Add a scraper job:
   - Cron runs after each official draw.
   - Scraper parses latest winning row from source website.
   - If date not already in DB, insert at top.
4. Frontend update:
   - Replace static adapter in `src/lib/draws.js` with API fetch + local cache.

## Suggested stack for your goal

- DB: Supabase Postgres
- Scheduler: Vercel Cron or GitHub Actions
- Scraper: Node + Cheerio (or Playwright when site is dynamic)
