# Mitzy — Architecture Reference

Read this when touching state, data, or non-trivial component wiring.

---

## Project Structure

```
/src
  /components       — TaskCard, SwipeableTaskCard, AssistPanel, ScheduleSurface,
                      MarkDoneModal, TaskCreator, TaskConfirmCard, BrainDumpReview,
                      TrickleCard, HazardCard, LifeEventIntake, LifeEventNudge,
                      GuidedSteps, MatchConfirmationChip, SnoozePicker, SnoozeIcon,
                      SnoozeTooltip, MonthCalendar, DateField, FrequencyPicker,
                      Celebration, Sheet, CategoryIcons, BottomNav, LandingPage,
                      LoginGate, BrandSplash, ProfileConflictModal, WeeklyCheckIn
  /contexts         — ProfileContext, TaskContext, CalendarContext
  /views            — HomeView, AllView, ProfileView, TaskDetailView
  /data             — constants.js, tasks.js, taskFactory.js, insuranceProviders.js,
                      providerTypes.js, zipCodes.js, officialLinks.js (verified
                      URL registry + task→links map; see Key Implementation Notes)
    /lifeEvents     — index.js (registry), newBaby.js, marriage.js,
                      nameChange.js, divorce.js, lossOfLovedOne.js,
                      eventDates.js (due-date math)
  /hooks            — useAuth, useProfile, useTasks, useSession, useProviders,
                      useLifeEvents, useCapacityNudge, useWeeklyPlan
  /lib              — supabase.js, googleCalendar.js
  /utils            — storage.js, taskLogic.js, assistPrompt.js, hazards.js,
                      geo.js, climateRegion.js, renderMarkdown.jsx, resolveStepVars.js
  /onboarding       — SlimOnboarding, PrioritySetup
  /styles/app.css   — Full design system
/public/data        — Static lookup datasets fetched same-origin at runtime:
                      zip-to-fips.json, nri-county-risk.json (FEMA hazard data,
                      see Key Implementation Notes), fips-to-county.json
                      (county FIPS → county name, used by geo.js)
/scripts            — build-hazard-data.mjs, build-county-names.mjs, and
                      check-official-links.mjs (manual maintenance scripts, not
                      in build/CI pipeline; re-run when FEMA or Census publishes
                      a new vintage, or roughly annually for the link check)
/api
  assist.js         — Vercel Function → Anthropic API proxy (Haiku 4.5; Sonnet 5
                      + web search for jurisdiction/deadline)
  providers.js      — Vercel Function → Google Places + Claude synthesis
  generate-task.js  — Vercel Function → Claude Haiku task generation
  calendar-events.js — Vercel Function → Google Calendar API
  calendar-match.js — Vercel Function → Claude Haiku event-task matching
  weekly-checkin.js — Vercel Function → Claude Haiku weekly plan matching
  schedule.js       — Vercel Function → Google Calendar event creation
  _auth.js          — Shared auth helper
  _helpers.js       — Shared utilities
  _ratelimit.js     — Upstash rate limiting
```

---

## State Architecture

- `ProfileContext` (`src/contexts/ProfileContext.jsx`) wraps `useProfile` + `useProviders` + `region`.
- `TaskContext` (`src/contexts/TaskContext.jsx`) wraps `useTasks` + all derived lists (`activeTasks`, `visibleTasks`, `scoredDue`, `focusTasks`, `doneThisWeek`) + helpers (`getStatus`, `getDays`, `getNext`).
- `CalendarContext` (`src/contexts/CalendarContext.jsx`) manages Google Calendar OAuth tokens, event fetching, and task-event matching state.
- `TaskProvider` is nested inside `ProfileProvider`.
- `App.js` = `Mitzy` (providers + auth) → `MitzyApp` (all UI/onboarding logic) → views.
- Views and `AssistPanel` consume context directly; `MitzyApp` only passes UI callbacks (not domain data) to views.
- `AppHeader` is exported from `HomeView.jsx` and imported by AllView, ProfileView, TaskDetailView. `HomeHeader` (greeting variant) is used only in HomeView.

---

## Key Implementation Notes

