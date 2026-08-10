import { describe, it, expect, vi } from "vitest";

// stripe-webhook.js imports invalidateEntitlement from _entitlement.js, which
// imports redis from _ratelimit.js — Redis.fromEnv() throws without Upstash
// credentials. Stub it out the same way _quota.test.js does, so these tests
// can exercise the signature-verification logic in isolation.
vi.mock('./_ratelimit.js', () => ({
  redis: { del: async () => 1 },
}));

const { parseSignatureHeader, verifyStripeSignature } = await import('./stripe-webhook.js');

const SECRET = 'whsec_test_secret';

async function sign(timestamp, body, secret = SECRET) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const buf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${body}`));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

describe("parseSignatureHeader", () => {
  it("extracts the timestamp and a single v1 signature", () => {
    const { timestamp, signatures } = parseSignatureHeader('t=1690000000,v1=abcd1234');
    expect(timestamp).toBe('1690000000');
    expect(signatures).toEqual(['abcd1234']);
  });

  it("collects multiple v1 signatures during secret rotation", () => {
    const { timestamp, signatures } = parseSignatureHeader('t=1690000000,v1=first,v1=second');
    expect(timestamp).toBe('1690000000');
    expect(signatures).toEqual(['first', 'second']);
  });

  it("returns nulls/empty for a missing header", () => {
    expect(parseSignatureHeader(null)).toEqual({ timestamp: null, signatures: [] });
    expect(parseSignatureHeader('')).toEqual({ timestamp: null, signatures: [] });
  });

  it("returns nulls/empty for a header with no t= or v1=", () => {
    expect(parseSignatureHeader('garbage-not-a-real-header')).toEqual({ timestamp: null, signatures: [] });
  });
});

describe("verifyStripeSignature", () => {
  const body = JSON.stringify({ id: 'evt_123', type: 'checkout.session.completed' });

  it("accepts a correctly signed payload within tolerance", async () => {
    const now = Date.now();
    const timestamp = String(Math.floor(now / 1000));
    const sig = await sign(timestamp, body);
    const header = `t=${timestamp},v1=${sig}`;

    expect(await verifyStripeSignature(body, header, SECRET, { now })).toBe(true);
  });

  it("rejects a signature computed with the wrong secret", async () => {
    const now = Date.now();
    const timestamp = String(Math.floor(now / 1000));
    const sig = await sign(timestamp, body, 'whsec_wrong_secret');
    const header = `t=${timestamp},v1=${sig}`;

    expect(await verifyStripeSignature(body, header, SECRET, { now })).toBe(false);
  });

  it("rejects a signature computed over a different body (tampered payload)", async () => {
    const now = Date.now();
    const timestamp = String(Math.floor(now / 1000));
    const sig = await sign(timestamp, JSON.stringify({ id: 'evt_123', type: 'something.else' }));
    const header = `t=${timestamp},v1=${sig}`;

    expect(await verifyStripeSignature(body, header, SECRET, { now })).toBe(false);
  });

  it("rejects a stale timestamp outside the tolerance window (replay)", async () => {
    const now = Date.now();
    const staleTimestamp = String(Math.floor(now / 1000) - 600); // 10 min old
    const sig = await sign(staleTimestamp, body);
    const header = `t=${staleTimestamp},v1=${sig}`;

    expect(await verifyStripeSignature(body, header, SECRET, { now, toleranceSeconds: 300 })).toBe(false);
  });

  it("accepts a timestamp just inside the tolerance window", async () => {
    const now = Date.now();
    const timestamp = String(Math.floor(now / 1000) - 290); // just under 5 min
    const sig = await sign(timestamp, body);
    const header = `t=${timestamp},v1=${sig}`;

    expect(await verifyStripeSignature(body, header, SECRET, { now, toleranceSeconds: 300 })).toBe(true);
  });

  it("rejects a malformed header (missing v1)", async () => {
    const now = Date.now();
    const timestamp = String(Math.floor(now / 1000));
    expect(await verifyStripeSignature(body, `t=${timestamp}`, SECRET, { now })).toBe(false);
  });

  it("rejects a malformed header (missing t)", async () => {
    expect(await verifyStripeSignature(body, 'v1=abcd1234', SECRET, { now: Date.now() })).toBe(false);
  });

  it("rejects a completely empty or garbage header", async () => {
    expect(await verifyStripeSignature(body, '', SECRET)).toBe(false);
    expect(await verifyStripeSignature(body, 'not-a-real-header', SECRET)).toBe(false);
  });

  it("rejects when one of multiple v1 signatures is wrong and none match", async () => {
    const now = Date.now();
    const timestamp = String(Math.floor(now / 1000));
    const header = `t=${timestamp},v1=deadbeef,v1=cafef00d`;
    expect(await verifyStripeSignature(body, header, SECRET, { now })).toBe(false);
  });

  it("accepts when the correct signature is one of several v1 entries (secret rotation)", async () => {
    const now = Date.now();
    const timestamp = String(Math.floor(now / 1000));
    const correctSig = await sign(timestamp, body);
    const header = `t=${timestamp},v1=deadbeef,v1=${correctSig}`;
    expect(await verifyStripeSignature(body, header, SECRET, { now })).toBe(true);
  });
});
