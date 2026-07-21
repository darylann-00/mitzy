import { describe, it, expect } from 'vitest';
import { buildAssistPrompt } from './assistPrompt.js';

const profile = {
  zip: '78704',
  insurance: 'Blue Cross Blue Shield',
  cars: ['2016 Subaru Outback'],
  kids: [{ name: 'Maya', birthYear: 2019 }],
  pets: [{ name: 'Biscuit', type: 'dog', birthYear: 2021 }],
};

const guidanceTask = {
  id: 'hm-wh',
  label: 'Flush water heater',
  assistType: 'guidance',
  guidance: '1. Turn off the cold water supply. 2. Drain until clear.',
  note: 'Prevents sediment buildup.',
};

describe('buildAssistPrompt — guidance tasks with static steps', () => {
  it('asks for the user-specific delta, not a rehash of the steps', () => {
    const prompt = buildAssistPrompt(guidanceTask, profile);
    expect(prompt).toContain('Do not repeat, rephrase, or summarize the steps above');
    expect(prompt).toContain(guidanceTask.guidance);
    expect(prompt).not.toContain('Give practical guidance');
  });

  it('includes the household context', () => {
    const prompt = buildAssistPrompt(guidanceTask, profile);
    expect(prompt).toContain('near zip code 78704');
    expect(prompt).toContain('Maya age');
    expect(prompt).toContain('Blue Cross Blue Shield');
  });

  it('guards against padding and unverified costs', () => {
    const prompt = buildAssistPrompt(guidanceTask, profile);
    expect(prompt).toContain('only if a different household would get materially different advice');
    expect(prompt).toContain('mark it as approximate');
  });

  it('applies to custom tasks (no assistType) that have guidance', () => {
    const prompt = buildAssistPrompt({ ...guidanceTask, assistType: undefined, isCustom: true }, profile);
    expect(prompt).toContain('Do not repeat, rephrase, or summarize the steps above');
  });
});

describe('buildAssistPrompt — unchanged paths', () => {
  it('keeps the generic prompt for guidance tasks without static steps', () => {
    const prompt = buildAssistPrompt({ ...guidanceTask, guidance: null }, profile);
    expect(prompt).toContain('Give practical guidance');
    expect(prompt).not.toContain('Do not repeat, rephrase, or summarize');
  });

  it('leaves script tasks untouched even when they have guidance', () => {
    const prompt = buildAssistPrompt({ ...guidanceTask, assistType: 'script' }, profile);
    expect(prompt).toContain('ready-to-send message');
    expect(prompt).not.toContain('Do not repeat, rephrase, or summarize');
  });

  it('leaves guidance_companies tasks untouched', () => {
    const prompt = buildAssistPrompt({ ...guidanceTask, assistType: 'guidance_companies' }, profile);
    expect(prompt).toContain('"companies"');
    expect(prompt).not.toContain('Do not repeat, rephrase, or summarize');
  });
});
