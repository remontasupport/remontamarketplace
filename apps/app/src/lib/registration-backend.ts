// Where the worker sign-up sends its requests: apps/api, through the two public
// variables. Production and every Vercel preview set both. If one is missing the
// page shows "sign-up unavailable" and this logs which variable, by NAME only,
// so a misconfigured deployment is visible without serving a form that cannot
// work. (The pre-S1 page this used to fall back to was removed on 2026-10-02.)
import type { Backend } from "@remonta/form-engine";

export function resolveBackend(env: Record<string, string | undefined>): Backend | null {
  const apiBaseUrl = env.NEXT_PUBLIC_API_URL;
  const recaptchaSiteKey = env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (apiBaseUrl && recaptchaSiteKey) return { apiBaseUrl, recaptchaSiteKey };
  const missing = [!apiBaseUrl && "NEXT_PUBLIC_API_URL", !recaptchaSiteKey && "NEXT_PUBLIC_RECAPTCHA_SITE_KEY"].filter(Boolean).join(", ");
  console.error(`[registration] ${missing} missing; the worker sign-up page is unavailable`);
  return null;
}
