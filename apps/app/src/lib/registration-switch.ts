// Which backend worker sign-up uses (S1-design 4.3, US-MIG-01), read on every
// request so that flipping it needs no deploy:
//   1. Upstash key `switch:registration` ("legacy" | "api")
//   2. env REGISTRATION_BACKEND
//   3. "legacy"
// "api" also needs NEXT_PUBLIC_API_URL and NEXT_PUBLIC_RECAPTCHA_SITE_KEY; if
// either is missing it falls back to legacy (and says so in the log) rather than
// serving a sign-up page that cannot work. Rollback = set it back to "legacy":
// both backends write the same tables.
import { getCached } from "@/lib/redis";
import type { Backend } from "@remonta/form-engine";

export const SWITCH_KEY = "switch:registration";

export function resolveBackend(requested: unknown, env: Record<string, string | undefined>): Backend {
  // On a production deployment only the Redis key can select "api": a variable
  // copied into Vercel's production scope must not be able to flip real users onto
  // a backend nobody has verified there. Previews and local use the env var.
  const envMode = env.VERCEL_ENV === "production" ? undefined : env.REGISTRATION_BACKEND;
  const mode = requested === "api" || requested === "legacy" ? requested : envMode === "api" ? "api" : "legacy";
  if (mode === "legacy") return { mode: "legacy" };
  const apiBaseUrl = env.NEXT_PUBLIC_API_URL;
  const recaptchaSiteKey = env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!apiBaseUrl || !recaptchaSiteKey) {
    console.error("[registration-switch] 'api' requested but NEXT_PUBLIC_API_URL or NEXT_PUBLIC_RECAPTCHA_SITE_KEY is missing; serving legacy");
    return { mode: "legacy" };
  }
  return { mode: "api", apiBaseUrl, recaptchaSiteKey };
}

export async function getRegistrationBackend(): Promise<Backend> {
  // getCached returns null when Redis is not configured or unreachable.
  return resolveBackend(await getCached<string>(SWITCH_KEY), process.env);
}
