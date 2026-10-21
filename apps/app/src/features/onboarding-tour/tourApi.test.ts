// The tour's read and save (onboarding-tour U2 Step 5): resiliency scenarios R1-R5 (NFR design P7) with a fake api
// and fake timers, and the retry delay's property (P8).
import fc from "fast-check";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiOutcome } from "@/lib/api/outcome";
import type { TourView } from "@remonta/api-contract";
import { markTourSeen, readTourSeen, retryDelay, TOUR_READ_DEADLINE_MS, type TourApi } from "./tourApi";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const ok = (seenAt: string | null): ApiOutcome<TourView> => ({ kind: "ok", body: { seenAt } });

function fakeApi(opts: { get?: () => Promise<ApiOutcome<TourView>>; puts?: ApiOutcome<TourView>[] } = {}) {
  const calls = { get: 0, put: 0 };
  const puts = [...(opts.puts ?? [])];
  const api: TourApi = {
    getTour: async () => {
      calls.get++;
      return opts.get ? opts.get() : ok(null);
    },
    putTourSeen: async () => {
      calls.put++;
      return puts.shift() ?? ok("2026-10-21T02:14:05.972Z");
    },
  };
  return { api, calls };
}

describe("readTourSeen (L2)", () => {
  it("a timely 200 with null is unseen; with a time, seen", async () => {
    expect(await readTourSeen(fakeApi().api)).toBe("unseen");
    expect(await readTourSeen(fakeApi({ get: async () => ok("2026-10-20T00:00:00.000Z") }).api)).toBe("seen");
  });
  it("R1: a 500, a 503, a 401, a 403 or a thrown error is unknown", async () => {
    for (const r of [{ kind: "failed", status: 500 }, { kind: "unavailable" }, { kind: "unauthenticated" }, { kind: "forbidden" }] as ApiOutcome<TourView>[]) {
      expect(await readTourSeen(fakeApi({ get: async () => r }).api)).toBe("unknown");
    }
    expect(await readTourSeen(fakeApi({ get: async () => Promise.reject(new Error("network")) }).api)).toBe("unknown");
  });
  it("R1, R2: no answer within 3 s is unknown, and an answer after that is dropped", async () => {
    let answer: (r: ApiOutcome<TourView>) => void = () => {};
    const { api } = fakeApi({ get: () => new Promise((r) => (answer = r)) });
    const p = readTourSeen(api);
    await vi.advanceTimersByTimeAsync(TOUR_READ_DEADLINE_MS);
    answer(ok(null));
    expect(await p).toBe("unknown");
  });
  it("an answer just inside the deadline counts", async () => {
    const { api } = fakeApi({ get: () => new Promise((r) => setTimeout(() => r(ok(null)), TOUR_READ_DEADLINE_MS - 1)) });
    const p = readTourSeen(api);
    await vi.advanceTimersByTimeAsync(TOUR_READ_DEADLINE_MS - 1);
    expect(await p).toBe("unseen");
  });
});

describe("markTourSeen (L3)", () => {
  it("one call when it works", async () => {
    const { api, calls } = fakeApi();
    await markTourSeen(api).done;
    expect(calls.put).toBe(1);
  });
  it("R3: a failure, then one retry after 5 s that works", async () => {
    const { api, calls } = fakeApi({ puts: [{ kind: "unavailable" }] });
    const m = markTourSeen(api);
    await vi.advanceTimersByTimeAsync(4999);
    expect(calls.put).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    await m.done;
    expect(calls.put).toBe(2);
  });
  it("R4: two failures, and no third call", async () => {
    const { api, calls } = fakeApi({ puts: [{ kind: "failed", status: 502 }, { kind: "failed", status: 503 }] });
    const m = markTourSeen(api);
    await vi.advanceTimersByTimeAsync(60_000);
    await m.done;
    expect(calls.put).toBe(2);
  });
  it("R5: a 429 with Retry-After 7 waits 7 s", async () => {
    const { api, calls } = fakeApi({ puts: [{ kind: "rateLimited", retryAfterSeconds: 7 }] });
    const m = markTourSeen(api);
    await vi.advanceTimersByTimeAsync(6999);
    expect(calls.put).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    await m.done;
    expect(calls.put).toBe(2);
  });
  it("401, 403 (impersonating) and a 404 are not retried", async () => {
    for (const r of [{ kind: "unauthenticated" }, { kind: "forbidden" }, { kind: "failed", status: 404 }] as ApiOutcome<TourView>[]) {
      const { api, calls } = fakeApi({ puts: [r] });
      const m = markTourSeen(api);
      await vi.advanceTimersByTimeAsync(60_000);
      await m.done;
      expect(calls.put).toBe(1);
    }
  });
  it("a thrown error counts as unavailable (one retry)", async () => {
    let n = 0;
    const api: TourApi = { getTour: async () => ok(null), putTourSeen: async () => (n++ === 0 ? Promise.reject(new Error("network")) : ok("x")) };
    const m = markTourSeen(api);
    await vi.advanceTimersByTimeAsync(5000);
    await m.done;
    expect(n).toBe(2);
  });
  it("cancel stops a pending retry (sign-out, leaving the dashboard)", async () => {
    const { api, calls } = fakeApi({ puts: [{ kind: "unavailable" }] });
    const m = markTourSeen(api);
    await vi.advanceTimersByTimeAsync(1000);
    m.cancel();
    await vi.advanceTimersByTimeAsync(60_000);
    await m.done;
    expect(calls.put).toBe(1);
  });
});

describe("retryDelay (P8)", () => {
  it("property: any value gives 0..30 s; absent, negative, NaN, infinite or not a number gives 5 s", () => {
    fc.assert(
      fc.property(fc.oneof(fc.double(), fc.integer({ min: -10, max: 10_000 }), fc.constant(undefined), fc.string(), fc.constant(null)), (v) => {
        const d = retryDelay(v);
        expect(d).toBeGreaterThanOrEqual(0);
        expect(d).toBeLessThanOrEqual(30);
        const usable = typeof v === "number" && Number.isFinite(v) && v >= 0;
        expect(d).toBe(usable ? Math.min(v as number, 30) : 5);
      }),
    );
  });
});
