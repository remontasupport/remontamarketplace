import { afterEach, describe, expect, it, vi } from "vitest";
import { appBaseUrl, CANONICAL_APP_URL } from "./app-url";

const prod = { VERCEL_ENV: "production", VERCEL_URL: "remonta-app-abc123.vercel.app", NODE_ENV: "production" };
const preview = { VERCEL_ENV: "preview", VERCEL_URL: "remonta-app-git-fix-remontasupport.vercel.app", NODE_ENV: "production" };

describe("appBaseUrl", () => {
  afterEach(() => vi.restoreAllMocks());

  it("prefers NEXT_PUBLIC_APP_URL, then NEXTAUTH_URL, without a trailing slash", () => {
    expect(appBaseUrl({ ...prod, NEXT_PUBLIC_APP_URL: "https://app.example/", NEXTAUTH_URL: "https://other.example" })).toBe("https://app.example");
    expect(appBaseUrl({ ...prod, NEXTAUTH_URL: "https://app.example//" })).toBe("https://app.example");
  });

  it("never links to localhost from a Vercel deployment (the production bug)", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(appBaseUrl({ ...prod, NEXTAUTH_URL: "http://localhost:3000/" })).toBe(CANONICAL_APP_URL);
    expect(appBaseUrl(prod)).toBe(CANONICAL_APP_URL);
    expect(console.error).toHaveBeenCalled();
  });

  it("uses the deployment's own host on a preview", () => {
    expect(appBaseUrl({ ...preview, NEXTAUTH_URL: "http://localhost:3000" })).toBe("https://remonta-app-git-fix-remontasupport.vercel.app");
  });

  it("keeps localhost for local development", () => {
    expect(appBaseUrl({ NODE_ENV: "development", NEXTAUTH_URL: "http://localhost:3000/" })).toBe("http://localhost:3000");
    expect(appBaseUrl({ NODE_ENV: "development" })).toBe("http://localhost:3000");
  });

  it("builds a reset link with exactly one slash before the path", () => {
    const url = `${appBaseUrl({ ...prod, NEXT_PUBLIC_APP_URL: "https://app.example/" })}/reset-password?token=t`;
    expect(url).toBe("https://app.example/reset-password?token=t");
  });
});
