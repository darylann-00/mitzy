# Mitzy — Project Context

Use this file to get up to speed at the start of a session.

---

## What Mitzy Is

A household management PWA. Acts as a personal secretary that already knows what needs doing — HVAC filters, car registration, kids' health visits, pet vaccines, tax deadlines, etc. The user doesn't build a list from scratch; Mitzy surfaces what's relevant right now and helps close tasks, not just track them.

**One-sentence pitch:** Mitzy is the feeling of having your life together.

**Target user:** Anyone carrying the full mental load of a household alone. Single parents especially.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| UI | React 19 (Create React App) |
| State | Custom hooks + localStorage (cache/offline) + Supabase (`profiles`, `task_records`) |
| API | Vercel Edge Functions |
| AI | Claude Haiku 4.5 via `/api/assist` proxy |
| Deployment | Vercel |
| Fonts | Righteous (display/brand), DM Sans (body) |

User data is persisted in Supabase (`profiles` + `task_records` tables). localStorage is used as a cache/offline layer. Auth is via Supabase — Google OAuth (primary) + magic link (fallback).

---

## Project Structure

```
/src
  /components       — TaskCard, AssistPanel, SchedulePanel, MarkDoneModal, AddTaskPanel,
                      TrickleCard, HazardCard, Celebration, Sheet, CategoryIcons
  /views            — HomeView, AllView, ProfileView, TaskDetailView
  /data             — constants.js, tasks.js, taskFactory.js
  /hooks            — useProfile, useTasks, useSession, useProviders
  /utils            — storage.js, taskLogic.js, assistPrompt.js, hazards.js, climateRegion.js
  /onboarding       — SlimOnboarding, PrioritySetup
  /styles/app.css   — Full design system
/api
  assist.js         — Vercel Edge Function → Anthropic API proxy
  providers.js      — Vercel Edge Function → Google Places + Claude synthesis
```

---

## What's Built and Working

- **Onboarding** — `SlimOnboarding`: full-screen green, 3 phases: welcome → 6 question screens (name/age/gender, own/rent, cars, zip, kids, pets) → transition summary. `PrioritySetup`: 12 key tasks, slide transitions, full green screen. Recurring tasks show fuzzy time chips + date picker; one-time tasks show "Have you done this? Yes / Not yet".

- **Task library** — 60+ base tasks across 6 categories (home, car, health, finance, emergency, seasonal). Dynamically extended with per-car, per-kid, per-pet, and per-hazard tasks based on profile.

- **Task status + scoring** — Each task gets status `due | needed | coming-up | scheduled | confirm | ok | unknown` based on last-done date, interval, and window. Scored by stakes × days overdue. `unknown` = no `lastDone` set yet; excluded from scoring. `needed` = one-time task confirmed not done; orange bar, no date text, high priority score.

- **HomeView** — Personal greeting header (`HomeHeader`), "Focus for today" section (top 3 scored tasks), trickle card, hazard card, all-clear state. `paddingBottom: 160px` to clear FABs + nav.

- **AllView** — Three urgency groups. Category filter chips. Due-only toggle. `GroupDivider` between groups. Category icon tile on each card. "X tasks to explore" accordion section at bottom for `unknown`-status tasks with inline chip picker. `paddingBottom: 160px`.

- **ProfileView** — Sections: Home, Car, Kids, Pets, Saved providers, Birth year/Health. Account section shows signed-in email + logout button. Reset deletes Supabase rows + clears localStorage.

- **TaskDetailView** — Green header, meta pills, "Why it matters" + "How to do it" cards, Assist button, calendar + mark done.

- **AssistPanel** — Full-screen overlay. Provider/script/deadline/guidance/guidance_companies modes. Caches 7 days (currently v12). Provider mode passes `task.searchQuery` (if set) to `/api/providers` so Places queries are task-appropriate rather than using the raw label. Provider cards show condensed weekly hours (Claude-formatted from Places `weekdayDescriptions`), review count under star rating, address links to Google Maps, blurbs with **bold** key phrases. `guidance_companies` mode returns JSON with guidance markdown + top 3 national companies (no aggregators); renders `MarkdownBlock` + `CompanyCard` rows with external link icon. `MarkdownBlock` handles ##headers, bullets, numbered lists with nested sub-bullets, tables, horizontal rules, bold, and auto-linked URLs.

- **MarkDoneModal** — Date picker pre-filled today (hidden for one-time tasks). Closes immediately on done; confetti fires via `Celebration` separately.

- **AI Assist** — End-to-end: prompt → `/api/assist` → Claude → cached response.

- **Trickle questions** — Yellow card, chip/text UI, answers unlock new tasks. One-time tasks show "Have you done this? / Yes / Not yet"; "Not yet" marks `needed` (task surfaces as orange in list, no date).

- **Hazard detection** — Zip → hazard type → prep tasks. Runs on visit 2+.

- **Bottom dock** — Fixed nav: `[Today|All|Profile]` pill + sparkle AI FAB circle to the right (always visible, `console.log` stub). White `+` add FAB floats above nav on Today and All tabs.

---

## What's Mocked / Incomplete

