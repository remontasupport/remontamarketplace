/**
 * One-time passcode signing.
 *
 * The OTP flow is stateless: /api/auth/send-otp returns
 * `HMAC(email:code:expiresAt)` to the client alongside the expiry, and
 * /api/auth/verify-otp recomputes it. Nothing is stored server-side. That design
 * is sound *provided the secret stays secret* -- an attacker holding a token
 * cannot brute-force the six-digit code offline without it.
 *
 * This module exists because the signing function previously existed TWICE, once
 * in each route, as byte-identical copies with nothing binding them together. If
 * either had drifted, every verification would have failed and no client could
 * have registered. otp.test.ts now pins the output against the original
 * implementation so that cannot happen silently.
 *
 * The routes cannot host this themselves: a Next.js route module may only export
 * HTTP handlers and a fixed set of config values, so exporting a helper from one
 * is a type error.
 */

import { createHmac, timingSafeEqual } from "crypto";

/**
 * The secret is resolved on first use, not at module load.
 *
 * There used to be a fallback here:
 *
 *   const SECRET = process.env.NEXTAUTH_SECRET ?? 'remonta-otp-secret'
 *
 * That failed open. With the variable unset, tokens were signed with a string
 * published in this repository, so anyone could compute the HMAC for all
 * 1,000,000 six-digit codes offline and bypass verification entirely -- silently,
 * with nothing in the logs to show for it.
 *
 * It now throws instead. Resolution is deferred to first call rather than module
 * load so that `next build`, which evaluates route modules for static analysis,
 * does not fail when the variable is absent from a build environment. The
 * failure still happens before any token is signed or checked, which is the
 * property that matters.
 */
let cachedSecret: string | null = null;

function getSecret(): string {
  if (cachedSecret !== null) return cachedSecret;

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      "NEXTAUTH_SECRET is not set. OTP tokens cannot be signed or verified " +
        "without it. Refusing to fall back to a known value.",
    );
  }

  cachedSecret = secret;
  return secret;
}

/**
 * Sign an OTP token.
 *
 * The input string and algorithm are carried over verbatim from the two inline
 * copies this replaced. Changing either invalidates every token already issued
 * and in flight, so do not "tidy" the format -- otp.test.ts asserts it against
 * the original implementation and will fail if it moves.
 */
export function signOtpToken(email: string, code: string, expiresAt: number): string {
  return createHmac("sha256", getSecret())
    .update(`${email}:${code}:${expiresAt}`)
    .digest("hex");
}

/**
 * Constant-time token comparison.
 *
 * The previous check was `expected !== token`, which short-circuits at the first
 * differing byte and so leaks how much of a candidate token was correct. The
 * practical risk was low -- an attacker needs a valid token to exploit it -- but
 * comparing secrets in constant time costs nothing.
 *
 * `timingSafeEqual` throws on length mismatch, which would itself be a timing
 * signal, so length is checked first and a mismatch returns false without
 * touching the comparison.
 */
export function verifyOtpToken(
  email: string,
  code: string,
  expiresAt: number,
  candidate: string,
): boolean {
  if (typeof candidate !== "string") return false;

  const expected = signOtpToken(email, code, expiresAt);
  if (expected.length !== candidate.length) return false;

  return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(candidate, "utf8"));
}
