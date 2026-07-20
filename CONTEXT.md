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
| State | Custom hooks + localStorage (cache/offline) + Supabase (`profiles`, `task_records` incl. `snoozed_until`, `custom_tasks`) |
| API | Vercel Functions |
| AI | Claude Haiku 4.5 via `/api/assist` + `/api/generate-task` |
| Deployment | Vercel |
| Fonts | Righteous (display/brand), DM Sans (body) |

User data is persisted in Supabase (`profiles` + `task_records` + `custom_tasks`). localStorage is used as a cache/offline layer. Auth is via Supabase — Google OAuth (primary) + magic link (fallback).

Supabase project: `https://uftxbegrnlvlgkbitibp.supabase.co` (production). All testing (Playwright e2e) runs against prod or Vercel preview environments.

---

## What's Built and Working

- **Onboarding** — `SlimOnboarding`: full-screen green, 3 phases: welcome → 8 question screens (name/age/gender, own/rent, cars, zip, kids, pets, Google Calendar, capacity/bandwidth) → transition summary. `PrioritySetup`: up to 12 key tasks, slide transitions, full green screen. `selectPriorityTasks()` picks the set: if the profile has kids, every kid's priority task (annual health visit) is guaranteed a slot and pet priority tasks are excluded entirely; if there are pets but no kids, every pet's priority task (vet visit) is guaranteed instead; remaining slots fill from generic (home/car/finance/etc.) priority tasks in library order. Kids and pets are never asked about as a partial subset. Recurring tasks show fuzzy time chips + a collapsed "pick an exact date" toggle (calendar icon, label color matches the label style passed in) that expands `MonthCalendar` on tap; one-time tasks show "Have you done this? Yes / Not yet".

- **Task library** — 60+ base tasks across 6 categories (home, car, health, finance, emergency, seasonal). Dynamically extended with per-car, per-kid, per-pet, and per-hazard tasks based on profile.

- **Task status + scoring** — Each task gets status `due | needed | coming-up | scheduled | confirm | ok | unknown | snoozed` based on last-done date, interval, and window. Scored by stakes × days overdue. `unknown` = no `lastDone` set yet; excluded from scoring. `needed` = one-time task confirmed not done; orange bar, no date text, high priority score. `snoozed` = consciously deferred until a future date; score 0, hidden from focus. `coming-up` threshold is `task.reminderLeadDays ?? task.windowDays` (one-time tasks fall back to 7 if both are null) — `reminderLeadDays` is set higher than `windowDays` on tasks that require booking an appointment, so scheduling-heavy tasks (vet visits, pediatrician, dentist, specialist trades) surface earlier than simple due-soon tasks. Tested in `src/utils/taskLogic.test.js`.

