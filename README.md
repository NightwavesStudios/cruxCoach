# CruxCoach

CruxCoach is a free climbing training companion: log sessions, reflect on holds, angles and styles, see what is improving, and train with a plan built around your own data.

[Website](https://cruxcoach.vercel.app)

## What is in the app

- **Session logging** — multiple climbs per session with grade, style and attempts, plus duration, effort, location and notes.
- **Reflections** — 15 traits rated from −2 to +2, weighted toward recent sessions.
- **Dashboard** — boulder and rope levels, weekly volume, grade progression, strengths and struggles, focus areas, recent sessions.
- **Journal** — searchable history with edit and delete for sessions and reflections.
- **Train** — a searchable library of articles, workouts and practices, with recommendations based on your lowest-rated traits.
- **Learn** — four modules (holds, angles, style, training) with local completion tracking.
- **Plans** — 2–8 week training blocks with a 3:1 build/deload cycle, current-week tracking and adherence; blocks can be completed and reopened.
- **Profile and data** — preferences, JSON backup and restore, legacy data import, and delete-all.

All training data is stored locally with IndexedDB (Dexie). There are no accounts and no server-side storage.

## Stack

Astro static pages, React islands for the app, TypeScript, Dexie/IndexedDB, Zod for backup validation, Vitest for domain tests. Deployed as a static build on Vercel.

```bash
npm install
npm run dev      # http://localhost:3000
npm run check    # TypeScript and Astro diagnostics
npm test         # domain tests
npm run build    # production build in dist/
```

## Structure

```text
src/pages/index.astro          landing page
src/pages/app/                 dashboard, log, reflect, journal, train, learn, plans, profile
src/pages/train/[slug].astro   static article routes
src/components/app/            React app islands
src/lib/                       domain logic, Dexie database, legacy import
src/data/content.ts            lesson and workout catalog
src/styles/                    design tokens, global and app styles
train/lessons/                 original article bodies reused by the new lesson route
```

## Migration

The previous site's `localStorage` data is detected automatically. The dashboard and profile offer a one-time import that converts old sessions, grades, traits and reflections without deleting the original data. Old URLs redirect to their new routes via `vercel.json`.
