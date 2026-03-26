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
| State | Custom hooks + localStorage only (no Redux/Zustand) |
| API | Vercel Edge Functions |
| AI | Claude Haiku 4.5 via `/api/assist` proxy |
| Deployment | Vercel |
| Fonts | Righteous (display/brand), DM Sans (body) |

No backend database. All user data lives in localStorage under versioned keys (`mitzy-v6`, `mitzy-pro-v6`, etc.).

---

## Project Structure

```
/src
  /components       — TaskCard, AssistPanel, SchedulePanel, MarkDoneModal, AddTaskPanel,
                      TrickleCard, HazardCard, Celebration, Sheet, BottomNav, CategoryIcons
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

- **Onboarding (fully redesigned)**
  - `SlimOnboarding`: full-screen green (Memphis scatter shapes throughout) with 3 phases:
    1. **Welcome screen** (step -1): Wordmark, tagline "Your household, handled.", privacy note, "Takes about 2 minutes."
    2. **6 question screens** with progress bar: (0) Name + age + gender (4 options: Woman/Man/Non-binary/Prefer not to say — used for health screening); (1) Own or rent (OptionBtn chips); (2) Car — cascading year/make/model dropdowns using `CAR_DATA` (25+ makes, 32 years), supports multiple vehicles, tap to edit; (3) Zip — validated against `ZIP_CODES` Set from `../data/zipCodes` + regex; (4) Kids (name+age, tap to edit, soft age>20 warning); (5) Pets (name+type+age+longCoat).
    3. **Transition screen** (`showTransition`): "Your household" summary card with checkmarks for filled sections + "Last step" card before calling `onComplete`.
  - Profile object now includes: `name`, `age`, `gender`, `hasHome`, `hasCar`, `cars` (array of `"year make model"` strings), `zip`, `hasKids`, `kids`, `hasPets`, `pets`.
  - `PrioritySetup`: 12 key tasks one at a time, green header + white card body, 2×2 fuzzy chip grid for last-done, exact date as secondary option. Completion screen calls `onComplete` after 1.8s so it renders visibly.

- **Task library** — 60+ base tasks across 6 categories (home, car, health, finance, emergency, seasonal). Dynamically extended with per-kid, per-pet, and per-hazard tasks based on profile.

- **Task status + scoring** — Each task gets status `due | coming-up | scheduled | confirm | ok | unknown` based on last-done date, interval, and window. Scored by stakes × days overdue. `unknown` = no `lastDone` set yet; these tasks are excluded from all scoring and urgency groups.

- **HomeView** — Green `AppHeader` (Memphis scatter shapes + four-dot wordmark), trickle card above tasks, `SectionLabel` + `Divider` (Memphis diamond). Sections: "Do these now" (due/confirm), "Coming up", hazard card. All-clear state when nothing urgent.

- **AllView** — Three urgency groups: Needs attention / Coming up / All good. Category filter chips (only present categories shown). Due-only toggle. `GroupDivider` (Memphis dots) between groups. Category icon tile on each card. **"X tasks to explore" section** at the bottom (collapsed by default): lists `unknown`-status tasks with chevron toggle. Each row expands accordion-style to an inline chip picker (Just recently / A few months ago / About a year ago / Not sure + exact date input). Selecting a chip writes `lastDone` directly via `markDone` and removes the task from the list immediately. Chip date mappings: 7 / 90 / 365 / 80% of `intervalDays` ago. Category filter applies to the explore section too.

- **ProfileView** — Replaced YouView. `AppHeader` with "Your household" right side. Sections with icon tiles: Home, Car, Kids, Pets, Saved providers (from providerHistory), Age/Health. Reset with confirm step.

- **TaskDetailView** — Green header with back chevron + category icon + task name in Righteous. Meta pills (due date, timeToComplete, diyable). "Why it matters" card (`task.why || task.note` fallback). "How to do it" card (parses `task.guidance` into numbered steps, fallback copy if null). Green Assist button with type-specific subtitle. Bottom row: calendar + mark as done.

- **AssistPanel** — Full-screen fixed overlay. `PulseLoader` (4 colored dots, staggered `mitzyPulse` animation). Provider mode: saved provider callout + `ProviderCard` with 4 actions (Call/Book/Website/Save) + inline save/vote flow. Script/deadline/guidance modes. Caches 7 days in localStorage.

- **MarkDoneModal + PostDoneFlow** — Multi-step: date picker → `onDone()` → celebration copy → provider question (pre-populated from assist cache) → 👍/👎 + note → saved confirmation → "Back to my list" closes modal. `getSessionProviders(taskId)` reads assist cache without new state.

- **AI Assist (working end-to-end)** — Builds prompt, POSTs to `/api/assist`, caches 7 days. Returns provider list, script, deadline, or guidance.

- **Provider history** — Caches last-used provider per task (name, rating, phone, notes).

- **Trickle questions** — Yellow card above tasks, "maybe later" dismiss, chip UI for option questions, text input for car/insurance/age questions. Answers unlock new tasks.

- **Hazard detection** — Zip code → hazard type → adds prep tasks. Runs on visit 2+.

- **CategoryIcons** — Shared SVG system: `HouseIcon`, `CarIcon`, `PersonIcon`, `CalendarIcon`, `PetIcon`, `StarIcon`, `SchoolIcon`. `CategoryTile` wraps icon in colored rounded square. Used in AllView chips, AllView card tiles, ProfileView, TaskDetailView.

- **MitzyPromptBar** — Persistent "What do you need to get done?" bar above nav. Four-dot mark + arrow button. Taps open `AddTaskPanel`.

- **Celebration animation** — 56-piece confetti burst on task completion.

---

## What's Mocked / Incomplete

| Feature | Status |
|---------|--------|
| Google Calendar integration | UI complete; `/api/schedule` Edge Function not built. Simulates 600ms delay. |
| Hazard zip lookup | Hardcoded zip ranges. Replace with FEMA API. |
| Knowledge refresh | Stubbed. |
| `task.why` + `task.guidance` fields | Null for all current tasks — UI falls back to `task.note` and generic copy. |
| Provider data | Claude-generated, no verification. |

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
                                   ├─ ProfileView         ← was YouView
                                   └─ TaskDetailView
                                       ├─ AssistPanel → /api/assist → Claude
                                       ├─ SchedulePanel (mocked)
                                       └─ MarkDoneModal → PostDoneFlow
```

