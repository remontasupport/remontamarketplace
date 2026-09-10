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
      // Prisma emits its client here and it is committed so Vercel can bundle it.
      // Linting machine-generated code accounted for the large majority of the
      // 4,691 problems reported before this line existed - almost all
      // no-unused-expressions and no-this-alias, which are code-generation
      // artifacts rather than defects.
      "src/generated/**",
    ],
  },
];

export default eslintConfig;
