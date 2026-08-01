import { test, expect } from '@playwright/test';
import { loginWithDevCredentials, seedReturnUser } from './helpers/auth.js';

// Exercises the generic (config-driven) life event intake, which new-baby
// does not cover. Same endpoint stubbing strategy as life_event_new_baby:
// GETs return empty, POSTs are intercepted so nothing writes to Supabase.
async function mockLifeEventEndpoints(page) {
  await page.route('**/rest/v1/task_records**', route => {
    if (route.request().method() !== 'GET') return route.continue();
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await page.route('**/rest/v1/custom_tasks**', route => {
    const method = route.request().method();
    if (method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    if (method === 'POST') {
      let parsed = [];
      try { parsed = JSON.parse(route.request().postData() || '[]'); } catch {}
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(parsed) });
    }
    return route.continue();
  });

  await page.route('**/rest/v1/life_events**', route => {
    const method = route.request().method();
    if (method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    if (method === 'POST') {
      let parsed = {};
      try {
        const data = JSON.parse(route.request().postData() || '{}');
        parsed = Array.isArray(data) ? data[0] : data;
      } catch {}
      const row = {
        id: '00000000-0000-0000-0000-000000000002',
        user_id: parsed.user_id ?? null,
        type: parsed.type ?? 'divorce',
        status: 'active',
        intake_answers: parsed.intake_answers ?? null,
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const accept = route.request().headers()['accept'] || '';
      const body = accept.includes('vnd.pgrst.object') ? JSON.stringify(row) : JSON.stringify([row]);
      return route.fulfill({ status: 201, contentType: 'application/json', body });
    }
    return route.continue();
  });
}

// Marker text the stubbed /api/assist returns, so the assertion can't pass on
// anything the app renders on its own.
const ASSIST_MARKER = 'Travis County District Clerk';
const ASSIST_FEE    = '$350 filing fee';

// jurisdiction is a search-backed assist type, so /api/assist answers it with a
// stream of line-delimited JSON events rather than one JSON body. The answer is
// split across several `text` events on purpose — the client has to assemble
// them, and a mock that sent it in one delta wouldn't exercise that.
const ASSIST_STREAM = [
  { type: 'status', phase: 'search' },
  { type: 'text', delta: `**Where you file:** Petitions go to the ${ASSIST_MARKER}. ` },
  // The markdown link is deliberately split mid-token: it only renders as a
  // link if the client concatenated the deltas before parsing.
  { type: 'text', delta: `The ${ASSIST_FEE} is listed on [their fee ` },
  { type: 'text', delta: 'schedule](https://example.gov/fees).' },
  { type: 'done' },
];

const ndjson = (events) => events.map(e => JSON.stringify(e)).join('\n') + '\n';

// Captures what the client actually posted so the test can assert the request
// shape, not just that a response rendered.
async function mockAssistEndpoint(page, events = ASSIST_STREAM) {
  const captured = {};
  await page.route('**/api/assist', route => {
    Object.assign(captured, route.request().postDataJSON());
    return route.fulfill({
      status: 200,
      contentType: 'application/x-ndjson; charset=utf-8',
      body: ndjson(events),
    });
  });
  return captured;
}

// Walks a fresh self-represented divorce event up to an open AssistPanel on the
// petition task. Shared so the assist assertions can vary without paying for a
// second login and intake.
async function startDivorceAndOpenAssist(page) {
  await seedReturnUser(page);
  await page.goto('/');

  await loginWithDevCredentials(page);

  await expect(page.getByText('Today', { exact: true }).first()).toBeVisible({ timeout: 15000 });

  // Profile tab → Life events section
  await page.getByText('Profile', { exact: true }).click();
  const divorceBtn = page.getByRole('button', { name: /Divorce or separation/ });
  await expect(divorceBtn).toBeVisible({ timeout: 5000 });
  await divorceBtn.click();

  // Step 1: stage — "just getting started" means no retro checklist
  await expect(page.getByText('Where are you in the process?')).toBeVisible();
  await page.getByRole('button', { name: 'Just getting started', exact: true }).click();

  // Step 2: representation — self-filing swaps the attorney consult for the
  // court-procedure tasks an attorney would otherwise absorb.
  await expect(page.getByText('How are you handling the legal side?')).toBeVisible();
  await page.getByRole('button', { name: 'Representing myself', exact: true }).click();

  // Step 3: two yes/no gates — answer No to both so gated tasks drop out
  await expect(page.getByText('Two quick questions.')).toBeVisible();
  const noButtons = page.getByRole('button', { name: 'No', exact: true });
  await noButtons.nth(0).click();
  await noButtons.nth(1).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // Straight to confirm
  await expect(page.getByText(/Ready to add \d+ tasks/)).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: /Add \d+ tasks/ }).click();

  // Sheet closes; Profile shows the active event with progress
  await expect(page.getByText(/of \d+ done/)).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Find your event tasks under the "Divorce or separation" filter on the All tab.')).toBeVisible();

  // All tab — event tasks show under the default "All" filter, same as every
  // other task, and also behind their own "Divorce or separation" category chip.
  await page.getByText('All', { exact: true }).click();

  // The self-filing path is present and the attorney consult is not.
  await expect(page.getByText("Find your court's divorce forms and self-help resources").first())
    .toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Serve the papers and file proof of service').first()).toBeVisible();
  await expect(page.getByText('Consult a family law attorney')).toHaveCount(0);

  // The "Divorce or separation" chip narrows the list down to just event tasks.
  await page.getByRole('button', { name: 'Divorce or separation' }).click();
  await expect(page.getByText("Find your court's divorce forms and self-help resources").first())
    .toBeVisible({ timeout: 5000 });

  // Later-phase tasks (final hearing, decree, etc.) have a computed due date
  // further out than their lead window — they're known tasks, not ones needing
  // the "have you done this?" Explore treatment. Asserted behind the event
  // chip, where Explore only ever holds event tasks: under "All" the account's
  // untouched library tasks legitimately fill that pile.
  await expect(page.getByText(/tasks to explore/)).toHaveCount(0);

  // Open the divorce-petition task. It carries assistType 'jurisdiction', so this
  // also guards the AssistPanel render gate: if 'jurisdiction' is ever dropped from
  // that gate, the request still succeeds but the panel renders empty.
  await page.getByText('File or respond to the divorce petition').first().click();

  // The static "What to expect" card now carries verified links from the
  // officialLinks registry. This is the surface a self-filer reads before they
  // ever tap Assist, and its renderer is hand-rolled — a regression there shows
  // up as a literal "[label](url)" on screen rather than an error.
  const formsLink = page.getByRole('link', { name: /LawHelp\.org lists free court forms/ });
  await expect(formsLink).toBeVisible({ timeout: 5000 });
  await expect(formsLink).toHaveAttribute('href', 'https://www.lawhelp.org/findforms');
  await expect(formsLink).toHaveAttribute('target', '_blank');
  await expect(page.getByText('](https://')).toHaveCount(0);

  const assistBtn = page.getByRole('button', { name: /Want Mitzy to help/ });
  await expect(assistBtn).toBeVisible({ timeout: 5000 });
  await assistBtn.click();
}

test('user starts a divorce life event self-represented and opens assist on a jurisdiction task', async ({ page }) => {
  await mockLifeEventEndpoints(page);
  const assistRequest = await mockAssistEndpoint(page);
  await startDivorceAndOpenAssist(page);

  // The streamed deltas have to assemble into one answer before the markdown
  // means anything — the source link below is split across two of them.
  await expect(page.getByText(new RegExp(ASSIST_MARKER))).toBeVisible({ timeout: 15000 });

  // A real fee and a source link now render — the whole point of giving this
  // assist type a live lookup.
  await expect(page.getByText(new RegExp(ASSIST_FEE.replace('$', '\\$')))).toBeVisible();
  await expect(page.getByRole('link', { name: 'their fee schedule' })).toHaveAttribute(
    'href', 'https://example.gov/fees',
  );

  // The request shape is what switches web search on server-side. If the client
  // stops sending assistType, search silently never runs — the panel still
  // renders, the answers just quietly get vaguer. Assert it explicitly.
  expect(assistRequest.assistType).toBe('jurisdiction');
  // The explicit flag is what lets a single task opt into search without
  // changing its assistType. The server ORs the two.
  expect(assistRequest.search).toBe(true);

  // Search variant asks the model to cite what it looked up...
  expect(assistRequest.prompt).toContain('Cite your source as a markdown link');
  // ...and to always hand back somewhere to go. Citations alone weren't enough:
  // they were owed only when the model stated a fee or a date, so an answer that
  // carefully stated neither came back with no link at all.
  expect(assistRequest.prompt).toContain('**Where to go**');
  // ...and carries a real resolved place, not the "near zip code N" or "in my
  // area" fallback. Matched by shape, not by name — the county follows whatever
  // zip the test account has, so hard-coding one couples this to that profile.
  expect(assistRequest.prompt).toMatch(/the user is in .+, .+ \(zip \d{5}\)\./);

  // ...and the fallback the server uses when a search fails still forbids
  // stating a fee it cannot verify.
  expect(assistRequest.fallbackPrompt).toContain('Do NOT state a specific filing fee');
  expect(assistRequest.fallbackPrompt).not.toContain('Cite your source as a markdown link');
});

test('a jurisdiction assist stream that ends mid-answer is not shown or cached as complete', async ({ page }) => {
  await mockLifeEventEndpoints(page);
  // Same answer, cut off before the `done` event — what the user sees if the
  // function is killed or the connection drops partway through. The text that
  // did arrive is half-sourced legal guidance, so it must not be presented as
  // the answer, and it must not land in the 30-day cache.
  await mockAssistEndpoint(page, ASSIST_STREAM.filter(e => e.type !== 'done').slice(0, 3));
  await startDivorceAndOpenAssist(page);

  await expect(page.getByText('Something went wrong. Try again?')).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();

  // The partial answer is gone, not left on screen behind the error.
  await expect(page.getByText(new RegExp(ASSIST_MARKER))).toHaveCount(0);

  // Nothing written under the assist cache prefix, so reopening the panel
  // refetches instead of serving a truncated answer for the next 30 days.
  const cachedKeys = await page.evaluate(() =>
    Object.keys(localStorage).filter(k => k.startsWith('mitzy-assist-')),
  );
  expect(cachedKeys).toEqual([]);
});
