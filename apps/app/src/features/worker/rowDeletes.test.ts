// The Experience delete (2026-10-14): which rows go through the api, how the confirm names them, and the request
// the client sends (DELETE, the domain in the address, no body, the bearer token).
import { describe, expect, it } from "vitest";
import type { Profile } from "@remonta/api-contract";
import { createWorkerApi } from "./api";
import { ROW_DELETES } from "./rowDeletes";

const profileWith = (domains: string[]) => ({ sections: { experience: domains.map((domain) => ({ domain })) } }) as unknown as Profile;

describe("ROW_DELETES.experience", () => {
  const d = ROW_DELETES.experience!;
  it("sits on the domains list", () => {
    expect(d.field).toBe("domains");
  });
  it("a row is stored when the profile holds its domain; a new row is not", () => {
    expect(d.isStored({ domain: "DISABILITY" }, profileWith(["AGED_CARE", "DISABILITY"]))).toBe(true);
    expect(d.isStored({ domain: "MENTAL_HEALTH" }, profileWith(["AGED_CARE"]))).toBe(false);
    expect(d.isStored({ domain: "" }, profileWith(["AGED_CARE"]))).toBe(false);
  });
  it("names the row by its area's label", () => {
    expect(d.describe({ domain: "DISABILITY" })).not.toBe("DISABILITY");
    expect(d.describe({ domain: "nope" })).toBe("this area");
  });
});

describe("workerApi.deleteExperience", () => {
  it("sends DELETE /v1/worker/experience/<domain> with no body and the token; the answer is the areas left", async () => {
    const seen: { url: string; init?: RequestInit }[] = [];
    const api = createWorkerApi({
      baseUrl: "https://api.test",
      tokenSource: { getToken: async () => "tkn", invalidate: () => {} },
      fetch: async (input, init) => {
        seen.push({ url: String(input), init });
        return new Response(JSON.stringify({ domains: [] }), { status: 200, headers: { "content-type": "application/json" } });
      },
    });
    const r = await api.deleteExperience("DISABILITY");
    expect(r).toEqual({ kind: "ok", body: { domains: [] } });
    expect(seen).toHaveLength(1);
    expect(seen[0]!.url).toBe("https://api.test/v1/worker/experience/DISABILITY");
    expect(seen[0]!.init?.method).toBe("DELETE");
    expect(seen[0]!.init?.body ?? undefined).toBeUndefined();
    expect(new Headers(seen[0]!.init?.headers).get("authorization")).toBe("Bearer tkn");
  });
});
