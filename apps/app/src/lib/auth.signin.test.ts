import bcrypt from "bcryptjs";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// The real sign-in (authOptions' credentials authorize) against a local Postgres
// (TEST_DATABASE_URL; skipped in CI). Redis is replaced by a recorder, so the test
// sees every read and write of the cache.
const url = process.env.TEST_DATABASE_URL;
const local = url ? ["localhost", "127.0.0.1"].includes(new URL(url).hostname) : false;
const EMAIL = "signin-cache-test@signin-test.example";

// A working in-memory cache, so that code which caches the account would really
// serve the stale copy -- the test must fail against the previous version.
const { cacheCalls, store } = vi.hoisted(() => ({ cacheCalls: [] as string[], store: new Map<string, unknown>() }));
vi.mock("./redis", () => ({
  CACHE_KEYS: { user: (e: string) => `user:v:${e.toLowerCase()}` },
  CACHE_TTL: { USER_DATA: 3600 },
  getCached: async (k: string) => (cacheCalls.push(`get ${k}`), store.get(k) ?? null),
  setCached: async (k: string, v: unknown) => void (cacheCalls.push(`set ${k}`), store.set(k, v)),
  invalidateCache: async (...ks: string[]) => void ks.forEach((k) => (cacheCalls.push(`del ${k}`), store.delete(k))),
  getOrFetch: async (k: string, fetch: () => Promise<unknown>) => {
    cacheCalls.push(`getOrFetch ${k}`);
    if (!store.has(k)) store.set(k, await fetch());
    return store.get(k);
  },
}));

describe.skipIf(!local)("sign-in reads the account fresh, every time", () => {
  type Authorize = (c: Record<string, string>) => Promise<unknown>;
  let authorize: Authorize;
  let prisma: typeof import("./auth-prisma").authPrisma;

  beforeAll(async () => {
    process.env.AUTH_DATABASE_URL = url;
    ({ authPrisma: prisma } = await import("./auth-prisma"));
    const { authOptions } = await import("./auth.config");
    authorize = (authOptions.providers[0] as unknown as { options: { authorize: Authorize } }).options.authorize;
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    await prisma.user.create({ data: { id: "signin-test-user", email: EMAIL, passwordHash: bcrypt.hashSync("OldPass1!", 4), role: "WORKER", status: "ACTIVE", updatedAt: new Date() } });
  });
  afterAll(async () => {
    await prisma?.auditLog.deleteMany({ where: { userId: "signin-test-user" } });
    await prisma?.user.deleteMany({ where: { email: EMAIL } });
    await prisma?.$disconnect();
  });

  it("signs in, with the email in any letter case", async () => {
    expect(await authorize({ email: EMAIL.toUpperCase(), password: "OldPass1!" })).toMatchObject({ id: "signin-test-user" });
  });

  it("after a password reset, the OLD password stops working at once and the new one works", async () => {
    await authorize({ email: EMAIL, password: "OldPass1!" }); // the account was just used
    await prisma.user.update({ where: { id: "signin-test-user" }, data: { passwordHash: bcrypt.hashSync("NewPass1!", 4) } }); // what reset-password does
    await expect(authorize({ email: EMAIL, password: "OldPass1!" })).rejects.toThrow("Invalid credentials");
    expect(await authorize({ email: EMAIL, password: "NewPass1!" })).toMatchObject({ id: "signin-test-user" });
  });

  it("a suspended account is refused at once", async () => {
    await prisma.user.update({ where: { id: "signin-test-user" }, data: { status: "SUSPENDED" } });
    await expect(authorize({ email: EMAIL, password: "NewPass1!" })).rejects.toThrow(/suspended/i);
    await prisma.user.update({ where: { id: "signin-test-user" }, data: { status: "ACTIVE" } });
  });

  it("never reads or writes the account record in the cache", () => {
    expect(cacheCalls.filter((c) => /^(get|set|getOrFetch) user:/.test(c))).toEqual([]);
  });
});
