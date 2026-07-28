import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock data for testing.
const mockZipToFips = {
  '78704': '48453',  // Travis County, Texas
  '10007': '36061',  // New York County, New York
  '90001': '06037',  // Los Angeles County, California
};

const mockFipsToCounty = {
  '48453': 'Travis County',
  '36061': 'New York County',
  '06037': 'Los Angeles County',
};

describe('resolveLocation', () => {
  let fetchMock;

  beforeEach(() => {
    vi.resetModules();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('resolves a known zip to the right county, state, and stateCode', async () => {
    fetchMock.mockImplementation((url) => {
      if (url.includes('zip-to-fips')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockZipToFips),
        });
      }
      if (url.includes('fips-to-county')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFipsToCounty),
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const { resolveLocation } = await import('./geo.js');
    const result = await resolveLocation('78704');

    expect(result).toEqual({
      county: 'Travis County',
      state: 'Texas',
      stateCode: 'TX',
    });
  });

  it('returns null for a missing zip', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const { resolveLocation } = await import('./geo.js');
    const result = await resolveLocation(null);

    expect(result).toBeNull();
  });

  it('returns null for a malformed zip (abc)', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const { resolveLocation } = await import('./geo.js');
    const result = await resolveLocation('abc');

    expect(result).toBeNull();
  });

  it('returns null for a malformed zip (1234)', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const { resolveLocation } = await import('./geo.js');
    const result = await resolveLocation('1234');

    expect(result).toBeNull();
  });

  it('returns null for an unknown zip', async () => {
    fetchMock.mockImplementation((url) => {
      if (url.includes('zip-to-fips')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockZipToFips),
        });
      }
      if (url.includes('fips-to-county')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFipsToCounty),
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const { resolveLocation } = await import('./geo.js');
    const result = await resolveLocation('99999');

    expect(result).toBeNull();
  });

  it('returns null when fetch rejects (does not throw)', async () => {
    fetchMock.mockRejectedValue(new Error('Network error'));

    const { resolveLocation } = await import('./geo.js');
    const result = await resolveLocation('78704');

    expect(result).toBeNull();
  });

  it('fetches data files only once across multiple calls', async () => {
    let fetchCallCount = 0;
    fetchMock.mockImplementation((url) => {
      fetchCallCount++;
      if (url.includes('zip-to-fips')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockZipToFips),
        });
      }
      if (url.includes('fips-to-county')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFipsToCounty),
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const { resolveLocation } = await import('./geo.js');

    // First call should fetch both files.
    await resolveLocation('78704');
    expect(fetchCallCount).toBe(2);

    // Second call should use cached data.
    await resolveLocation('10007');
    expect(fetchCallCount).toBe(2);

    // Third call should also use cached data.
    await resolveLocation('90001');
    expect(fetchCallCount).toBe(2);
  });

  it('retries on a later call after a transient fetch failure', async () => {
    let attempt = 0;
    fetchMock.mockImplementation((url) => {
      // Fail every fetch on the first attempt, succeed from then on.
      if (attempt === 0) return Promise.reject(new Error('Network error'));
      if (url.includes('zip-to-fips')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockZipToFips) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockFipsToCounty) });
    });

    const { resolveLocation } = await import('./geo.js');

    expect(await resolveLocation('78704')).toBeNull();

    // A cached rejected promise would keep returning null forever.
    attempt = 1;
    expect(await resolveLocation('78704')).toEqual({
      county: 'Travis County',
      state: 'Texas',
      stateCode: 'TX',
    });
  });

  it('resolves all three sanity-check zips correctly', async () => {
    fetchMock.mockImplementation((url) => {
      if (url.includes('zip-to-fips')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockZipToFips),
        });
      }
      if (url.includes('fips-to-county')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFipsToCounty),
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const { resolveLocation } = await import('./geo.js');

    const travis = await resolveLocation('78704');
    expect(travis.county).toBe('Travis County');
    expect(travis.state).toBe('Texas');
    expect(travis.stateCode).toBe('TX');

    const newyork = await resolveLocation('10007');
    expect(newyork.county).toBe('New York County');
    expect(newyork.state).toBe('New York');
    expect(newyork.stateCode).toBe('NY');

    const losangeles = await resolveLocation('90001');
    expect(losangeles.county).toBe('Los Angeles County');
    expect(losangeles.state).toBe('California');
    expect(losangeles.stateCode).toBe('CA');
  });
});
