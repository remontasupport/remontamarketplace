import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // Resolves the `@/*` alias straight from tsconfig.json rather than restating
  // it here. One source of truth, so the two cannot drift.
  plugins: [tsconfigPaths()],

  // Vite otherwise discovers postcss.config.mjs, which loads the Tailwind 4
  // plugin it cannot parse. Nothing under test imports CSS — these are pure
  // logic tests in a node environment — so the whole pipeline is switched off
  // rather than worked around. Revisit only if component tests are added.
  css: { postcss: { plugins: [] } },

  test: {
    // Node, not jsdom. Everything tested today is pure logic, and the code
    // heading into packages/domain-* (U10, U11) is deliberately DOM-free.
    // Component testing is a separate decision — see the U2 plan.
    environment: "node",

    // Tests live beside the code they test, so they travel with it during the
    // package extraction in U8-U13 instead of being orphaned by a path rewrite.
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],

    // tests/load holds k6 scripts. They are a different kind of test with a
    // different runner and must never be picked up here.
    exclude: ["node_modules/**", ".next/**", "tests/load/**", "src/generated/**"],

    // Globals stay OFF on purpose. tsconfig includes **/*.ts with strict: true,
    // so every test file is type-checked. Relying on globals would need ambient
    // type declarations wired up correctly, and getting that wrong introduces
    // new type errors that U1's baseline gate would (correctly) reject.
    // Importing describe/it/expect explicitly avoids the problem entirely.
    globals: false,

    reporters: ["default"],
  },
});
