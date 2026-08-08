import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

// One chainable stub standing in for supabase.from(...).select(...).eq(...).maybeSingle()
let result;
vi.mock("../lib/supabase", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => {
            if (result instanceof Error) throw result;
            return result;
          },
        }),
      }),
    }),
  },
}));

const { useEntitlement } = await import("./useEntitlement");

const user = { id: "user-1" };

beforeEach(() => { result = { data: null, error: null }; });

describe("useEntitlement", () => {
  it("reports a pro subscriber", async () => {
    result = { data: { plan: 'pro' }, error: null };
    const { result: hook } = renderHook(() => useEntitlement(user));
    await waitFor(() => expect(hook.current.loading).toBe(false));
    expect(hook.current.isPro).toBe(true);
    expect(hook.current.knownFree).toBe(false);
  });

  it("reports a confirmed free account as knownFree", async () => {
    result = { data: { plan: 'free' }, error: null };
    const { result: hook } = renderHook(() => useEntitlement(user));
    await waitFor(() => expect(hook.current.loading).toBe(false));
    expect(hook.current.isPro).toBe(false);
    expect(hook.current.knownFree).toBe(true);
  });

  it("treats a user with no row as knownFree", async () => {
    result = { data: null, error: null };
    const { result: hook } = renderHook(() => useEntitlement(user));
    await waitFor(() => expect(hook.current.loading).toBe(false));
    expect(hook.current.knownFree).toBe(true);
  });

  // The regression that matters. Before the migration is applied the table does
  // not exist and this read fails in every environment, CI included. It must
  // come back "unknown", never "free" — a false `knownFree` makes the client
  // block assists even with the server's PAYWALL_ENABLED kill switch off.
  it("reports unknown, not free, when the table read errors", async () => {
    result = { data: null, error: { message: 'relation "subscriptions" does not exist' } };
    const { result: hook } = renderHook(() => useEntitlement(user));
    await waitFor(() => expect(hook.current.loading).toBe(false));
    expect(hook.current.known).toBe(false);
    expect(hook.current.knownFree).toBe(false);
    expect(hook.current.isPro).toBe(false);
  });

  it("reports unknown when the query throws outright", async () => {
    result = new Error('network down');
    const { result: hook } = renderHook(() => useEntitlement(user));
    await waitFor(() => expect(hook.current.loading).toBe(false));
    expect(hook.current.known).toBe(false);
    expect(hook.current.knownFree).toBe(false);
  });

  it("is inert with no signed-in user", async () => {
    const { result: hook } = renderHook(() => useEntitlement(null));
    await waitFor(() => expect(hook.current.loading).toBe(false));
    expect(hook.current.known).toBe(false);
    expect(hook.current.knownFree).toBe(false);
  });
});