- **Snooze (Zeigarnik relief)** — Swipe a task card left to snooze it until a chosen date. Consciously deferring a task relieves cognitive load (Zeigarnik effect). Touch-only swipe gesture (80px threshold) reveals a periwinkle blue (#6B8DD6) strip with closed-eye icon behind the card. Releasing past threshold opens SnoozePicker bottom sheet with presets (Next week, Next month, In 3 months, Pick a date). Snoozed tasks get score 0 and are hidden from focus. AllView shows a collapsible "X snoozed" section (collapsed by default) with "Wake up" button on each card. TaskDetailView shows a blue "Snoozed until [date]" chip with "Wake up early" button. First-use tooltip appears above focus tasks (gated by localStorage `mitzy-snztip-v1`). Data: `snoozed_until` DATE column on `task_records`, separate from `scheduled_date`. Expired snoozes (date ≤ today) fall through to normal status.

- **HomeView** — Personal greeting header (`HomeHeader`). Nudge cards (life event, weekly check-in, trickle, capacity, hazard) all compete for the same top-of-screen slot; they're ranked by a fixed priority — life event > weekly check-in > trickle > capacity > hazard — and only the top 2 eligible ones render per visit, stacked above the task list. The rest stay hidden until a later visit once higher-priority ones are dismissed or actioned. First-use `SnoozeTooltip` (swipe-to-snooze tip) is exempt from this cap — it's informational only and shows once per user. Below the nudges, two rendering modes: **plan mode** (when a weekly plan is confirmed) shows a progress bar (with an "Adjust plan" link that reopens the check-in until the plan is complete), scheduled tasks grouped by day, unscheduled tasks in a "This week" bucket, and a "Done" section — completing a task leaves an empty slot with no backfill. Tasks whose due date falls strictly after the plan's `confirmed_at` (i.e. they became due mid-week; `becameDueAfterPlan` in `taskLogic.js`) and aren't in the plan surface as one quiet "X things came up this week — take a look" line (links to AllView) — tasks already due at planning time were offered as suggestions and deliberately left out, so they never count. The progress card also shows the week's date range (`weekRangeLabel`). **Live mode** (default, no plan) shows Today section (top scored task) + This week section (remaining), plus an all-clear state when empty. Focus task count calibrated by capacity setting: low=1, normal=3, high=5. `paddingBottom: 160px` to clear FABs + nav.

- **Weekly check-in** — Optional weekly planning flow. A nudge card appears on HomeView on the first app visit of a new week (persists until dismissed or completed). Fresh check-ins started Mon–Thu plan the current week; Fri–Sun they plan the upcoming week (`getPlanningWeekStart`; nudge and header copy switch to "next week"). A current-week plan always governs plan mode through Sunday; a plan confirmed early for the upcoming week takes over only when no current-week plan exists. "Adjust plan" always edits the active plan's own week. Plan completions count from `planFloor` = min(week start, confirmation day), so weekend head-starts on a next-week plan register. Tapping "Let's do it" opens `WeeklyCheckIn` full-screen overlay with two steps: (1) read-only list of custom tasks already due/coming-up this week + free-text brain dump input ("Tell Mitzy what else is happening this week"), (2) unified review screen — custom tasks (toggle on/off without losing their place in the list), matched tasks from the brain dump (via `/api/weekly-checkin` Claude Haiku matching; "Not what I meant" converts a match into a separate task using the API's cleaned-up `mentionLabel` and parsed `scheduledDate`, never the raw snippet), brain-dump tasks with inline category/frequency editors, and an always-visible "Mitzy suggestions" tray (gap-fill + top priority tasks, no longer collapsible). Brain-dump tasks are built locally on review and only persisted to `custom_tasks` (one `addCustomTasksBulk` batch) on "Lock in my week" — backing out or unchecking one never leaves stray tasks. The user's `capacity` is sent to the API and sizes only the gap-fill suggestions (Mitzy's additions on top); it never limits the user's own custom/matched/brain-dump tasks. Every task category is shown with its `CategoryTile` icon, not a color dot. Every task in the plan shows its due date and that date is editable inline (tap to open a calendar picker) regardless of whether it came from a calendar match or the task's own computed due date. "Lock in my week" confirms the plan, freezing it for the week; a failed save shows an inline error and keeps the review screen open. Both check-in headers and the plan-mode progress card show the week's date range (`weekRangeLabel(weekStart)`, e.g. "Jul 13 – Jul 19") so it's always clear which week is being planned. Once confirmed, an "Adjust plan" link on the plan-mode progress card reopens the check-in seeded with the confirmed plan (header reads "Adjust your week"; carried-over tasks render as toggleable rows; completed ones stay in the plan for progress but don't re-render). Snoozing a task also removes it from the active plan (`removeFromPlan`). Data: `weekly_plans` Supabase table with `task_ids` (JSONB array), `scheduled_dates` (JSONB object), `confirmed_at`. Hook: `useWeeklyPlan` in `TaskContext`. All week-start/due-date strings are formatted in local time via `toLocalISO` (never `toISOString`, which drifted a day for US-evening users). Nudge dismissal tracked in localStorage (`mitzy-wcn-v1`). When user mentions a day-of-week for a task ("vet Thursday"), Claude converts it to an ISO date and the task shows under a day header in plan mode.

- **Capacity / Bandwidth** — Profile field `capacity` (`low | normal | high`, default `normal`). Set during onboarding step 8, toggleable in Profile > Account > "My bandwidth". Controls `homeTasks` slice count in `TaskContext` via `CAPACITY_FOCUS_COUNT`, and caps how many gap-fill suggestions the weekly check-in adds on top of the user's own tasks (never the user's own tasks themselves). Smart nudge (`useCapacityNudge`) tracks weekly stats in localStorage (`mitzy-cs-v1`); after 2+ weeks, suggests dialing up if user clears everything or down if barely completing. Nudge dismisses for 3 weeks. Supabase column: `profiles.capacity TEXT`.

