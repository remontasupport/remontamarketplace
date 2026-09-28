import { afterEach, describe, expect, it, vi } from "vitest";

// The database-backed half runs only against a local PostGIS with au_localities
// loaded (TEST_DATABASE_URL); CI for apps/app has no database, so it skips there.
const url = process.env.TEST_DATABASE_URL;
const local = url ? ["localhost", "127.0.0.1"].includes(new URL(url).hostname) : false;

describe.skipIf(!local)("searchSuburbs on au_localities", () => {
  async function load() {
    vi.resetModules();
    process.env.AUTH_DATABASE_URL = url;
    return (await import("./index")).searchSuburbs;
  }

  it("ranks name-prefix matches first, then later words, at most 10", async () => {
    const search = await load();
    const r = await search("parra");
    expect(r.length).toBeGreaterThan(1);
    expect(r.length).toBeLessThanOrEqual(10);
    expect(r[0]!.name.toLowerCase().startsWith("parra")).toBe(true);
    expect(r.some((s) => s.name === "North Parramatta")).toBe(true);
    const firstLaterWord = r.findIndex((s) => !s.name.toLowerCase().startsWith("parra"));
    expect(r.slice(firstLaterWord).every((s) => !s.name.toLowerCase().startsWith("parra"))).toBe(true);
  });

  it("keeps the shape callers use, with an id, and postcodes as 4-digit strings", async () => {
    const search = await load();
    const [p] = await search("parramatta 2150");
    expect(p).toEqual({ id: expect.any(Number), name: "Parramatta", postcode: "2150", state: { abbreviation: "NSW" } });
    const alice = await search("alice springs");
    expect(alice[0]!.postcode).toBe("0870"); // Google's path returned 870
  });

  it("finds by postcode and by a later word", async () => {
    const search = await load();
    expect((await search("3004")).some((s) => s.name === "Melbourne")).toBe(true);
    expect((await search("kilda")).filter((s) => s.name === "St Kilda").length).toBeGreaterThanOrEqual(2);
  });

  it("treats LIKE wildcards in the input literally", async () => {
    const search = await load();
    expect(await search("%%")).toEqual([]);
    expect(await search("__")).toEqual([]);
  });
});

describe("escapeLike", () => {
  it("escapes %, _ and the backslash itself, and nothing else", async () => {
    const { escapeLike } = await import("./index");
    expect(escapeLike("50%_a\\b")).toBe("50\\%\\_a\\\\b");
    expect(escapeLike("St Kilda")).toBe("St Kilda");
  });
});

describe("searchSuburbs before the S1 migration", () => {
  afterEach(() => {
    vi.doUnmock("@/lib/auth-prisma");
    vi.doUnmock("./google");
    vi.resetModules();
  });

  it("falls back to the Google lookup when au_localities does not exist, padding postcodes", async () => {
    vi.resetModules();
    vi.doMock("@/lib/auth-prisma", () => ({
      authPrisma: { $queryRaw: () => Promise.reject(Object.assign(new Error('relation "au_localities" does not exist'), { code: "P2010", meta: { code: "42P01" } })) },
    }));
    vi.doMock("./google", () => ({ googleSuburbs: async () => [{ name: "Alice Springs", postcode: 870, state: { abbreviation: "NT" } }] }));
    const { searchSuburbs } = await import("./index");
    expect(await searchSuburbs("alice")).toEqual([{ id: null, name: "Alice Springs", postcode: "0870", state: { abbreviation: "NT" } }]);
  });

  it("does not hide any other database error behind the fallback", async () => {
    vi.resetModules();
    vi.doMock("@/lib/auth-prisma", () => ({ authPrisma: { $queryRaw: () => Promise.reject(new Error("connection refused")) } }));
    const google = vi.fn();
    vi.doMock("./google", () => ({ googleSuburbs: google }));
    const { searchSuburbs } = await import("./index");
    await expect(searchSuburbs("alice")).rejects.toThrow("connection refused");
    expect(google).not.toHaveBeenCalled();
  });
});
