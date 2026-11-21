# CruxCoach

CruxCoach is a free climbing logbook and training companion. Log indoor and outdoor sessions separately, reflect on holds, angles and styles, and read the patterns that come out of your own data.

[Website](https://cruxcoach.vercel.app)

## What is in the app

- **Session logging:** multiple climbs per session with grade, style and attempts, plus where you climbed, duration, effort, approach distance and notes.
- **Indoor and outdoor split:** every session and training block is tagged indoor or outdoor. The logbook, journal, patterns and plans screens count them separately, so a gym grade never quietly stands in for a crag grade.
- **Reflections:** 15 traits rated from -2 to +2, weighted toward recent sessions.
- **Patterns:** send rate by environment, grade and day, session length and effort against conversion, style mix, and plain-language findings that only appear when there are enough climbs behind them.
- **Logbook:** indoor and outdoor totals, hardest send, weekly goal, volume, strengths, struggles, focus areas and recent sessions.
- **Journal:** searchable history with indoor and outdoor filters, plus edit and delete for sessions and reflections.
- **Train:** a searchable library of articles, workouts and practices, with recommendations based on your lowest-rated traits.
- **Learn:** four modules (holds, angles, style, training) with local completion tracking.
- **Plans:** 2 to 8 week indoor or outdoor blocks with a 3:1 build and deload cycle, current-week tracking and adherence. A planned session can be logged straight from the block, which records it against the week and links back to the journal. Blocks can be completed and reopened.
- **Profile and data:** preferences that drive the app (units for height, weight and distance, grade system for entry and display, weekly session goal, disciplines), JSON backup and restore, legacy data import, and delete-all.

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
src/pages/app/                 logbook, log, patterns, reflect, journal, train, learn, plans, profile
src/pages/train/[slug].astro   static article routes
src/components/app/            React app islands
src/lib/                       domain logic, Dexie database, pattern analysis, legacy import
src/data/content.ts            lesson and workout catalog
src/styles/                    design tokens, global and app styles
train/lessons/                 original article bodies reused by the new lesson route
```

## Migration

The previous site's `localStorage` data is detected automatically. The logbook and profile offer a one-time import that converts old sessions, grades, traits and reflections without deleting the original data. Sessions saved before indoor and outdoor were tracked are inferred from their location, and the original row is left untouched. Old URLs redirect to their new routes via `vercel.json`.
