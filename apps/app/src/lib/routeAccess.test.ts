import { describe, expect, it } from "vitest";
import { UserRole } from "@/types/auth";
import { accessFor, sessionCookieName } from "./routeAccess";

const as = (role: UserRole) => ({ id: "u1", role, email: "a@b.c" });

describe("route access (the middleware's rules)", () => {
  it("signed out, an incomplete token or a revoked session: sign in", () => {
    expect(accessFor("/dashboard/worker/profile/rates", null)).toEqual({ kind: "login" });
    expect(accessFor("/admin", { id: "u1", role: UserRole.ADMIN })).toEqual({ kind: "login" });
    expect(accessFor("/dashboard/worker", { ...as(UserRole.WORKER), revoked: true })).toEqual({ kind: "login" });
  });

  it("each area to its role; another role is unauthorized", () => {
    expect(accessFor("/dashboard/worker/profile/rates", as(UserRole.WORKER))).toEqual({ kind: "allow" });
    expect(accessFor("/dashboard/worker", as(UserRole.CLIENT))).toEqual({ kind: "unauthorized" });
    expect(accessFor("/dashboard/client/requests", as(UserRole.CLIENT))).toEqual({ kind: "allow" });
    expect(accessFor("/dashboard/client", as(UserRole.ADMIN))).toEqual({ kind: "unauthorized" });
    expect(accessFor("/dashboard/supportcoordinators", as(UserRole.COORDINATOR))).toEqual({ kind: "allow" });
    expect(accessFor("/dashboard/supportcoordinators/x", as(UserRole.WORKER))).toEqual({ kind: "unauthorized" });
    expect(accessFor("/apply/123", as(UserRole.WORKER))).toEqual({ kind: "allow" });
    expect(accessFor("/apply/123", as(UserRole.CLIENT))).toEqual({ kind: "unauthorized" });
    expect(accessFor("/admin/contractors/abc/profile", as(UserRole.ADMIN))).toEqual({ kind: "allow" });
    expect(accessFor("/admin", as(UserRole.WORKER))).toEqual({ kind: "unauthorized" });
  });

  it("a prefix is a whole path segment; /dashboard alone needs a sign-in only", () => {
    expect(accessFor("/dashboard/workers-list", as(UserRole.CLIENT))).toEqual({ kind: "allow" });
    expect(accessFor("/administrator", as(UserRole.WORKER))).toEqual({ kind: "allow" });
    expect(accessFor("/dashboard", as(UserRole.CLIENT))).toEqual({ kind: "allow" });
  });

  it("names the session cookie as lib/auth.config.ts sets it", () => {
    expect(sessionCookieName(true)).toBe("__Secure-next-auth.session-token");
    expect(sessionCookieName(false)).toBe("next-auth.session-token");
  });
});