---

## Navigation

Three tabs in a floating pill bar (`#E8F0EC` background). Prompt bar sits above nav on every main view. Tab keys in App.js: `home`/`all`/`you` (display labels: Today/All/Profile).

| Tab key | Icon | Label |
|---------|------|-------|
| `home`  | Yellow star SVG | Today |
| `all`   | Four status dots SVG | All |
| `you`   | Green stick figure SVG | Profile |

---

## Key Implementation Notes

- `AppHeader` is exported from `HomeView.jsx` and imported by AllView, ProfileView, TaskDetailView — single source for the green header pattern.
- `task.label` is the display name field (not `task.name`).
- `getDays(task)` returns positive = days until due, negative = days overdue. Returns `0` for unknown tasks (not meaningful; they're never passed to components that call it).
- `markDone` is now passed to `AllView` directly (in addition to `onDoneTask`) so the explore section can write `lastDone` without going through `MarkDoneModal`.
- `formatDueDate(days)` in TaskCard.jsx handles all due-date language.
- `handleMarkDone` in App.js no longer closes the modal — PostDoneFlow's "Back to my list" calls `onMarkDoneClose` which clears both `markDoneModal` and `selectedTask`.
- `YouView.jsx` still exists in the repo but is unused — `ProfileView.jsx` is the active file.

---

## Where We Are

Full visual redesign from `MITZY_DESIGN_SPEC_FINAL.md` implemented and building cleanly as of 2026-03-26. All screens complete: Onboarding, HomeView, AllView, ProfileView, TaskDetailView, AssistPanel, MarkDoneModal/PostDoneFlow. Unknown-task explore flow added to AllView. Next meaningful work areas: fill in `task.why`/`task.guidance` content, build `/api/schedule` Edge Function, replace hardcoded hazard zip ranges.

### Recent changes (2026-03-26)
- **SlimOnboarding empty-state fix**: Car, kids, and pets screens now show a selected "No cars/kids/pets added" chip (using `OptionBtn selected` style) when there are no committed entries. Chip disappears when an entry is added; reappears if all entries are removed. "+ Add a vehicle/kid/pet" button replaces "+ Add another..." when the list is empty.
- **No-flash fix**: "No" buttons on car/kids now batch `setProfile` + `setStep` in the same event (no `setTimeout`), eliminating the chip flash before navigating. Pets "No" now advances directly to the transition screen instead of staying on step 5.
- **Transition screen back button**: Added `← Back` footer button matching the question-screen style; sets `showTransition(false)` to return to step 5.
- **PrioritySetup date picker fix**: Removed auto-advance-on-change (which fired on month-navigation arrows). Now uses `onBlur` to advance — fires when the picker closes after a real date selection, not during month navigation.
