/**
 * Package boundary rules P-1 .. P-5, from component-dependency.md.
 *
 * These are the rules that stop the monorepo decaying back into a tangle. Each one
 * exists for a stated reason, and the reason is repeated in the error message so a
 * developer who trips it learns why rather than just how to silence it.
 *
 * Enforced with no-restricted-imports (AD-10, AD-11, answer Q4=A). One mechanism,
 * running inside the lint gate that is already wired into CI, rather than a second
 * tool with a second config.
 *
 * WHAT THIS CATCHES AND WHAT IT DOES NOT
 *
 * Catches: a direct import of a forbidden package from source in the guarded app.
 * Does not catch: a transitive reach — apps/web importing something that itself
 * imports db. Manifest omission is the defence there, and it is the reason each
 * rule in component-dependency.md lists BOTH "manifest omission" and "CI check".
 * Neither alone is sufficient; this file is half of a pair.
 */

/** P-1, P-2 — apps/web must not import db or any domain package. */
export const webBoundaries = {
  files: ["**/*.{ts,tsx,js,jsx,mjs}"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@remonta/db", "@remonta/db/*"],
            message:
              "P-1: apps/web must not import @remonta/db. Marketing holds no database access (D-35) — it reads worker data over HTTP via @remonta/api-client. This isolation is what the whole consolidation rests on.",
          },
          {
            group: ["@remonta/domain-*"],
            message:
              "P-2: apps/web must not import a domain package. Domain packages import @remonta/db transitively, so this would reintroduce the database dependency P-1 exists to prevent.",
          },
        ],
      },
    ],
  },
};

/**
 * P-3 — apps/mobile must not import db or any domain package.
 *
 * apps/mobile does not exist yet: it was deferred out of U7 as not a priority
 * (Q3=C, 2026-09-23). This rule is written now and exported inert, so that when the
 * package arrives it lands inside an already-enforced boundary rather than needing
 * one retrofitted. AD-11: a mobile client reaches data over HTTP only.
 */
export const mobileBoundaries = {
  files: ["**/*.{ts,tsx,js,jsx,mjs}"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@remonta/db", "@remonta/db/*", "@remonta/domain-*"],
            message:
              "P-3: apps/mobile must not import @remonta/db or a domain package. A mobile client reaches data over HTTP through @remonta/api-client (AD-11).",
          },
          {
            group: ["@remonta/ui", "@remonta/ui/*"],
            message:
              "P-3: apps/mobile must not import @remonta/ui. Those are DOM-based components and cannot render in React Native (AD-11).",
          },
        ],
      },
    ],
  },
};

/**
 * P-5 — packages/schemas must not import Next, React, the DOM or Prisma.
 *
 * This is the hard one, and the reason the package exists in the shape it does.
 * packages/schemas is the contract a future Expo client consumes; any of these
 * imports breaks that, and breaks it silently, because the web apps would keep
 * building perfectly well.
 */
export const schemasBoundaries = {
  files: ["**/*.{ts,tsx,js,jsx,mjs}"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["next", "next/*", "next-auth", "next-auth/*"],
            message:
              "P-5: packages/schemas must not import Next. It is the contract Expo consumes — a Next import makes it unusable from React Native. Framework-coupled types belong in apps/app (see next-auth.d.ts, deliberately left there in U7).",
          },
          {
            group: ["react", "react/*", "react-dom", "react-dom/*"],
            message:
              "P-5: packages/schemas must not import React. Keep it to Zod schemas, derived types and plain data.",
          },
          {
            group: ["@prisma/client", "@prisma/client/*", "@remonta/db", "@remonta/db/*"],
            message:
              "P-5: packages/schemas must not import Prisma or @remonta/db. Schemas describe the API contract, not the database shape — coupling them would leak storage decisions to every client.",
          },
        ],
      },
    ],
  },
};

/**
 * P-4 — no domain package may import another domain package.
 *
 * No domain packages exist yet (U10, U11). Written now for the same reason as P-3:
 * so they arrive into an enforced boundary. Without it domain-worker would import
 * domain-verification for requirement derivation and domain-verification would
 * import domain-worker to read profiles — a cycle. Cross-domain work is orchestrated
 * in transport instead (see services.md).
 */
export const domainBoundaries = {
  files: ["**/*.{ts,tsx,js,jsx,mjs}"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@remonta/domain-*"],
            message:
              "P-4: a domain package must not import another domain package. This prevents dependency cycles; cross-domain orchestration belongs in the transport layer (services.md).",
          },
        ],
      },
    ],
  },
};
