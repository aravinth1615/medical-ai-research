# Medical AI

A clinical research console. It brings together lab panels, sensor streams and treatment history, and lets you ask several AI models the same question at once.

Next.js 16 (App Router, Cache Components, Partial Prefetching), React 19, Tailwind CSS v4.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Signing in (static — no backend yet)

Only one account can sign in:

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@hubts.io` | `Admin@123` |

The login page doesn't show these credentials. A session saved for any other email is signed out the next time the app loads.

How auth works:

- `src/lib/auth/service.ts` is the only module that checks credentials. `signIn` / `signOut` match the contract a real API will have. To go live, replace these two functions and nothing else needs to change.
- On sign-in the session goes to `localStorage` (`omnimed.session`, 8-hour TTL), and an `omr_session` cookie is set.
- `src/proxy.ts` is the first guard. Without the cookie, every route except `/login` redirects to `/login?next=…`. With it, `/login` sends you to `/home`.
- `AuthGuard` is the second guard. It catches a stored session that expired or was cleared in another tab. A deliberate sign-out returns to `/login` without `?next`.

## Routes

| Route | Screen |
|---|---|
| `/login` | Sign in |
| `/home` | Research composer: context sources, model registry, attachments, prompt library |
| `/summary` | Executive summary: critical/borderline deviations, severity index, protocol, deep search |
| `/report` | Combined lab report: status/deviation filters, search, sort, date compare, AI panel summaries, doctor's action plan, follow-up labs |
| `/records/blood-labs` | Every extracted panel, by lab |
| `/records/reports/[slug]` | Previous reports (2025 annual physical, Q3 cardiology) |
| `/treatment/[medications\|supplements]/[current\|past]` | Regimens |
| `/health-data/sensors/[dexcom-g7\|apple-watch-s9]` | Sensor metrics, 24 h trace, events |
| `/health-data/nutrition` | Food log against CGM response |

## Structure

```
src/
  app/(auth)/        login + brand column layout
  app/(app)/         AuthGuard + AppShell, every signed-in screen
  components/
    ui/              Button, Input, Checkbox, Badge, Tooltip, Toast
    shell/           Sidebar, TopBar, InsightsPane (AI Gap Analyzer), page-frame
    auth/ research/ summary/ report/ records/
  config/nav.ts      sidebar menu + top-bar views
  lib/
    auth/            config, session storage, service, zustand store
    data/            static clinical data (swap for API calls)
    report/          pure filter / count / geometry logic for the report
```

## Design system

All tokens live in `src/app/globals.css`. The whole product uses the Research workspace palette:

- Planes: canvas `#090A0F`, rail `#0C0E15`, panel `#0F111A`, white/8 hairlines.
- Tailwind v3's hex palette is pinned, so `indigo-600` is exactly `#4F46E5`.
- Primary actions and the active view tab are solid `bg-indigo-600 text-white` (`Button variant="primary"`).
- Status is red / amber / emerald, and is always shown with an icon and a label, never colour alone.

The report's doctor plan and follow-up checklist are saved in the browser's `localStorage` until the backend exists.
