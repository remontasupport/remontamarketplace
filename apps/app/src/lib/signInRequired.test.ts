// The routes' sign-in check (2026-11-20): a 401 with nobody signed in (or a revoked session, which has no user), else null.
import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSession = vi.fn();
vi.mock("next-auth/next", () => ({ getServerSession: (...a: unknown[]) => getServerSession(...a) }));
vi.mock("./auth.config", () => ({ authOptions: {} }));

const { signInRequired } = await import("./auth");

describe("signInRequired", () => {
  beforeEach(() => getServerSession.mockReset());

  it("401 when nobody is signed in, or the session has no user", async () => {
    for (const session of [null, { user: undefined }]) {
      getServerSession.mockResolvedValueOnce(session);
      const denied = await signInRequired();
      expect(denied?.status).toBe(401);
      expect(await denied?.json()).toEqual({ error: "Sign in required" });
    }
  });

  it("null when someone is signed in", async () => {
    getServerSession.mockResolvedValueOnce({ user: { id: "u1", role: "WORKER", email: "a@b.c" } });
    expect(await signInRequired()).toBeNull();
  });
});
