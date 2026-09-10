/**
 * Tests for OTP token signing and verification.
 *
 * The most important test here is the compatibility property. This module
 * replaced two inline copies of the signer that lived in the OTP routes, and
 * tokens issued before the change are still in flight in users' inboxes for up
 * to 15 minutes. If the extracted function disagrees with the original by a
 * single byte, every one of those fails to verify and no client can complete
 * registration.
 *
 * So the original implementation is reproduced verbatim below and the extracted
 * one is asserted against it. It must stay: it is not duplication for its own
 * sake, it is the pin that stops the format drifting.
 */

import { describe, it, expect, beforeAll } from "vitest";
import fc from "fast-check";
import { createHmac } from "crypto";

import { signOtpToken, verifyOtpToken } from "@/lib/otp";

// The module reads NEXTAUTH_SECRET lazily on first use and throws when absent.
// Tests set a known value so the assertions are deterministic regardless of the
// developer's .env.
const TEST_SECRET = "test-secret-for-otp-signing";

beforeAll(() => {
  process.env.NEXTAUTH_SECRET = TEST_SECRET;
});

/**
 * The implementation as it stood in both route files before extraction.
 * Copied byte for byte. Do not "improve" this -- its whole purpose is to be the
 * thing that has not changed.
 */
function originalSignOtpToken(email: string, code: string, expiresAt: number): string {
  return createHmac("sha256", TEST_SECRET)
    .update(`${email}:${code}:${expiresAt}`)
    .digest("hex");
}

describe("signOtpToken — compatibility with the pre-extraction implementation", () => {
  it("reproduces the original output for realistic inputs", () => {
    expect(signOtpToken("a@b.com", "123456", 1757000000000)).toBe(
      originalSignOtpToken("a@b.com", "123456", 1757000000000),
    );
  });

  it("reproduces the original output for ANY input", () => {
    // The property that guarantees no in-flight token breaks. Emails are
    // generated freely rather than constrained to valid addresses, because the
    // signer does not validate them and neither did the original.
    fc.assert(
      fc.property(
        fc.string({ maxLength: 60 }),
        fc.string({ maxLength: 20 }),
        fc.integer({ min: 0, max: 4_102_444_800_000 }),
        (email, code, expiresAt) => {
          expect(signOtpToken(email, code, expiresAt)).toBe(
            originalSignOtpToken(email, code, expiresAt),
          );
        },
      ),
    );
  });
});

describe("signOtpToken — shape and behaviour", () => {
  it("returns a 64-character lowercase hex digest", () => {
    // sha256 hex is always 64 chars. A change in digest or encoding would be a
    // breaking change for tokens already issued.
    fc.assert(
      fc.property(
        fc.string({ maxLength: 40 }),
        fc.string({ maxLength: 10 }),
        fc.integer({ min: 0 }),
        (email, code, expiresAt) => {
          expect(signOtpToken(email, code, expiresAt)).toMatch(/^[0-9a-f]{64}$/);
        },
      ),
    );
  });

  it("is deterministic", () => {
    const a = signOtpToken("user@example.com", "654321", 1757000000000);
    const b = signOtpToken("user@example.com", "654321", 1757000000000);
    expect(a).toBe(b);
  });

  it("changes when the email changes", () => {
    expect(signOtpToken("a@example.com", "111111", 1)).not.toBe(
      signOtpToken("b@example.com", "111111", 1),
    );
  });

  it("changes when the code changes", () => {
    expect(signOtpToken("a@example.com", "111111", 1)).not.toBe(
      signOtpToken("a@example.com", "222222", 1),
    );
  });

  it("changes when the expiry changes", () => {
    // This one matters: the expiry is supplied by the client on verification.
    // Because it is covered by the HMAC, tampering with it invalidates the
    // token rather than extending its life.
    expect(signOtpToken("a@example.com", "111111", 1)).not.toBe(
      signOtpToken("a@example.com", "111111", 2),
    );
  });

  it("is sensitive to any single-field change", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        (email, code, expiresAt) => {
          const base = signOtpToken(email, code, expiresAt);
          expect(signOtpToken(email + "x", code, expiresAt)).not.toBe(base);
          expect(signOtpToken(email, code + "x", expiresAt)).not.toBe(base);
          expect(signOtpToken(email, code, expiresAt + 1)).not.toBe(base);
        },
      ),
    );
  });
});

describe("verifyOtpToken", () => {
  it("accepts the token it just produced", () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 40 }),
        fc.string({ maxLength: 10 }),
        fc.integer({ min: 0, max: 4_102_444_800_000 }),
        (email, code, expiresAt) => {
          const token = signOtpToken(email, code, expiresAt);
          expect(verifyOtpToken(email, code, expiresAt, token)).toBe(true);
        },
      ),
    );
  });

  it("rejects a token signed for different inputs", () => {
    const token = signOtpToken("a@example.com", "111111", 1000);
    expect(verifyOtpToken("b@example.com", "111111", 1000, token)).toBe(false);
    expect(verifyOtpToken("a@example.com", "222222", 1000, token)).toBe(false);
    expect(verifyOtpToken("a@example.com", "111111", 2000, token)).toBe(false);
  });

  it("rejects a same-length token that differs", () => {
    // Exercises the timingSafeEqual path specifically. A wrong token of equal
    // length reaches the comparison rather than being short-circuited by the
    // length check.
    const token = signOtpToken("a@example.com", "111111", 1000);
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");

    expect(tampered.length).toBe(token.length);
    expect(verifyOtpToken("a@example.com", "111111", 1000, tampered)).toBe(false);
  });

  it("rejects tokens of the wrong length without throwing", () => {
    // timingSafeEqual throws on length mismatch, so the length check has to come
    // first. If it were removed this test would surface it as an exception
    // rather than a false.
    expect(verifyOtpToken("a@example.com", "111111", 1000, "")).toBe(false);
    expect(verifyOtpToken("a@example.com", "111111", 1000, "short")).toBe(false);
    expect(verifyOtpToken("a@example.com", "111111", 1000, "f".repeat(128))).toBe(false);
  });

  it("rejects non-string candidates without throwing", () => {
    // The route passes through whatever arrived in the JSON body.
    expect(verifyOtpToken("a@example.com", "111111", 1000, null as never)).toBe(false);
    expect(verifyOtpToken("a@example.com", "111111", 1000, undefined as never)).toBe(false);
    expect(verifyOtpToken("a@example.com", "111111", 1000, 12345 as never)).toBe(false);
  });
});
