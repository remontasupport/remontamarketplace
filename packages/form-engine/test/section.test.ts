// The section mode (U2 R9): the import-time checks reject (a check that never fails may be
// unenforceable), seed and body are inverses, and the save path retries, refreshes the
// token once on 401, and maps the server's field errors.
import { workerContract } from "@remonta/api-contract";
import { describe, expect, it } from "vitest";
import { defineSection, errorFor, saveSection, sectionBody, seedSection, validateSection } from "../src/section";

const base = { contract: workerContract, readEntry: "getProfile", writeEntry: "putName", pick: "names" } as const;
const nameFields = [
  { name: "firstName", kind: "text", label: "First" },
  { name: "middleName", kind: "text", label: "Middle", nullable: true },
  { name: "lastName", kind: "text", label: "Last" },
] as const;

describe("defineSection refuses", () => {
  it.each([
    ["a field not in the body", { ...base, name: "x", title: "x", fields: [{ name: "nickname", kind: "text", label: "x" }] }, /nickname is not in the putName body/],
    ["a field twice", { ...base, name: "x", title: "x", fields: [...nameFields, { name: "lastName", kind: "text", label: "again" }] }, /lastName appears twice/],
    ["a pick not in the read", { ...base, name: "x", title: "x", pick: "names.nope", fields: [...nameFields] }, /pick names\.nope is not in the getProfile response/],
    ["an entry not in the contract", { ...base, name: "x", title: "x", writeEntry: "putNope", fields: [...nameFields] }, /putNope is not in the worker contract/],
    ["a missing path parameter", { ...base, name: "x", title: "x", writeEntry: "putAdditionalInfo", pick: "sections.additionalInfo", constants: { group: "religion" }, fields: [{ name: "religion", kind: "multiSelect", label: "x", options: [] }] }, /path parameter group has no value/],
    ["constants that match no union member", { ...base, name: "x", title: "x", writeEntry: "putAdditionalInfo", pick: "sections.additionalInfo", constants: { group: "nope" }, pathParams: { group: "nope" }, fields: [] }, /no member/],
  ])("%s", (_l, def, problem) => {
    expect(() => defineSection(def as never)).toThrow(problem);
  });
});

describe("seed, body, validation", () => {
  const name = defineSection({ ...base, name: "name", title: "Name", fields: [...nameFields] });
  it("seeds from the pick path and builds the body back; empty optional text is null", () => {
    const values = seedSection(name, { names: { firstName: "Mary", middleName: null, lastName: "Lee" } });
    expect(values).toEqual({ firstName: "Mary", middleName: "", lastName: "Lee" });
    expect(sectionBody(name, values)).toEqual({ firstName: "Mary", middleName: null, lastName: "Lee" });
    expect(validateSection(name, values)).toEqual({});
  });
  it("a missing section seeds each kind's empty value; validation is the contract's", () => {
    const values = seedSection(name, { names: null });
    expect(values).toEqual({ firstName: "", middleName: "", lastName: "" });
    const errors = validateSection(name, values);
    expect(Object.keys(errors).sort()).toEqual(["firstName", "lastName"]);
    expect(errorFor({ "slots.2.startMinute": ["Overlaps"] }, "slots")).toBe("Overlaps");
  });
  it("a union body resolves to the member the constants pick", () => {
    const religion = defineSection({ ...base, name: "religion", title: "Religion", writeEntry: "putAdditionalInfo", pick: "sections.additionalInfo", constants: { group: "religion" }, pathParams: { group: "religion" }, fields: [{ name: "religion", kind: "multiSelect", label: "x", options: [] }] });
    expect(sectionBody(religion, { religion: ["Buddhist"] })).toEqual({ group: "religion", religion: ["Buddhist"] });
    expect(validateSection(religion, { religion: ["Martian"] })).toHaveProperty("religion.0");
  });
});

describe("saveSection", () => {
  const name = defineSection({ ...base, name: "name", title: "Name", fields: [...nameFields] });
  const values = { firstName: "Mary", middleName: "", lastName: "Lee" };
  const json = (status: number, body: unknown, headers: Record<string, string> = {}) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
  const token = () => {
    const t = { calls: 0, invalidated: 0, getToken: async () => `t${++t.calls}`, invalidate: () => void t.invalidated++ };
    return t;
  };
  const fast = { sleep: async () => {}, baseDelayMs: 1 };

  it("sends one PUT with the body and the bearer token; returns the stored section", async () => {
    const seen: { method?: string; url: string; auth?: string; body?: string }[] = [];
    const fetch = (async (url: string, init: RequestInit) => {
      seen.push({ url, method: init.method, auth: (init.headers as Record<string, string>).authorization, body: String(init.body) });
      return json(200, { firstName: "Mary", middleName: null, lastName: "Lee" });
    }) as unknown as typeof globalThis.fetch;
    const r = await saveSection(name, values, { apiBaseUrl: "https://api.test", token: token(), fetch, retry: fast });
    expect(r).toEqual({ ok: true, body: { firstName: "Mary", middleName: null, lastName: "Lee" } });
    expect(seen).toEqual([{ url: "https://api.test/v1/worker/profile/name", method: "PUT", auth: "Bearer t1", body: JSON.stringify({ firstName: "Mary", middleName: null, lastName: "Lee" }) }]);
  });

  it("a 401 refreshes the token once, then succeeds; a 503 is retried honouring Retry-After", async () => {
    const answers = [json(401, { error: { code: "UNAUTHENTICATED", message: "x", requestId: "r" } }), json(503, { error: { code: "UNAVAILABLE", message: "x", requestId: "r" } }, { "retry-after": "1" }), json(200, { firstName: "Mary", middleName: null, lastName: "Lee" })];
    const auths: string[] = [];
    const fetch = (async (_u: string, init: RequestInit) => {
      auths.push((init.headers as Record<string, string>).authorization!);
      return answers.shift()!;
    }) as unknown as typeof globalThis.fetch;
    const t = token();
    const waits: number[] = [];
    const r = await saveSection(name, values, { apiBaseUrl: "https://api.test", token: t, fetch, retry: { ...fast, sleep: async (ms) => void waits.push(ms) } });
    expect(r.ok).toBe(true);
    expect(t.invalidated).toBe(1);
    expect(auths).toEqual(["Bearer t1", "Bearer t2", "Bearer t3"]);
    expect(waits).toContain(1000);
  });

  it("a 400 maps the server's fields; a second 401 is unauthenticated", async () => {
    const bad = (async () => json(400, { error: { code: "INVALID_REQUEST", message: "x", requestId: "r", fields: { lastName: ["Too long"] } } })) as unknown as typeof globalThis.fetch;
    expect(await saveSection(name, values, { apiBaseUrl: "https://api.test", token: token(), fetch: bad, retry: fast })).toEqual({ ok: false, kind: "invalid", fields: { lastName: ["Too long"] } });
    const denied = (async () => json(401, { error: { code: "UNAUTHENTICATED", message: "x", requestId: "r" } })) as unknown as typeof globalThis.fetch;
    expect(await saveSection(name, values, { apiBaseUrl: "https://api.test", token: token(), fetch: denied, retry: fast })).toEqual({ ok: false, kind: "unauthenticated" });
  });
});
