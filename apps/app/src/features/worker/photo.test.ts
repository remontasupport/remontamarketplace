// The profile photo after its confirm (bug 2026-10-16): the confirm answers the private staging address; the page waits
// for the clean copy before showing it, and says so when it is still being prepared.
import { describe, expect, it, vi } from "vitest";
import type { WorkerApi } from "./api";
import { isShownPhoto, waitForCleanPhoto } from "./photo";

const staged = "https://storage.googleapis.com/remonta-photos/staging/abc.jpg";
const clean = "https://x.public.blob.vercel-storage.com/workers/p1/abc.jpg";
const profileWith = (main: string | null) => ({ kind: "ok", body: { photos: { main } } });

describe("waitForCleanPhoto", () => {
  it("reads the profile fresh until the photo moved on from the staging address", async () => {
    const getProfile = vi.fn().mockResolvedValueOnce(profileWith(staged)).mockResolvedValueOnce(profileWith(staged)).mockResolvedValueOnce(profileWith(clean));
    const api = { getProfile } as unknown as WorkerApi;
    expect(await waitForCleanPhoto(staged, { api, sleep: async () => {} })).toEqual({ main: clean });
    expect(getProfile).toHaveBeenCalledTimes(3);
    expect(getProfile).toHaveBeenCalledWith({ cache: "reload" });
  });

  it("gives up after its time (the page then says the photo is still being prepared)", async () => {
    const api = { getProfile: vi.fn().mockResolvedValue(profileWith(staged)) } as unknown as WorkerApi;
    expect(await waitForCleanPhoto(staged, { api, sleep: async () => {}, timeoutMs: 0 })).toBeNull();
  });
});

describe("isShownPhoto", () => {
  it("the clean copy on Blob can be shown; the private staging copy cannot", () => {
    expect(isShownPhoto(clean)).toBe(true);
    expect(isShownPhoto(staged)).toBe(false);
    expect(isShownPhoto(null)).toBe(true);
  });
});