| Feature | Status |
|---------|--------|
| Google Calendar integration | UI complete; `/api/schedule` Edge Function not built. Simulates 600ms delay. |
| Hazard zip lookup | Hardcoded zip ranges. Replace with FEMA API. |
| Knowledge refresh | Stubbed. |
| `task.why` + `task.guidance` fields | Null for all current tasks — UI falls back to `task.note` and generic copy. |
| Provider data | Claude-generated, no verification. |
| AI FAB | Sparkle button in nav bar is a stub — `console.log('AI input')`. |

---

## Design System

### Colors
```js
C.brand       = '#1A5C3A'  // deep emerald — header, nav, primary buttons
C.brandDark   = '#0F3D27'  // darker emerald — shapes, pressed states
C.brandLight  = '#E8F5EE'  // pale emerald — text on brand
C.brandTint   = '#E8F0EC'  // nav bar background
C.red         = '#D62828'  // due now
C.orange      = '#F77F00'  // coming up, action buttons
C.green       = '#06A77D'  // done
C.yellow      = '#F4C430'  // trickle, scheduled
C.ink         = '#1C2B22'  // primary text
C.muted       = '#4A6256'  // secondary text
C.bg          = '#FDFAF2'  // warm off-white background
C.card        = '#FFFFFF'  // task card background
C.cardBorder  = '#EAE4DA'  // task card border
```

### Typography
- **Righteous** (Google Fonts) — display. Wordmark, section labels, headings, task names.
- **DM Sans** (Google Fonts) — body. Everything else.

### Logo
Four-dot 2×2 grid (red/orange/green/yellow) + "mitzy" in Righteous. App icon: four dots on dark green rounded square.

### Memphis decorative elements
- Header: scatter shapes (circles, diamonds, rings) at ~20% opacity
- Dividers: small circle + diamond + circle between sections
- Group dividers in AllView: same pattern flanked by `#EAE4DA` lines

---

## Language Rules

| Don't say | Say instead |
|-----------|-------------|
| Urgent | (omit) |
| Overdue | due X days ago |
| Skip | maybe later |
| Help me | Let's do it |
| You / You view | Profile |

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

## Key Implementation Notes

- `AppHeader` is exported from `HomeView.jsx` and imported by AllView, ProfileView, TaskDetailView. `HomeHeader` (greeting variant) is used only in HomeView.
- `task.label` is the display name field (not `task.name`).
- `getDays(task)` returns positive = days until due, negative = days overdue. Returns `0` for unknown tasks.
- `formatDueDate(days)` in TaskCard.jsx: `days < -14` → "Hasn't been done in a while"; `-14 ≤ days < 0` → "due X days ago". `subtitle` prop on TaskCard overrides this if provided.
- `markDone` and `markNeeded` are passed to `AllView` so the explore section can write state without going through `MarkDoneModal`. One-time tasks in the explore section show "Have you done this?" instead of time chips.
- `TaskAnswerChips` (`src/components/TaskAnswerChips.jsx`) is a shared component used by TrickleCard, PrioritySetup, and AllView's ExploreSection. It handles recurring vs one-time branching, chip constants, and date conversion internally.
- `handleMarkDone` in App.js calls `markDone`, fires `setCelebration(true)`, immediately calls `setMarkDoneModal(null)` — modal closes on done, confetti fires separately.
- `focusTasks` and `doneThisWeek` are computed in App.js and passed to HomeView. `focusTasks` = top 3 scored non-ok/unknown tasks.
- Task dependencies: `dependsOn: "parent-id"` hides a task until the parent has `lastDone` set. Enforced via `isDependencySatisfied()` in `activeTasks` filter. Dependency-gated tasks are also hidden during PrioritySetup.
- Per-car tasks are generated by `carTasks(carString)` in `taskFactory.js`. EV detection skips oil/transmission/emissions tasks and adds EV battery check.
- `task.searchQuery` — optional field on tasks with `assistType: "providers"`. When set, sent to `/api/providers` and used as the Google Places text query instead of `task.label`. Critical for auto-generated tasks like `"Max: vet wellness visit"` (searchQuery: `"dog veterinary clinic"`) and `"Civic: oil change"` (searchQuery: `"oil change"`).
- `isWindowActive(task, region)` in `taskLogic.js` — `region` comes from `getClimateRegion(zip)` in `climateRegion.js`. `REGION_TASK_ADJUSTMENTS` maps `region → task.id → { seasonStart, activeMonths }` overrides. `seasonStart: false` or `activeMonths: []` disables a task for that region.
- `YouView.jsx` exists in the repo but is unused — `ProfileView.jsx` is the active file.

---

## CI

GitHub Actions workflow at `.github/workflows/ci.yml`. Runs `npm ci`, `npm run build`, and `npm test -- --watchAll=false` on push to main and all PRs. `gh` token requires `repo` and `read:org` scopes for Claude Code's CI monitoring panel to work.

## Where We Are

All screens built and working. A security/reliability audit was completed and all critical/high issues are resolved (see below).

