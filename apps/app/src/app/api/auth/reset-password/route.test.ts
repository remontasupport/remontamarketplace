// The reset by email link (2026-11-20): it stores the change time, so older sessions and api tokens are refused (U5d).
import { beforeEach, describe, expect, it, vi } from "vitest";

const findFirst = vi.fn();
const update = vi.fn();
vi.mock("@/lib/auth-prisma", () => ({ authPrisma: { user: { findFirst: (...a: unknown[]) => findFirst(...a), update: (...a: unknown[]) => update(...a) }, auditLog: { create: () => Promise.resolve() } } }));
vi.mock("@/lib/password", () => ({ hashPassword: async () => "hashed" }));
vi.mock("@/lib/ratelimit", () => ({ applyRateLimit: async () => ({ success: true }), strictApiRateLimit: {} }));

const { POST } = await import("./route");
const reset = (body: unknown) => POST(new Request("http://x/api/auth/reset-password", { method: "POST", body: JSON.stringify(body) }));

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    findFirst.mockReset();
    update.mockReset();
  });

  it("stores the new hash and the change time (older sessions are then refused), and clears the token", async () => {
    findFirst.mockResolvedValueOnce({ id: "u1" });
    const before = Date.now();
    const res = await reset({ token: "t", password: "Str0ng!Pass" });
    expect(res?.status).toBe(200);
    const data = (update.mock.calls[0]?.[0] as { data: Record<string, unknown> } | undefined)?.data;
    expect(data).toMatchObject({ passwordHash: "hashed", resetPasswordToken: null, resetPasswordExpires: null });
    const changedAt = data?.passwordChangedAt;
    expect(changedAt).toBeInstanceOf(Date);
    expect((changedAt as Date).getTime()).toBeGreaterThanOrEqual(before);
  });

  it("an unknown or expired token changes nothing", async () => {
    findFirst.mockResolvedValueOnce(null);
    expect((await reset({ token: "nope", password: "Str0ng!Pass" }))?.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });
});
