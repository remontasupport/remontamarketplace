// The app's public origin, for absolute links in emails (password reset, dashboard).
//
// Production sent "http://localhost:3000/reset-password?token=…" because the only
// source was NEXTAUTH_URL, which NextAuth does not need on Vercel and so was never
// set there. Resolution, first hit wins:
//   1. NEXT_PUBLIC_APP_URL          -- explicit, preferred
//   2. NEXTAUTH_URL                 -- the legacy source
//   3. production deployment        -- the canonical domain (and a logged warning: set 1)
//   4. preview deployment           -- https://<VERCEL_URL>, the host that served the request
//   5. http://localhost:3000        -- local development
// A localhost value is ignored on a Vercel deployment (a copied .env), and a
// trailing slash is dropped so the path never doubles it.
export const CANONICAL_APP_URL = "https://app.remontaservices.com.au";

type Env = Record<string, string | undefined>;

function isLocalhost(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  } catch {
    return true; // unparsable: treat as unusable
  }
}

export function appBaseUrl(env: Env = process.env): string {
  const onVercel = !!env.VERCEL_ENV;
  const isProduction = env.VERCEL_ENV === "production" || (!onVercel && env.NODE_ENV === "production");

  for (const key of ["NEXT_PUBLIC_APP_URL", "NEXTAUTH_URL"] as const) {
    const raw = env[key]?.trim();
    if (!raw) continue;
    const url = raw.replace(/\/+$/, "");
    if (onVercel && isLocalhost(url)) continue; // a copied .env on a deployment
    return url;
  }

  if (isProduction) {
    console.error("[app-url] NEXT_PUBLIC_APP_URL is not set on a production deployment; using the canonical domain");
    return CANONICAL_APP_URL;
  }
  if (onVercel && env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return "http://localhost:3000";
}