**Next feature work (in priority order):**
1. Add `GOOGLE_PLACES_API_KEY` to Vercel env vars — Places API is wired up but key is missing; provider search is broken in prod. Enable "Places API New" in Google Cloud Console first.
2. Fill in `task.why` / `task.guidance` content — all null; UI falls back to `task.note` and generic copy.
3. Build `/api/schedule` Edge Function — Google Calendar integration UI is complete, backend stub at `SchedulePanel.jsx` uses `setTimeout` mock.
4. Wire up the AI FAB — sparkle button in `BottomDock` is a no-op; needs a design decision (global assist? home-screen shortcut?).
5. Replace hardcoded hazard zip ranges in `hazards.js` with FEMA API.
6. Context API refactor — extract task/profile state from `App.js` into `TaskContext`/`ProfileContext` before adding AI FAB (prop drilling is at its limit).

**Security/reliability fixes applied:**
- `useTasks` + `useProfile`: Supabase migration upsert now checks for errors; `markDone`/`markScheduled`/`markNotApplicable`/`updateProfile` roll back local state on failed upsert. Both hooks return `loading` + `syncError`.
- CORS: removed wildcard `*` from `/api/assist` and `/api/providers`. Now origin-allowlisted via `ALLOWED_ORIGIN` env var (set to `https://mitzy.io` in Vercel production).
- `AssistPanel`: `inlineMarkdown` escapes `<`/`>` before applying bold/link transforms — blocks HTML injection from Claude output.
- `App.js`: `handleReset` checks Supabase delete errors before clearing localStorage. Derived task lists (`visibleTasks`, `scoredDue`, `focusTasks`, `doneThisWeek`) wrapped in `useMemo`.
- `useSession`: added `.catch()` to `detectHazards` promise.
- `storage.js`: `cleanupOldKeys()` removes orphaned `mitzy-*` keys from old schema versions, called on startup in `index.js`.
- Deleted unused `YouView.jsx`.

**Task intervals** — All intervals in `src/data/tasks.js` have been audited against standard safety guidance. Three were corrected to monthly (30d): `hm-smoke` (NFPA 72), `hm-fire` (NFPA 10 §7.2.1), `hm-gfci` (UL/manufacturer standards). All others are correct.

**Prescription trickle flow** — `h-scrip` gates behind "Do you take regular prescriptions?" (yes/no). Yes leads to "How often?" — Monthly (30d) / Every 3 months (90d) / It varies (45d) — which sets a per-user `intervalDays` override stored in `taskState`. No marks the task `notApplicable`. `taskStatus`, `taskScore`, `nextDueStr`, `getDays`, `getNext`, `getScore` all prefer `taskState[id].intervalDays` over the task-level default when present. The `trickleSteps` field on a task definition triggers `SteppedFlow` in `TrickleCard`; other tasks are unaffected. `intervalDays` override lives in localStorage only — Supabase `task_records` doesn't have this column yet.

**Per-task frequency override** — Frequency pill in `TaskDetailView` is tappable. Opens an inline picker with preset chips (up to 4 below default + default, generated from `FREQ_CANDIDATES`) plus a Custom option (number + days/months/years dropdown). Chips never suggest intervals longer than the recommended default — Custom is the only path to go longer. Selecting any option saves to `taskState[id].intervalDays` via `setIntervalOverride` in `useTasks`. A yellow warning banner shows persistently below the dates card when `effectiveInterval > task.intervalDays` (user is going less frequent than default). Frequency pill text turns green when an override is active. `effectiveInterval = entry?.intervalDays ?? task.intervalDays` drives all display. Override is localStorage only.

**Birth year instead of age** — Profile stores `birthYear` (4-digit year) instead of raw age for the user, kids, and pets. Age is calculated at runtime via `getAge(birthYear) = currentYear - birthYear` in `taskFactory.js` and `assistPrompt.js`. Onboarding inputs ask "Birth year (e.g. 1988)" with appropriate min/max. Display shows "born XXXX" in kid/pet lists. Supabase `profiles` table `age` column is reused (no migration needed — value stored is now a year integer). `PROFILE_KEY` bumped to `mitzy-pro-v7`. `TaskDetailView` also got UX fixes: click-outside closes the date picker, frequency picker has a close button, toggle clicks use `setX(true)` directly instead of `setX(v => !v)`.

**Trickle rotation queue** — Trickle card now shows on a 5-day time-driven cadence (was once per calendar day). A persistent rotation queue (`TRICKLE_QUEUE_KEY = "mitzy-tq-v6"`) cycles through all unknown tasks in priority order; answered tasks fall off naturally, dismissed/ignored tasks stay in rotation. Clock starts when a card is surfaced — dismiss/answer/ignore all behave identically for cadence purposes. `dismissTrickle` and `answerTrickle` now just hide the card; date + queue are saved at surfacing time.

**AllView filter persistence** — `activeCategory` and `dueOnly` lifted from AllView local state to App.js. Filters survive tab switches (Today → Profile → All retains the selected category and toggle state).

**"Recently" chip clarity** — Label changed from `'Recently'` to `'Recently (last month)'` in `CHIPS_GENERAL` (`TaskAnswerChips.jsx`) to eliminate ambiguity about the 30-day mapping.