- **AllView** — Three urgency groups (swipeable cards). Category filter chips. Due-only toggle. `GroupDivider` between groups. Category icon tile on each card. Collapsible "Snoozed" section between "All good" and "Explore". "X tasks to explore" accordion section at bottom for `unknown`-status tasks with inline chip picker. `paddingBottom: 160px`.

- **ProfileView** — Sections: Home, Car, Kids, Pets, Health, Saved providers, Account. Health section shows/edits: Name, Birth year, Gender, Insurance provider. Gender chips match onboarding style; "prefer not to say" is hidden in view mode. Account section shows signed-in email + logout button. Reset deletes Supabase rows + clears localStorage.

- **TaskDetailView** — Green header, meta pills, "Why it matters" + "How to do it" cards, Assist button, calendar + mark done. Shows yellow "Scheduled: [date]" chip when a task has a scheduled date.

- **Google Calendar matching (Phase 1 + 2)** — On sign-in, silently requests `calendar.events` OAuth scope via Google Identity Services (GIS). Fetches the user's upcoming calendar events via `/api/calendar-events`, then runs a Claude Haiku match against active tasks via `/api/calendar-match`. When a match is found (confidence ≥ threshold), an inline yellow confirmation chip appears on the task card: "📅 Found: [event title] — yours?" with Yes / Not mine buttons. Confirming saves `scheduled_date` to `task_records` in Supabase and shows a yellow scheduled chip on the card. Dismissing removes the chip for the session. Handled task IDs are tracked in a ref so the pipeline (which re-runs on task state changes) never re-surfaces confirmed or dismissed matches. All calendar features are non-blocking — if OAuth is denied or any API call fails, the app continues silently. `window.__MITZY_FAKE_CAL_TOKEN__` test hook short-circuits GIS for Playwright tests.

- **AssistPanel** — Full-screen overlay. Provider/script/deadline/guidance/guidance_companies modes. Caches 7 days (currently v12). Provider mode passes `task.searchQuery` (if set) to `/api/providers` so Places queries are task-appropriate rather than using the raw label. Provider cards show condensed weekly hours (Claude-formatted from Places `weekdayDescriptions`), review count under star rating, address links to Google Maps, blurbs with **bold** key phrases. `guidance_companies` mode returns JSON with guidance markdown + top 3 national companies (no aggregators); renders `renderMarkdown` + `CompanyCard` rows with external link icon. `renderMarkdown` handles ##headers, bullets, numbered lists with nested sub-bullets, tables, horizontal rules, bold, and auto-linked URLs. `PulseLoader` cycles through 3 contextual messages per `assistType` every 2.5s; providers uses `task.searchQuery || task.label` for specificity.

- **MarkDoneModal** — Custom `MonthCalendar` (in-React date picker) pre-filled today (hidden for one-time tasks). Closes immediately on done; confetti fires via `Celebration` separately. Replaces native `<input type="date">` to fix month-arrow-click close bug on Chrome/Mac.

