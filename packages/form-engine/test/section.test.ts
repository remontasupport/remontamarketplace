// The section mode (U2 R9): the import-time checks reject (a check that never fails may be
// unenforceable), seed and body are inverses, and the save path retries, refreshes the
// token once on 401, and maps the server's field errors.
import { defineContract, workerContract } from "@remonta/api-contract";
import * as z from "zod";
import { describe, expect, it } from "vitest";
import { defineSection, emptyValuesOf, errorFor, saveSection, sectionBody, seedFromSaved, seedSection, setPath, validateSection } from "../src/section";

const base = { contract: workerContract, readEntry: "getProfile", writeEntry: "putName", pick: "names" } as const;

// The worker contract has no path parameter and no union body since 2026-10-14 (one entry per additional-details
// group); the engine still supports both, so its guards are proved on a test-only contract with one entry of each.
const groupA = z.strictObject({ group: z.literal("a"), a: z.string() });
const groupB = z.strictObject({ group: z.literal("b"), b: z.string() });
const testContract = defineContract("test", {
  ...workerContract.entries,
  putGroup: { ...workerContract.entries.putName, path: "/v1/test/:group", pathParams: z.strictObject({ group: z.enum(["a", "b"]) }), body: { kind: "json", schema: z.discriminatedUnion("group", [groupA, groupB]) }, responses: { 200: groupA } },
});
const groupBase = { contract: testContract, readEntry: "getProfile", writeEntry: "putGroup", pick: "names" } as const;
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
    ["a missing path parameter", { ...groupBase, name: "x", title: "x", constants: { group: "a" }, fields: [{ name: "a", kind: "text", label: "x" }] }, /path parameter group has no value/],
    ["constants that match no union member", { ...groupBase, name: "x", title: "x", constants: { group: "nope" }, pathParams: { group: "nope" }, fields: [] }, /no member/],
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
  it("an additional-details group saves through its own entry, its body only its own field (2026-10-14: one entry per group)", () => {
    const religion = defineSection({ ...base, name: "religion", title: "Religion", writeEntry: "putReligion", pick: "sections.additionalInfo", fields: [{ name: "religion", kind: "multiSelect", label: "x", options: [] }] });
    expect(sectionBody(religion, { religion: ["Buddhist"] })).toEqual({ religion: ["Buddhist"] });
    expect(validateSection(religion, { religion: ["Martian"] })).toHaveProperty("religion.0");
    expect(() => defineSection({ ...base, name: "religion", title: "Religion", writeEntry: "putReligion", pick: "sections.additionalInfo", fields: [{ name: "languages", kind: "multiSelect", label: "x", options: [] }] })).toThrow(/not in the putReligion body/);
  });
});

describe("a list's rowKey (2026-10-14: the row delete)", () => {
  const jobs = defineSection({
    ...base,
    name: "jobs",
    title: "Jobs",
    writeEntry: "putJobHistory",
    pick: "sections.jobHistory",
    fields: [{ name: "entries", kind: "orderedList", label: "Jobs", addLabel: "Add", rowKey: "id", itemFields: [{ name: "jobTitle", kind: "text", label: "t" }, { name: "company", kind: "text", label: "c" }] }],
  });
  it("keeps the read's id on each row and never sends it", () => {
    const values = seedSection(jobs, { sections: { jobHistory: [{ id: "cm1", jobTitle: "Carer", company: "Acme" }] } });
    expect(values).toEqual({ entries: [{ id: "cm1", jobTitle: "Carer", company: "Acme" }] });
    expect(JSON.stringify(sectionBody(jobs, values))).not.toContain("cm1");
  });
  it("a save's answer refreshes the ids (a replace assigns new ones)", () => {
    expect(seedFromSaved(jobs, { entries: [{ id: "cm2", jobTitle: "Carer", company: "Acme" }] })).toEqual({ entries: [{ id: "cm2", jobTitle: "Carer", company: "Acme" }] });
  });
});

describe("seedFromSaved", () => {
  it("a write's answer seeds the same values as the read it replaces", () => {
    const name = defineSection({ ...base, name: "name", title: "Name", fields: [...nameFields] });
    expect(seedFromSaved(name, { firstName: "Mary", middleName: null, lastName: "Lee" })).toEqual(seedSection(name, { names: { firstName: "Mary", middleName: null, lastName: "Lee" } }));
    const bio = defineSection({ ...base, name: "bio", title: "Bio", writeEntry: "putBio", pick: "bio", fields: [{ name: "bio", kind: "textarea", label: "x" }] });
    expect(seedFromSaved(bio, { bio: "Ten years" })).toEqual(seedSection(bio, { bio: "Ten years" }));
    const religion = defineSection({ ...base, name: "religion", title: "Religion", writeEntry: "putReligion", pick: "sections.additionalInfo", fields: [{ name: "religion", kind: "multiSelect", label: "x", options: [] }] });
    expect(seedFromSaved(religion, { religion: ["Buddhist"] })).toEqual({ religion: ["Buddhist"] });
  });
});

describe("setPath", () => {
  it("replaces a nested value, indexes arrays, and leaves the input unchanged", () => {
    const before = { names: { firstName: "A" }, entries: [{ year: "2020" }, { year: "2021" }] };
    const after = setPath(before, "entries.1.year", "2022");
    expect(after.entries).toEqual([{ year: "2020" }, { year: "2022" }]);
    expect(Array.isArray(after.entries)).toBe(true);
    expect(before.entries[1]!.year).toBe("2021");
    expect(setPath(before, "names.firstName", "B").names).toEqual({ firstName: "B" });
    expect(setPath({}, "sections.availability", [])).toEqual({ sections: { availability: [] } });
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

describe("emptyValuesOf", () => {
  it("gives each kind its empty value", () => {
    expect(emptyValuesOf([{ name: "a", kind: "text", label: "a" }, { name: "b", kind: "multiSelect", label: "b", options: [] }, { name: "c", kind: "checkbox", label: "c" }, { name: "d", kind: "select", label: "d", options: [], nullable: true }])).toEqual({ a: "", b: [], c: false, d: null });
  });
});
