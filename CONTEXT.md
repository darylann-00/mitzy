# Mitzy — Project Context

Read this file at the start of every session. For UI work also read `design.md`. For state/data work also read `architecture.md`.

---

## What Mitzy Is

A household management PWA. Acts as a personal secretary that already knows what needs doing — HVAC filters, car registration, kids' health visits, pet vaccines, tax deadlines, etc. The user doesn't build a list from scratch; Mitzy surfaces what's relevant right now and helps close tasks, not just track them.

**One-sentence pitch:** Mitzy is the feeling of having your life together.

**Target user:** Anyone carrying the full mental load of a household alone. Single parents especially.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| UI | React 19 (Vite) |
| State | Custom hooks + localStorage (cache/offline) + Supabase (`profiles`, `task_records`) |
| API | Vercel Edge Functions |
| AI | Claude Haiku 4.5 via `/api/assist` proxy |
| Deployment | Vercel |
| Fonts | Righteous (display/brand), DM Sans (body) |

User data is persisted in Supabase (`profiles` + `task_records`). localStorage is used as a cache/offline layer. Auth is via Supabase — Google OAuth (primary) + magic link (fallback).

---

## App Flow

```
SlimOnboarding → PrioritySetup → App (3-tab nav)
                                   ├─ HomeView
                                   ├─ AllView
                                   ├─ ProfileView
                                   └─ TaskDetailView
                                       ├─ AssistPanel → /api/assist → Claude
                                       ├─ SchedulePanel (mocked)
                                       └─ MarkDoneModal → Celebration confetti
```

---

## Navigation

Three tabs in `BottomDock` (fixed, `#E8F0EC` pill). Sparkle AI FAB sits to the right of the pill at the same level. White `+` FAB floats above nav (`bottom: 96px, right: 20px`) on Today and All tabs.

| Tab key | Icon | Label |
|---------|------|-------|
| `home`  | Yellow star SVG | Today |
| `all`   | Four status dots SVG | All |
| `you`   | Green stick figure SVG | Profile |

---

## CI

GitHub Actions at `.github/workflows/ci.yml`. Runs `npm ci`, `npm run build`, `npm test -- --watchAll=false` on push to main and all PRs.

---

## Next Priorities

1. Add `GOOGLE_PLACES_API_KEY` to Vercel env vars — Places API is wired up but key is missing; provider search is broken in prod. Enable "Places API New" in Google Cloud Console first.
2. Fill in `task.why` / `task.guidance` content — all null; UI falls back to `task.note` and generic copy.
3. Build `/api/schedule` Edge Function — Google Calendar integration UI is complete, backend stub uses `setTimeout` mock.
4. Wire up the AI FAB — sparkle button in `BottomDock` is a no-op; needs a design decision (global assist? home-screen shortcut?).
5. Replace hardcoded hazard zip ranges in `hazards.js` with FEMA API.
6. Zip error message copy in onboarding (deferred).

## Known Gaps / Mocked

| Feature | Status |
|---------|--------|
| Google Calendar integration | UI complete; `/api/schedule` not built. Simulates 600ms delay. |
| Hazard zip lookup | Hardcoded zip ranges. Replace with FEMA API. |
| `task.why` + `task.guidance` | Null for all tasks — UI falls back to `task.note` and generic copy. |
| AI FAB | Sparkle button in nav bar is a stub — `console.log('AI input')`. |
| `intervalDays` override | Lives in localStorage only — `task_records` column exists but sync not verified end-to-end. |