- **AI Assist** — End-to-end: prompt → `/api/assist` → Claude → cached response.

- **Trickle questions** — Yellow card, chip/text UI, answers unlock new tasks. One-time tasks show "Have you done this? / Yes / Not yet"; "Not yet" marks `needed` (task surfaces as orange in list, no date).

- **Life events** — Contextual task bundles triggered by major life changes. v1 ships "New baby" (`src/data/lifeEvents/newBaby.js`). `useLifeEvents` hook manages event state in Supabase (`life_events` + `custom_tasks`). `LifeEventNudge` yellow card appears on HomeView in two variants: "discovery" (introduces the feature) and "wrapup" (fires when all tasks for an active event are complete). `LifeEventIntake` collects event-specific details via `GuidedSteps` multi-step form, then generates one-time custom tasks scoped to that event instance. Tasks are ID-prefixed (`lf-{type}-{id}-{taskId}`) so multiple instances don't collide. Event definitions registered in `src/data/lifeEvents/index.js`; new event types add their own task generator to `TASK_GENERATORS` in `useLifeEvents`.

- **Hazard detection** — Zip → static FEMA NRI dataset → hazard type → prep tasks. FEMA retired the live per-zip NRI API, so risk data is pre-processed by `scripts/build-hazard-data.mjs` (run manually whenever FEMA publishes a new NRI vintage, roughly annual) into `public/data/zip-to-fips.json` (Census ZCTA→county crosswalk) and `public/data/nri-county-risk.json` (county FIPS → per-hazard rating), fetched same-origin at runtime in `hazards.js`. Falls back to `["winter"]` if the zip is invalid or the data fails to load (logged via `console.warn`). Runs on visit 2+.

- **Bottom dock** — Fixed nav: `[Today|All|Profile]` pill + sparkle FAB circle to the right (always visible). Single entry point for adding tasks (no separate white `+` FAB).

- **Task Creator** — Sparkle FAB opens `TaskCreator` full-screen overlay with two modes: "Mitzy magic" (AI, default) and "Do it myself" (manual), switched via a light segmented control (surface-colored track, white active thumb) at the top of the body. AI mode: brain-dump card (Righteous "Brain dump" micro-label, borderless textarea, brand focus ring, helper footer, tappable example chips below) → `/api/generate-task` (Haiku 4.5) auto-detects one vs many tasks. Single task → `TaskConfirmCard` review. Multiple tasks → `BrainDumpReview` compact checklist (checkbox, `CategoryTile` icon, label, frequency + category text, tap-to-edit via `TaskConfirmCard` with custom button labels). Batch save calls `addCustomTasksBulk`. Manual mode: white-card form (Task / Category / How often / How important) matching `TaskConfirmCard` styling — `CategoryTile` category buttons incl. the custom-task-only "Other" category (four-dot logo icon; in `CAT_META`, `CAT_ICON_CONFIG`, AllView chips, and the AI cat enum), shared `FrequencyPicker` with weekly→yearly presets + custom every-N-days/months/years + one-time toggle, low/medium/high stakes chips, no API call. Feature test: `tests/e2e/task_creator.spec.js` (manual-mode save, fully mocked Supabase writes). AI features: assumption chips cycle on tap and re-fire the API (debounced 400ms, AbortController cancels in-flight). T2 tasks show a silent DIY toggle. T3 locked. T4 (crisis) shows refusal + hotline. T0 (parse failure) shows manual fallback. Prompt limit 2000 chars, max_tokens 4000. Rate limited at 20 req/hr per user (`rl:gentask` prefix in Upstash). `useProfile` exposes `addCustomTask`, `addCustomTasksBulk`, and `removeCustomTask`.

