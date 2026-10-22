// worker-tools U2 Step 2: the two tools calls -- the requests the client sends and the outcomes the screen reads.
import { describe, expect, it } from "vitest";
import { createWorkerApi } from "./api";

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function api(answer: () => Response) {
  const seen: { line: string; auth: string | null; body: unknown }[] = [];
  const client = createWorkerApi({
    baseUrl: "https://api.test",
    tokenSource: { getToken: async () => "tkn", invalidate: () => {} },
    fetch: async (input, init) => {
      seen.push({ line: `${init?.method} ${String(input)}`, auth: new Headers(init?.headers).get("authorization"), body: init?.body ? JSON.parse(String(init.body)) : null });
      return answer();
    },
  });
  return { client, seen };
}

describe("workerApi.getServiceTools", () => {
  it("GETs /v1/worker/services/tools with the token", async () => {
    const view = { services: [{ categoryId: "cleaning-services", toolIds: ["vacuum-cleaner"], otherTools: ["Hose"] }] };
    const { client, seen } = api(() => json(200, view));
    expect(await client.getServiceTools()).toEqual({ kind: "ok", body: view });
    expect(seen).toEqual([{ line: "GET https://api.test/v1/worker/services/tools", auth: "Bearer tkn", body: null }]);
  });
});

describe("workerApi.putServiceTools", () => {
  it("PUTs the service's path with the body", async () => {
    const answer = { categoryId: "home-yard-maintenance", toolIds: ["ladder"], otherTools: [] };
    const { client, seen } = api(() => json(200, answer));
    expect(await client.putServiceTools("home-yard-maintenance", { toolIds: ["ladder"], otherTools: [] })).toEqual({ kind: "ok", body: answer });
    expect(seen).toEqual([{ line: "PUT https://api.test/v1/worker/services/home-yard-maintenance/tools", auth: "Bearer tkn", body: { toolIds: ["ladder"], otherTools: [] } }]);
  });

  it("a 400 carries the api's field message; a 404 is a failure", async () => {
    const refused = await api(() => json(400, { error: { code: "INVALID_REQUEST", message: "x", requestId: "r1", fields: { otherTools: ["Up to 5 other tools"] } } })).client.putServiceTools("cleaning-services", { toolIds: [], otherTools: [] });
    expect(refused).toMatchObject({ kind: "failed", status: 400, fields: { otherTools: ["Up to 5 other tools"] } });
    const missing = await api(() => json(404, { error: { code: "NOT_FOUND", message: "x", requestId: "r2" } })).client.putServiceTools("cleaning-services", { toolIds: [], otherTools: [] });
    expect(missing).toMatchObject({ status: 404 });
  });
});
