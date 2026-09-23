import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import { sharedIgnores } from "@remonta/config/eslint.base.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

// apps/app consumes every package, so no boundary rule restricts it. The rules that
// matter here are the ones guarding the packages it imports (P-4, P-5).
export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  sharedIgnores,
];