- `task.label` is the display name field (not `task.name`).
- `getDays(task)` returns positive = days until due, negative = days overdue. Returns `0` for unknown tasks.
- `formatDueDate(days)` in TaskCard.jsx: `days < -14` → "Hasn't been done in a while"; `-14 ≤ days < 0` → "due X days ago". `subtitle` prop overrides this if provided.
- `markDone` and `markNeeded` are passed to `AllView` so the explore section can write state without going through `MarkDoneModal`. One-time tasks in the explore section show "Have you done this?" instead of time chips.
- `TaskAnswerChips` (`src/components/TaskAnswerChips.jsx`) is a shared component used by TrickleCard, PrioritySetup, and AllView's ExploreSection. Handles recurring vs one-time branching, chip constants, and date conversion internally.
- `handleMarkDone` in App.js calls `markDone`, fires `setCelebration(true)`, immediately calls `setMarkDoneModal(null)` — modal closes on done, confetti fires separately.
- `focusTasks` = top 3 scored non-ok/unknown tasks, computed in TaskContext.
- Task dependencies: `dependsOn: "parent-id"` hides a task until the parent has `lastDone` set. Enforced via `isDependencySatisfied()` in `activeTasks` filter. Dependency-gated tasks are also hidden during PrioritySetup.
- Per-car tasks generated by `carTasks(carString)` in `taskFactory.js`. EV detection skips oil/transmission/emissions tasks and adds EV battery check.
- `task.searchQuery` — optional field on tasks with `assistType: "providers"`. Sent to `/api/providers` instead of `task.label`. Critical for auto-generated tasks like `"Max: vet wellness visit"` (searchQuery: `"dog veterinary clinic"`).
- `isWindowActive(task, region)` in `taskLogic.js` — `region` from `getClimateRegion(zip)`. `REGION_TASK_ADJUSTMENTS` maps `region → task.id → { seasonStart, activeMonths }`. `DEFAULT_REGION = null` — unrecognized zips get no seasonal adjustment.
- `task.priority: true` on task definition objects. `isPriority(task)` checks `task.priority` directly. Only one per-kid task (`k-health`, annual health visit) and one per-pet task (`p-vet`, vet visit) carry `priority: true` — kept to one each so onboarding's guaranteed-slot rule (see `selectPriorityTasks()` in `PrioritySetup.jsx`) can't balloon into an unbounded number of questions for large families.
- `effectiveInterval = entry?.intervalDays ?? task.intervalDays` drives all display and scheduling.
- `taskStatus()` in `taskLogic.js` computes the `coming-up` threshold as `task.reminderLeadDays ?? task.windowDays` (one-time tasks: `?? 7`). `reminderLeadDays` is the per-task field for tasks that need extra lead time to actually book (vet, pediatrician, dentist, specialist trades) — set higher than `windowDays` on those; otherwise falls back to `windowDays` so behavior is unchanged for quick/walk-in services.
- Profile stores `birthYear` (4-digit year) for user, kids, and pets. `getAge(birthYear) = currentYear - birthYear` in `taskFactory.js` and `assistPrompt.js`. `PROFILE_KEY = "mitzy-pro-v7"`.
- Trickle rotation queue key: `TRICKLE_QUEUE_KEY = "mitzy-tq-v6"`. 5-day cadence. `useSession` must be given `visibleTasks` (not the unfiltered `activeTasks`) as its task list, so candidates are already `isWindowActive`-filtered — otherwise a task outside its seasonal window (e.g. winterizing outdoor faucets in July) can get surfaced as a trickle question. Regression-tested in `taskLogic.test.js`.
- `activeCategory` and `dueOnly` filter state lives in App.js (survives tab switches).
- CORS: `/api/assist` and `/api/providers` origin-allowlisted via `ALLOWED_ORIGIN` env var.
- `/api/providers` accepts optional `maxResults` in request body (clamped 1–10, defaults to 6).
- `storage.js`: `cleanupOldKeys()` removes orphaned `mitzy-*` keys from old schema versions, called on startup in `index.js`.
- Supabase: `markDone`/`markScheduled`/`markNotApplicable`/`updateProfile` roll back local state on failed upsert. Both `useTasks` and `useProfile` return `loading` + `syncError`.
- `task_records` has `interval_days` column (migration: `supabase/migrations/20260423_add_interval_days_to_task_records.sql`).
- `custom_tasks.due_date` (migration `20260718_add_due_date_to_custom_tasks.sql`) is the definition-level default due date for one-time custom tasks — life event bundles compute it from the event's anchor date. `taskStatus()` and `getDays()` resolve `entry?.dueDate ?? task.dueDate`, so a user-set `task_records.due_date` always wins over the definition default.
- Life event defs are self-describing: `phases` drives sort order in `useLifeEvents`, `intake.steps` drives `GenericEventIntake`, `tasksForIntake(answers)` generates the bundle, `suppressCelebration` kills confetti event-wide. Registering a def in `src/data/lifeEvents/index.js` + an icon in `LIFE_EVENT_ICON_CONFIG` is all a new event needs (plus a bespoke intake component only if its branching outgrows the generic step types).
- Intake `booleans` step fields support `allowUnsure: true`, rendering a third "Not sure yet" chip that stores the string `'unsure'` as the answer. Gating functions in defs that use it must check `=== true`, not truthiness — `'unsure'` is a non-empty string and would otherwise pass a `!answers?.x` gate. `useLifeEvents.resolveEventAnswer(eventId, key, value)` lets the user come back later (surfaced in ProfileView's Life events card) and settle an unresolved decision; it patches `life_events.intake_answers` and adds any newly-unlocked tasks via `def.tasksForIntake`, filtered against existing `customTasks` by `eventBundleKey` so nothing is created twice.
- `detectHazards(zip)` in `hazards.js` looks up `/data/zip-to-fips.json` → `/data/nri-county-risk.json` (both fetched same-origin, memoized in a module-level promise so repeat calls from `App.js` and `useSession.js` don't refetch). FEMA's current NRI schema uses `IFLD` (Inland Flooding) not the older `RFLD` code, and rating strings are `"Relatively Low/Moderate/High"` + `"Very Low/High"` — not `"Medium"`/`"High"`.
- `resolveLocation(zip)` in `geo.js` maps a zip to `{ county, state, stateCode }` via `/data/zip-to-fips.json` → `/data/fips-to-county.json`, with the state derived from the first two digits of the county FIPS against a `STATE_FIPS` table (50 states + DC + territories). It never throws and returns `null` on a bad zip, an unknown zip, or a fetch failure — callers must treat `null` as "no location" rather than an error. It fetches `zip-to-fips.json` independently of `hazards.js`; the duplicate request is served from the browser HTTP cache, which is deliberate to keep the two modules uncoupled. Unlike `hazards.js`, it clears its memoized promise if the fetch rejects, so a transient network failure doesn't disable location resolution for the rest of the session.
- `/api/assist` takes `{ prompt, fallbackPrompt, assistType, search }`. The server ORs `SEARCH_ASSIST_TYPES.has(assistType)` with `search === true` to decide whether to run a web lookup — `SEARCH_ASSIST_TYPES` there must stay in sync with `SEARCH_ASSIST_TYPES` in `assistPrompt.js` (which `isSearchAssistType()` exports, and which `shouldUseSearch(task)` wraps for the client's cache-TTL, prompt-variant, and response-parsing choices). The `search` flag exists so a single task can carry `searchAssist: true` and get the live lookup without changing its `assistType` — which would otherwise also change its rendering and prompt shape. It's client-supplied, but so is `assistType`, so it grants no reach a caller didn't already have; the per-user rate limiter is what bounds the spend. Streaming keys off the same OR on both sides — `shouldUseSearch(task)` on the client, `useSearch` on the server — so a `searchAssist` task streams and is parsed as a stream. **Before setting `searchAssist` on a task, check its render gate accepts the `streaming` status**: `deadline`/`guidance`/`jurisdiction`/untyped already do, but `guidance_companies` renders only on `done` and parses the body as JSON, so promoting one of those would need the gate widened first. Search runs on `claude-sonnet-5` with `web_search_20260209`, capped at `MAX_SEARCHES` (3); Haiku 4.5 can't be used because it only supports the older basic search variant. **`allowed_callers: ["direct"]` is set deliberately**, turning that tool version's headline feature (dynamic filtering) off: by default it runs every search from inside code execution, which means provisioning a sandbox and generating filtering code before a single result returns. That feature trades latency for *token* efficiency on search-heavy requests — the wrong trade here, where we do at most 3 searches and read a 250-word answer. Leaving it on is a large part of why this route was exceeding 60s. Turn it back on only if token cost, not wall-clock, becomes the constraint.
- **`/api/assist` has two response shapes.** Non-search types return the original one-shot `{ text }` JSON. Search-backed types return a **stream** of line-delimited JSON events — `{type:'status',phase}` (`search` → `reading` → `fallback`), `{type:'text',delta}`, `{type:'reset'}`, `{type:'done'}`, `{type:'error'}`. Status carries the phase only, never search-result content: results are untrusted web text and reach the UI only through the model's own answer. The client branches on `isSearchAssistType()`; both sides must change together. Rules that fall out of it: the client caches **only** on `done` (a stream that ends without it throws, so a truncated legal answer is never cached for 30 days or shown as finished), `reset` means discard everything streamed so far, and errors after the first byte are in-band rather than HTTP statuses — auth and rate limiting are still checked before the stream opens, so those stay real 401/429s.
- The streamed path rebuilds the assistant's content blocks from the deltas (`streamTurn`) rather than just concatenating text, because a `pause_turn` has to be re-sent with its blocks **intact**: `web_search_tool_result` carries `encrypted_content` the API decrypts on the next turn, and thinking blocks carry a signature — drop or reshape either and the resume 400s. Resume appends the assistant content and adds **no** extra user message. Text is spread across multiple `text` blocks interleaved with tool blocks, so it's never `content[0]`. Any failure — non-200, `refusal`, mid-stream `event: error`, exhausted budget, empty text, still paused after `MAX_CONTINUATIONS` — falls back to the no-tools Haiku call using `fallbackPrompt`, whose wording forbids stating fees and deadlines it can't verify; sending the search-variant prompt down that path would ask for citations it never looked up, which is why the client posts both.
- **Streaming did not replace the deadline — it sits on top of it.** `vercel.json` pins `api/assist.js` to `maxDuration: 60`, and the handler enforces its **own** deadline inside that (`SEARCH_BUDGET_MS`, 35s) via an `AbortController` per request, counted across `pause_turn` resumes and combined with the client-disconnect signal via `AbortSignal.any`. Bytes already on the wire do not stop the platform's clock, so owning the deadline is still what makes the fallback reachable at all: budgeting against the platform's clock and hoping to finish first is how this shipped broken twice. What streaming changed is only the *cost of a miss* — a blown budget now retracts a partial answer with `reset` and degrades to Haiku, instead of taking the whole function down as a 504. Raising `SEARCH_BUDGET_MS`, `MAX_SEARCHES`, or `effort` eats that margin. Both search outcomes log their elapsed ms — real latency is only observable in a deployment, and estimating it produced two bad guesses already, so read Vercel's runtime logs rather than assuming streaming made it fast. (The `export const config = { runtime: "edge" }` in every `/api` file is not actually applied — the build log shows all of them compiled as Node functions — so `maxDuration` is the lever that works.)
- `task.guidance` strings are written as a single line with inline numbered steps (`"1. Do X. 2. Do Y."`), not one step per line. `parseGuidanceBlocks` in `renderMarkdown.jsx` normalizes this by inserting a newline before each `N. ` marker (lookbehind on sentence-ending punctuation) before splitting — write new guidance strings in the same inline format, the parser expects it. Strings that carry a link are template literals calling `officialLink(id, text)` from `src/data/officialLinks.js` — never a URL typed inline, so every link has exactly one definition and `scripts/check-official-links.mjs` can find them all. `renderInline` renders `[label](url)` as a new-tab anchor and silently refuses any non-`http(s)` scheme, which matters because AI-written guidance is a plausible future source for these strings.
- Assist prompts other than `script` end with a link-rules block from `linkRules()` in `assistPrompt.js`. On the no-tools path a task's verified links are offered and every other URL is banned outright — Haiku cannot check a URL, and it will invent a plausible `.gov` deep link that 404s, which is the worst failure mode on a divorce, death, or name-change task. On the search path the same links are a floor, not a ceiling. Because the block is appended per prompt variant, the `deadline` and `jurisdiction` no-search variants no longer carry their own "do not state a web address" clause — URL policy lives in one place now, and duplicating it there produced a prompt that contradicted itself once links existed.
