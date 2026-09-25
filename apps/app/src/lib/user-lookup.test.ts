import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Against a local Postgres with the app schema (TEST_DATABASE_URL); skipped in CI.
// The index-plan check lives on the S1 branch, which adds the index.
const url = process.env.TEST_DATABASE_URL;
const local = url ? ["localhost", "127.0.0.1"].includes(new URL(url).hostname) : false;
const DOMAIN = "lookup-test.example";

describe.skipIf(!local)("userIdByEmail", () => {
  let lookup: (e: string) => Promise<string | null>;
  let prisma: typeof import("@/lib/auth-prisma").authPrisma;

  beforeAll(async () => {
    process.env.AUTH_DATABASE_URL = url;
    ({ authPrisma: prisma } = await import("@/lib/auth-prisma"));
    ({ userIdByEmail: lookup } = await import("./user-lookup"));
    await prisma.user.deleteMany({ where: { email: { endsWith: `@${DOMAIN}` } } });
    const mk = (id: string, email: string, createdAt: Date) => prisma.user.create({ data: { id, email, passwordHash: "x", role: "WORKER", updatedAt: new Date(), createdAt } });
    await mk("lk-axb", `axb@${DOMAIN}`, new Date("2024-01-01"));
    await mk("lk-mary", `Mary.Smith@${DOMAIN}`, new Date("2024-01-02"));
    // Case-variants of one address can exist: users.email is unique case-sensitively.
    await mk("lk-dup-old", `dup@${DOMAIN}`, new Date("2024-01-03"));
    await mk("lk-dup-new", `DUP@${DOMAIN}`, new Date("2024-06-01"));
  });
  afterAll(async () => {
    await prisma?.user.deleteMany({ where: { email: { endsWith: `@${DOMAIN}` } } });
    await prisma?.$disconnect();
  });

  it("finds a user whatever the letter case, and trims", async () => {
    expect(await lookup(`mary.smith@${DOMAIN}`)).toBe("lk-mary");
    expect(await lookup(`  MARY.SMITH@${DOMAIN.toUpperCase()} `)).toBe("lk-mary");
  });

  it("treats _ and % literally -- they matched other accounts with mode: insensitive", async () => {
    expect(await lookup(`a_b@${DOMAIN}`)).toBeNull();
    expect(await lookup(`%@${DOMAIN}`)).toBeNull();
    expect(await lookup(`%`)).toBeNull();
  });

  it("picks the oldest of case-variant duplicates, deterministically", async () => {
    expect(await lookup(`Dup@${DOMAIN}`)).toBe("lk-dup-old");
  });

});
