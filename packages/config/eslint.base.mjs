/**
 * Shared ESLint ignores for every package and app in the workspace.
 *
 * The two apps' eslint.config.mjs files differed before U7 only in whether they
 * carried the src/generated exclusion, so this extraction unifies them rather than
 * choosing between them.
 */

export const sharedIgnores = {
  ignores: [
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "next-env.d.ts",
    // Prisma emits its client here and it is committed to source so Vercel can
    // bundle it. Linting machine-generated code produced 2,598 of the 3,476
    // problems reported before this exclusion existed — 75% of the total, almost
    // all no-unused-expressions and no-this-alias, which are code-generation
    // artifacts rather than defects. Excluding it leaves the findings that are
    // actually ours to fix, and is what the 523 and 76 baselines are measured
    // against.
    "src/generated/**",
  ],
};
