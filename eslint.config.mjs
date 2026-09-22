import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Prisma emits its client here and it is committed to source so Vercel
      // can bundle it. Linting machine-generated code produced 2,598 of the
      // 3,476 problems reported before this line existed — 75% of the total,
      // almost all no-unused-expressions and no-this-alias, which are artifacts
      // of code generation rather than defects. Excluding it leaves the ~878
      // findings that are actually ours to fix.
      "src/generated/**",
    ],
  },
];

export default eslintConfig;
