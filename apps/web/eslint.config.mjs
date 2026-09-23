import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import { sharedIgnores } from "@remonta/config/eslint.base.mjs";
import { webBoundaries } from "@remonta/config/eslint.boundaries.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

// P-1 and P-2 are enforced here: apps/web must not import @remonta/db or any domain
// package. D-35 -- marketing holds no database access; it reads worker data over HTTP.
export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  sharedIgnores,
  webBoundaries,
];
