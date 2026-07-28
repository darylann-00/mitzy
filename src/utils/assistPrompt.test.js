import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildAssistPrompt } from './assistPrompt.js';
import * as geoModule from './geo.js';

vi.mock('./geo.js', () => ({
  resolveLocation: vi.fn(),
}));

const profile = {
  zip: '78704',
  insurance: 'Blue Cross Blue Shield',
  cars: ['2016 Subaru Outback'],
  kids: [{ name: 'Maya', birthYear: 2019 }],
  pets: [{ name: 'Biscuit', type: 'dog', birthYear: 2021 }],
};

const profileNoZip = {
  insurance: 'Blue Cross Blue Shield',
  cars: ['2016 Subaru Outback'],
};

const guidanceTask = {
  id: 'hm-wh',
  label: 'Flush water heater',
  assistType: 'guidance',
  guidance: '1. Turn off the cold water supply. 2. Drain until clear.',
  note: 'Prevents sediment buildup.',
};

describe('buildAssistPrompt — location resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('includes resolved county and state when resolveLocation succeeds', async () => {
    vi.mocked(geoModule.resolveLocation).mockResolvedValue({
      county: 'Travis County',
      state: 'Texas',
      stateCode: 'TX',
    });
    const prompt = await buildAssistPrompt(guidanceTask, profile);
    expect(prompt).toContain('Travis County, Texas');
    expect(prompt).toContain('zip 78704');
    expect(prompt).not.toContain('near zip code 78704');
  });

  it('falls back to "near zip code" when resolveLocation returns null', async () => {
    vi.mocked(geoModule.resolveLocation).mockResolvedValue(null);
    const prompt = await buildAssistPrompt(guidanceTask, profile);
    expect(prompt).toContain('near zip code 78704');
    expect(prompt).not.toContain('Travis County');
  });

  it('falls back to "in my area" when there is no zip', async () => {
    const prompt = await buildAssistPrompt(guidanceTask, profileNoZip);
    expect(prompt).toContain('in my area');
    expect(prompt).not.toContain('near zip code');
    expect(vi.mocked(geoModule.resolveLocation)).not.toHaveBeenCalled();
  });
});

describe('buildAssistPrompt — guidance tasks with static steps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(geoModule.resolveLocation).mockResolvedValue(null);
  });

  it('asks for the user-specific delta, not a rehash of the steps', async () => {
    const prompt = await buildAssistPrompt(guidanceTask, profile);
    expect(prompt).toContain('Do not repeat, rephrase, or summarize the steps above');
    expect(prompt).toContain(guidanceTask.guidance);
    expect(prompt).not.toContain('Give practical guidance');
  });

  it('includes the household context', async () => {
    const prompt = await buildAssistPrompt(guidanceTask, profile);
    expect(prompt).toContain('near zip code 78704');
    expect(prompt).toContain('Maya age');
    expect(prompt).toContain('Blue Cross Blue Shield');
  });

  it('guards against padding and unverified costs', async () => {
    const prompt = await buildAssistPrompt(guidanceTask, profile);
    expect(prompt).toContain('only if a different household would get materially different advice');
    expect(prompt).toContain('mark it as approximate');
  });

  it('applies to custom tasks (no assistType) that have guidance', async () => {
    const prompt = await buildAssistPrompt({ ...guidanceTask, assistType: undefined, isCustom: true }, profile);
    expect(prompt).toContain('Do not repeat, rephrase, or summarize the steps above');
  });
});

describe('buildAssistPrompt — unchanged paths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(geoModule.resolveLocation).mockResolvedValue(null);
  });

  it('keeps the generic prompt for guidance tasks without static steps', async () => {
    const prompt = await buildAssistPrompt({ ...guidanceTask, guidance: null }, profile);
    expect(prompt).toContain('Give practical guidance');
    expect(prompt).not.toContain('Do not repeat, rephrase, or summarize');
  });

  it('leaves script tasks untouched even when they have guidance', async () => {
    const prompt = await buildAssistPrompt({ ...guidanceTask, assistType: 'script' }, profile);
    expect(prompt).toContain('ready-to-send message');
    expect(prompt).not.toContain('Do not repeat, rephrase, or summarize');
  });

  it('leaves guidance_companies tasks untouched', async () => {
    const prompt = await buildAssistPrompt({ ...guidanceTask, assistType: 'guidance_companies' }, profile);
    expect(prompt).toContain('"companies"');
    expect(prompt).not.toContain('Do not repeat, rephrase, or summarize');
  });
});

describe('buildAssistPrompt — jurisdiction tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(geoModule.resolveLocation).mockResolvedValue({
      county: 'Travis County',
      state: 'Texas',
      stateCode: 'TX',
    });
  });

  it('produces the jurisdiction prompt with state-level explanation', async () => {
    const jurisdictionTask = {
      id: 'mar-licnse',
      label: 'Get marriage license',
      assistType: 'jurisdiction',
      note: 'Required before wedding ceremony',
    };
    const prompt = await buildAssistPrompt(jurisdictionTask, profile);
    expect(prompt).toContain('This task is governed by state and local law');
    expect(prompt).toContain('in Travis County, Texas (zip 78704)');
    expect(prompt).toContain('Do NOT state a specific filing fee');
    expect(prompt).toContain('name the exact office they should contact');
  });

  it('bypasses the guidance early return even when jurisdiction task has guidance', async () => {
    const jurisdictionTask = {
      id: 'mar-licnse',
      label: 'Get marriage license',
      assistType: 'jurisdiction',
      guidance: 'Step 1: Gather documents. Step 2: Apply.',
    };
    const prompt = await buildAssistPrompt(jurisdictionTask, profile);
    expect(prompt).toContain('This task is governed by state and local law');
    expect(prompt).not.toContain('Do not repeat, rephrase, or summarize the steps above');
    expect(prompt).not.toContain('Step 1: Gather documents');
  });

  it('includes the "Under 200 words" constraint', async () => {
    const jurisdictionTask = {
      id: 'mar-licnse',
      label: 'Get marriage license',
      assistType: 'jurisdiction',
    };
    const prompt = await buildAssistPrompt(jurisdictionTask, profile);
    expect(prompt).toContain('Under 200 words');
    expect(prompt).toContain('Markdown with **bold** lead-ins');
  });
});
