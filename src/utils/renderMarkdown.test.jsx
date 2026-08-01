import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { parseGuidanceBlocks, renderGuidanceBlocks } from './renderMarkdown.jsx';

const draw = (guidance) => render(<div>{renderGuidanceBlocks(parseGuidanceBlocks(guidance))}</div>);

describe('renderGuidanceBlocks — links', () => {
  it('renders a markdown link as an anchor that opens in a new tab', () => {
    draw('1. Start at [the IRS W-4 page](https://www.irs.gov/forms-pubs/about-form-w-4) and download it.');
    const link = screen.getByRole('link', { name: 'the IRS W-4 page' });
    expect(link).toHaveAttribute('href', 'https://www.irs.gov/forms-pubs/about-form-w-4');
    expect(link).toHaveAttribute('target', '_blank');
    // Without this, the opened page gets a handle on ours via window.opener.
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('keeps the text around the link intact', () => {
    const { container } = draw('1. Go to [somewhere](https://example.com) and ask for a form.');
    expect(container.textContent).toBe('1Go to somewhere and ask for a form.');
  });

  it('renders more than one link in a single step', () => {
    draw('1. Try [first](https://a.example.com) then [second](https://b.example.com).');
    expect(screen.getByRole('link', { name: 'first' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'second' })).toBeInTheDocument();
  });

  it('still renders bold inside and outside a link', () => {
    const { container } = draw('1. **Important**: read [the **full** guide](https://example.com).');
    expect(container.querySelectorAll('strong')).toHaveLength(2);
  });

  it('refuses non-http schemes and leaves the raw text alone', () => {
    // Guidance strings are ours today, but AI-written guidance is on the
    // roadmap — this renderer must not be a javascript: sink when it lands.
    const { container } = draw('1. Tap [here](javascript:alert(1)) to continue.');
    expect(container.querySelector('a')).toBeNull();
    expect(container.textContent).toContain('[here](javascript:alert(1))');
  });

  it('leaves link-free guidance rendering exactly as before', () => {
    const { container } = draw('1. Turn off the water. 2. Drain the tank until it runs clear.');
    expect(container.querySelectorAll('a')).toHaveLength(0);
    expect(container.textContent).toContain('Drain the tank until it runs clear.');
  });

  it('links survive a heading and bullet mix', () => {
    draw('## Before you start\n- Check [your state DMV](https://www.usa.gov/state-motor-vehicle-services) first');
    expect(screen.getByRole('link', { name: 'your state DMV' })).toBeInTheDocument();
  });
});
