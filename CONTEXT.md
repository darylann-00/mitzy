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
  /utils            — storage.js, taskLogic.js, assistPrompt.js, hazards.js
  /onboarding       — SlimOnboarding, PrioritySetup
  /styles/app.css   — Full design system
/api
  assist.js         — Vercel Edge Function → Anthropic API proxy
```

---

## What's Built and Working

- **Onboarding** — `SlimOnboarding`: full-screen green, 3 phases: welcome → 6 question screens (name/age/gender, own/rent, cars, zip, kids, pets) → transition summary. `PrioritySetup`: 12 key tasks, slide transitions, full green screen. Recurring tasks show fuzzy time chips + date picker; one-time tasks show "Have you done this? Yes / Not yet".

- **Task library** — 60+ base tasks across 6 categories (home, car, health, finance, emergency, seasonal). Dynamically extended with per-car, per-kid, per-pet, and per-hazard tasks based on profile.

- **Task status + scoring** — Each task gets status `due | needed | coming-up | scheduled | confirm | ok | unknown` based on last-done date, interval, and window. Scored by stakes × days overdue. `unknown` = no `lastDone` set yet; excluded from scoring. `needed` = one-time task confirmed not done; orange bar, no date text, high priority score.

- **HomeView** — Personal greeting header (`HomeHeader`), "Focus for today" section (top 3 scored tasks), trickle card, hazard card, all-clear state. `paddingBottom: 160px` to clear FABs + nav.

- **AllView** — Three urgency groups. Category filter chips. Due-only toggle. `GroupDivider` between groups. Category icon tile on each card. "X tasks to explore" accordion section at bottom for `unknown`-status tasks with inline chip picker. `paddingBottom: 160px`.

- **ProfileView** — Sections: Home, Car, Kids, Pets, Saved providers, Age/Health. Account section shows signed-in email + logout button. Reset deletes Supabase rows + clears localStorage.

- **TaskDetailView** — Green header, meta pills, "Why it matters" + "How to do it" cards, Assist button, calendar + mark done.

- **AssistPanel** — Full-screen overlay. Provider/script/deadline/guidance modes. Caches 7 days.

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
- `YouView.jsx` exists in the repo but is unused — `ProfileView.jsx` is the active file.

---

## Where We Are

All screens built and working as of 2026-03-30. Next meaningful work: add `GOOGLE_PLACES_API_KEY` to Vercel env vars (Places API New must be enabled in Google Cloud), fill in `task.why`/`task.guidance` content, build `/api/schedule` Edge Function, wire up the AI FAB, replace hardcoded hazard zip ranges.

**2026-03-30:** Built real provider lookup. New `/api/providers.js` Edge Function: calls Google Places Text Search (New API) for real businesses, passes results to Claude Haiku for task-relevant synthesis (blurb per provider grounded in actual reviews). `AssistPanel` now calls `/api/providers` for `assistType === "providers"` instead of `/api/assist`. Provider cards updated to show `reviewCount`, `openNow` status, and `address`. Requires `GOOGLE_PLACES_API_KEY` env var in Vercel.

**2026-03-30:** `TaskDetailView` now shows a "Relevant dates" card (last done / frequency / due next) with inline date editing — tapping "Last done" reveals a date input that calls `onMarkDone` on blur. Date picker saves on blur (not onChange) to avoid premature close mid-edit. All text in the tiles uses `whiteSpace: 'nowrap'` + `flex: '1 1 0'` so dates never wrap on iPhone. Header meta pills (due date, time estimate, DIY) removed from task detail — info lives in the Relevant dates card instead. `isActiveMonth` renamed to `isWindowActive` with new `seasonStart` support for tasks that wake up at a month and stay visible until done (e.g. taxes use `seasonStart: 2` instead of `activeMonths`). Fixed `markDone` date parsing in `useTasks.js` to avoid timezone shift on date strings.

**2026-03-30 (seasonal overhaul):** Audited all tasks with `activeMonths` and reclassified using two explicit patterns: `activeMonths` (hard window — hide when season ends even if undone; e.g. health insurance enrollment, ceiling fans, winter prep) vs `seasonStart` (sticky — wake up at month N, stay visible until done; e.g. taxes, furnace, pest control, chimney, roof, flu shot, flood/fire/hurricane prep). Extended several `activeMonths` windows that were too narrow (`hm-faucets` [10,11] → [9–2], winter emergency tasks extended through Jan/Feb). Next: zip-based climate region adjustment so `seasonStart`/`activeMonths` reflect local climate rather than a generic US default (prompt written, ready for new agent).

**2026-03-29:** Fixed "Never / not sure" chip behavior. Previously it set `lastDone` to 730 days ago; now it calls `onNeeded()` instead. `taskLogic.js` updated to return `"due"` for recurring tasks with `entry.needed === true` and no `lastDone`. This ensures "I don't know when I last did this" always surfaces the task as due, not OK.