- **Auth UX** — Supabase Google OAuth (primary) + magic link (fallback). `BrandSplash` (full green background + Memphis shapes + four-dot wordmark) renders during `authLoading` to avoid flash-of-white on PWA cold launches. `LoginGate` normalizes magic-link emails (`trim().toLowerCase()`) at submit so case/whitespace variants resolve to one Supabase auth record. Success screen has a "Resend" button gated by a 30s cooldown (`RESEND_COOLDOWN_MS`) — cooldown starts on first send; restarts on each successful resend; re-enables immediately on error.

- **Welcome gate (returning vs new)** — `WelcomeGate` is the first screen on cold launch (before `SlimOnboarding`). Two buttons: "I'm new here" or "I've used Mitzy before". Choice persisted to `WELCOME_CHOICE_KEY` (`mitzy-welcome-v1`). `'returning'` skips onboarding and goes straight to `LoginGate` → server profile loads from Supabase into local state. `'new'` keeps the original onboarding → priority-setup → login flow. If a returning user signs in with no server profile (typo, wrong account), `App.js` flips them to `'new'` and routes through onboarding. Welcome key is included in `USER_KEYS`, so reset/sign-out clears it.

- **Profile conflict modal** — `useProfile` is now server-first. When a user signs in, the hook fetches the Supabase profile before any upsert. If the server has a meaningful profile (name or zip set) AND the user picked `'new'` AND local has fields the server doesn't, `pendingConflict` is set and `<ProfileConflictModal>` overlays the app. Options: "Use my saved setup" (loads server, discards local) or "Replace with new setup" (requires explicit "Yes, replace" confirm before the upsert overwrites the server). Closes the prior silent-overwrite bug where local onboarding data clobbered an existing server profile on sign-in.

---

## What's Mocked / Incomplete

| Feature | Status |
|---------|--------|
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
C.surface     = '#F0EDE4'  // raised surface / divider background
```

Snooze uses `#6B8DD6` (periwinkle blue) directly in components — not a named constant.

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
WelcomeGate → (new) SlimOnboarding → PrioritySetup → LoginGate → App (3-tab nav)
            → (returning) LoginGate → App
                                   ├─ HomeView
                                   ├─ AllView
                                   ├─ ProfileView
                                   ├─ TaskDetailView
                                   │   ├─ AssistPanel → /api/assist → Claude
                                   │   ├─ ScheduleSurface → /api/schedule
                                   │   └─ MarkDoneModal → Celebration confetti
                                   └─ TaskCreator → /api/generate-task → Claude → custom_tasks
                                       ├─ Single task → TaskConfirmCard
                                       └─ Multi-task → BrainDumpReview (tap-to-edit)
```

---

## Navigation

Three tabs in `BottomNav` (fixed, `#E8F0EC` pill). Sparkle FAB sits to the right of the pill at the same level — single entry point for adding tasks (opens TaskCreator).

| Tab key | Icon | Label |
|---------|------|-------|
| `home`  | Yellow star SVG | Today |
| `all`   | Four status dots SVG | All |
| `you`   | Green stick figure SVG | Profile |

---

## CI

GitHub Actions at `.github/workflows/ci.yml`. Two jobs on every PR and push to main:
- **ci** — lint, build, unit tests (placeholder Supabase env, always runs)
- **e2e** — Playwright acceptance tests against prod Supabase; requires GitHub repo secrets (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `PLAYWRIGHT_TEST_EMAIL`, `PLAYWRIGHT_TEST_PASSWORD`). Uploads trace artifacts on failure.

Baseline e2e tests run on every PR: `sign_in`, `onboarding`, `mark_done`. Feature tests: `calendar_match`, `life_event_new_baby`, `snooze`, `weekly_checkin`. PRs that touch a user-facing flow should include a feature test for that flow.

---

## Next Priorities

1. Zip error message copy in onboarding (deferred).
2. Task Creator polish — edge cases in multi-task review, speech-to-text testing.

## Known Gaps / Mocked

See "What's Mocked / Incomplete" section above.
