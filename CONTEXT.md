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
| State | Custom hooks + localStorage (cache/offline) + Supabase (`profiles`, `task_records`, `custom_tasks`) |
| API | Vercel Edge Functions |
| AI | Claude Haiku 4.5 via `/api/assist` + `/api/generate-task` |
| Deployment | Vercel |
| Fonts | Righteous (display/brand), DM Sans (body) |

User data is persisted in Supabase (`profiles` + `task_records` + `custom_tasks`). localStorage is used as a cache/offline layer. Auth is via Supabase — Google OAuth (primary) + magic link (fallback).

Two Supabase projects:
- **Production:** `https://uftxbegrnlvlgkbitibp.supabase.co`
- **Dev:** `https://lrzheitfrltcyvllblmb.supabase.co` — used by Playwright e2e tests and Maestro
```

---

## What's Built and Working

- **Onboarding** — `SlimOnboarding`: full-screen green, 3 phases: welcome → 6 question screens (name/age/gender, own/rent, cars, zip, kids, pets) → transition summary. `PrioritySetup`: 12 key tasks, slide transitions, full green screen. Recurring tasks show fuzzy time chips + date picker (exact date shows a "Use" confirm button to prevent arrow-click from advancing the slide); one-time tasks show "Have you done this? Yes / Not yet".

- **Task library** — 60+ base tasks across 6 categories (home, car, health, finance, emergency, seasonal). Dynamically extended with per-car, per-kid, per-pet, and per-hazard tasks based on profile.

- **Task status + scoring** — Each task gets status `due | needed | coming-up | scheduled | confirm | ok | unknown` based on last-done date, interval, and window. Scored by stakes × days overdue. `unknown` = no `lastDone` set yet; excluded from scoring. `needed` = one-time task confirmed not done; orange bar, no date text, high priority score.

- **HomeView** — Personal greeting header (`HomeHeader`), "Focus for today" section (top 3 scored tasks), trickle card, hazard card, all-clear state. `paddingBottom: 160px` to clear FABs + nav.

- **AllView** — Three urgency groups. Category filter chips. Due-only toggle. `GroupDivider` between groups. Category icon tile on each card. "X tasks to explore" accordion section at bottom for `unknown`-status tasks with inline chip picker. `paddingBottom: 160px`.

- **ProfileView** — Sections: Home, Car, Kids, Pets, Health, Saved providers, Account. Health section shows/edits: Name, Birth year, Gender, Insurance provider. Gender chips match onboarding style; "prefer not to say" is hidden in view mode. Account section shows signed-in email + logout button. Reset deletes Supabase rows + clears localStorage.

- **TaskDetailView** — Green header, meta pills, "Why it matters" + "How to do it" cards, Assist button, calendar + mark done.

- **AssistPanel** — Full-screen overlay. Provider/script/deadline/guidance/guidance_companies modes. Caches 7 days (currently v12). Provider mode passes `task.searchQuery` (if set) to `/api/providers` so Places queries are task-appropriate rather than using the raw label. Provider cards show condensed weekly hours (Claude-formatted from Places `weekdayDescriptions`), review count under star rating, address links to Google Maps, blurbs with **bold** key phrases. `guidance_companies` mode returns JSON with guidance markdown + top 3 national companies (no aggregators); renders `MarkdownBlock` + `CompanyCard` rows with external link icon. `MarkdownBlock` handles ##headers, bullets, numbered lists with nested sub-bullets, tables, horizontal rules, bold, and auto-linked URLs. `PulseLoader` cycles through 3 contextual messages per `assistType` every 2.5s; providers uses `task.searchQuery || task.label` for specificity.

- **MarkDoneModal** — Custom `MonthCalendar` (in-React date picker) pre-filled today (hidden for one-time tasks). Closes immediately on done; confetti fires via `Celebration` separately. Replaces native `<input type="date">` to fix month-arrow-click close bug on Chrome/Mac.

- **AI Assist** — End-to-end: prompt → `/api/assist` → Claude → cached response.

- **Trickle questions** — Yellow card, chip/text UI, answers unlock new tasks. One-time tasks show "Have you done this? / Yes / Not yet"; "Not yet" marks `needed` (task surfaces as orange in list, no date).

- **Hazard detection** — Zip → hazard type → prep tasks. Runs on visit 2+.

- **Bottom dock** — Fixed nav: `[Today|All|Profile]` pill + sparkle AI FAB circle to the right (always visible). White `+` add FAB floats above nav on Today and All tabs.

- **AI Task Creator** — Sparkle FAB opens `AITaskCreator` full-screen sheet. User describes a task in plain English → `/api/generate-task` (Haiku 4.5) returns a structured task with category, frequency, guidance, safety tier, and assumption chips. `TaskConfirmCard` shows the draft — label is tap-to-edit, category is a dropdown, frequency opens `FrequencyPicker`, assumption chips cycle their options on tap and re-fire the API (debounced 400ms, AbortController cancels in-flight). T2 tasks show a silent DIY toggle (swaps `assistType`). T3 tasks are locked (no DIY). T4 prompts (crisis indicators) return a refusal screen with a single resource link and no save option. T0 (parse failure) shows a manual fallback form. On save, task is written to localStorage and upserted to `custom_tasks` in Supabase. `useProfile` exposes `addCustomTask` (async, with rollback on error) and `removeCustomTask`. Rate limited at 20 req/hr per user (`rl:gentask` prefix in Upstash). AssistPanel shows a small "Mitzy's guidance is general — when in doubt, call a pro." disclaimer for AI-generated tasks.

- **Auth UX** — Supabase Google OAuth (primary) + magic link (fallback). `BrandSplash` (full green background + Memphis shapes + four-dot wordmark) renders during `authLoading` to avoid flash-of-white on PWA cold launches. `LoginGate` normalizes magic-link emails (`trim().toLowerCase()`) at submit so case/whitespace variants resolve to one Supabase auth record. Success screen has a "Resend" button gated by a 30s cooldown (`RESEND_COOLDOWN_MS`) — cooldown starts on first send; restarts on each successful resend; re-enables immediately on error.

- **Welcome gate (returning vs new)** — `WelcomeGate` is the first screen on cold launch (before `SlimOnboarding`). Two buttons: "I'm new here" or "I've used Mitzy before". Choice persisted to `WELCOME_CHOICE_KEY` (`mitzy-welcome-v1`). `'returning'` skips onboarding and goes straight to `LoginGate` → server profile loads from Supabase into local state. `'new'` keeps the original onboarding → priority-setup → login flow. If a returning user signs in with no server profile (typo, wrong account), `App.js` flips them to `'new'` and routes through onboarding. Welcome key is included in `USER_KEYS`, so reset/sign-out clears it.

- **Profile conflict modal** — `useProfile` is now server-first. When a user signs in, the hook fetches the Supabase profile before any upsert. If the server has a meaningful profile (name or zip set) AND the user picked `'new'` AND local has fields the server doesn't, `pendingConflict` is set and `<ProfileConflictModal>` overlays the app. Options: "Use my saved setup" (loads server, discards local) or "Replace with new setup" (requires explicit "Yes, replace" confirm before the upsert overwrites the server). Closes the prior silent-overwrite bug where local onboarding data clobbered an existing server profile on sign-in.

---

## What's Mocked / Incomplete

| Feature | Status |
|---------|--------|
| Google Calendar integration | Built. `/api/schedule` Edge Function creates all-day events with 60-min popup reminder. GIS just-in-time OAuth in `SchedulePanel`. Requires `VITE_GOOGLE_CLIENT_ID` env var + Calendar API enabled in Google Cloud Console. |
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
WelcomeGate → (new) SlimOnboarding → PrioritySetup → LoginGate → App (3-tab nav)
            → (returning) LoginGate → App
                                   ├─ HomeView
                                   ├─ AllView
                                   ├─ ProfileView
                                   ├─ TaskDetailView
                                   │   ├─ AssistPanel → /api/assist → Claude
                                   │   ├─ SchedulePanel (mocked)
                                   │   └─ MarkDoneModal → Celebration confetti
                                   └─ AITaskCreator → /api/generate-task → Claude → custom_tasks
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

GitHub Actions at `.github/workflows/ci.yml`. Two jobs on every PR and push to main:
- **ci** — lint, build, unit tests (placeholder Supabase env, always runs)
- **e2e** — Playwright acceptance tests against dev Supabase (`lrzheitfrltcyvllblmb`); skips until GitHub repo secrets are set (`VITE_SUPABASE_URL_DEV`, `VITE_SUPABASE_ANON_KEY_DEV`, `PLAYWRIGHT_TEST_EMAIL`, `PLAYWRIGHT_TEST_PASSWORD`). Uploads trace artifacts on failure.

Three baseline e2e tests run on every PR: `sign_in`, `onboarding`, `mark_done`. PRs that touch a user-facing flow should include a feature test for that flow.

---

## Recent Fixes (PR #33)

**Auth flow security & reliability hardening:**
- PKCE flow enabled on Supabase client (modern OAuth standard for SPAs vs implicit flow)
- `getSession()` errors handled gracefully (prevents blank-screen deadlock on network issues)
- OAuth error messages surfaced in LoginGate from URL hash (`error_description` param)
- Per-user localStorage cleared on sign-out via `clearLocalUserData()` (prevents cross-user data leaks)
- Sign-out uses `{ scope: 'local' }` instead of global (signing out one device doesn't boot others)

## Next Priorities

1. ~~Build `/api/schedule` Edge Function~~ — Done ([PR #26](https://github.com/darylann-00/mitzy/pull/26)).
2. ~~Wire up the AI FAB~~ — Done ([PR #45](https://github.com/darylann-00/mitzy/pull/45), pending merge + QA).
3. Replace hardcoded hazard zip ranges in `hazards.js` with FEMA API.
4. Zip error message copy in onboarding (deferred).
5. AI Task Creator V1.5 — multi-task split for prompts like "winterize the house".

## Known Gaps / Mocked

| Feature | Status |
|---------|--------|
| Google Calendar integration | Built. `/api/schedule` Edge Function + GIS just-in-time OAuth in `SchedulePanel`. Requires `VITE_GOOGLE_CLIENT_ID` + Calendar API enabled in Google Cloud Console. |
| Hazard zip lookup | Hardcoded zip ranges. Replace with FEMA API. |
| AI Task Creator QA | [PR #45](https://github.com/darylann-00/mitzy/pull/45) open. Needs smoke test on preview URL. Preview OAuth redirect requires: (1) remove `VITE_SUPABASE_REDIRECT_URL` from Vercel Preview env, (2) add `https://*.vercel.app` to Supabase allowed redirect URLs. |
