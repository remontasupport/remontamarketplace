// The profile preview action's access rule (security fix 2026-10-16). A "use server" export can be called by any
// browser with any arguments: a signed-out caller read any worker's profile, the stored bank account included.
import { beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.fn();
const findUnique = vi.fn();
vi.mock("next-auth", () => ({ getServerSession: () => session() }));
vi.mock("@/lib/auth.config", () => ({ authOptions: {} }));
vi.mock("@/lib/w1/read", () => ({ readAllPromoted: async () => ({}) }));
vi.mock("@/lib/auth-prisma", () => ({
  authPrisma: { workerProfile: { findUnique: (a: unknown) => findUnique(a) }, workerService: { findMany: async () => [] } },
}));

import { getProfilePreviewData } from "./profilePreview.service";

const row = { id: "wp1", userId: "worker-a", setupProgress: {}, firstName: "A", lastName: "B", photos: null, introduction: null, createdAt: new Date(0), city: null, state: null, postalCode: null, hasVehicle: null, workerAdditionalInfo: { languages: [] }, verificationRequirements: [] };

beforeEach(() => {
  session.mockReset();
  findUnique.mockReset().mockResolvedValue(row);
});

describe("getProfilePreviewData: who may read whose profile", () => {
  it("signed out: refused, with or without a user id, and nothing is read", async () => {
    session.mockResolvedValue(null);
    expect(await getProfilePreviewData("worker-a")).toMatchObject({ success: false });
    expect(await getProfilePreviewData()).toMatchObject({ success: false });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("a worker reads their own; another worker's is refused", async () => {
    session.mockResolvedValue({ user: { id: "worker-a", role: "WORKER" } });
    expect(await getProfilePreviewData()).toMatchObject({ success: true });
    expect(await getProfilePreviewData("worker-a")).toMatchObject({ success: true });
    findUnique.mockClear();
    expect(await getProfilePreviewData("worker-b")).toMatchObject({ success: false });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("admins, clients and coordinators may read a worker's profile", async () => {
    for (const role of ["ADMIN", "CLIENT", "COORDINATOR"]) {
      session.mockResolvedValue({ user: { id: `someone-${role}`, role } });
      expect(await getProfilePreviewData("worker-a"), role).toMatchObject({ success: true });
    }
  });

  it("the bank account is never read", async () => {
    session.mockResolvedValue({ user: { id: "worker-a", role: "WORKER" } });
    await getProfilePreviewData();
    const select = (findUnique.mock.calls[0]![0] as { select: { workerAdditionalInfo: { select: Record<string, unknown> } } }).select;
    expect(select.workerAdditionalInfo.select).not.toHaveProperty("bankAccount");
  });
});
