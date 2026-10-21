// The tour's two calls (onboarding-tour U2 Step 2): the requests the client sends (the paths, the methods, the bearer
// token, no body on the save) and the outcomes the tour reads (the time, a 429 with its Retry-After, a 403).
import { describe, expect, it } from "vitest";
import { createWorkerApi } from "./api";

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

function api(answer: () => Response) {
  const seen: { line: string; auth: string | null; body: unknown }[] = [];
  const client = createWorkerApi({
    baseUrl: "https://api.test",
    tokenSource: { getToken: async () => "tkn", invalidate: () => {} },
    fetch: async (input, init) => {
      seen.push({ line: `${init?.method} ${String(input)}`, auth: new Headers(init?.headers).get("authorization"), body: init?.body ?? null });
      return answer();
    },
  });
  return { client, seen };
}

describe("workerApi.getTour", () => {
  it("GETs /v1/worker/tour with the token and passes the time through", async () => {
    const { client, seen } = api(() => json(200, { seenAt: "2026-10-21T02:14:05.972Z" }));
    expect(await client.getTour()).toEqual({ kind: "ok", body: { seenAt: "2026-10-21T02:14:05.972Z" } });
    expect(seen).toEqual([{ line: "GET https://api.test/v1/worker/tour", auth: "Bearer tkn", body: null }]);
  });
  it("passes null through (not seen)", async () => {
    const { client } = api(() => json(200, { seenAt: null }));
    expect(await client.getTour()).toEqual({ kind: "ok", body: { seenAt: null } });
  });
});

describe("workerApi.putTourSeen", () => {
  it("PUTs /v1/worker/tour/seen with the token and no body", async () => {
    const { client, seen } = api(() => json(200, { seenAt: "2026-10-21T02:14:05.972Z" }));
    expect(await client.putTourSeen()).toEqual({ kind: "ok", body: { seenAt: "2026-10-21T02:14:05.972Z" } });
    expect(seen).toEqual([{ line: "PUT https://api.test/v1/worker/tour/seen", auth: "Bearer tkn", body: null }]);
  });
  it("a 429 is rateLimited with the api's Retry-After", async () => {
    const { client } = api(() => json(429, { error: { code: "RATE_LIMITED", message: "Too many requests.", requestId: "r1" } }, { "retry-after": "7" }));
    expect(await client.putTourSeen()).toEqual({ kind: "rateLimited", retryAfterSeconds: 7 });
  });
  it("a 403 (impersonating) is forbidden", async () => {
    const { client } = api(() => json(403, { error: { code: "FORBIDDEN", message: "Forbidden.", requestId: "r1" } }));
    expect(await client.putTourSeen()).toEqual({ kind: "forbidden" });
  });
});
