import tsParser from '@typescript-eslint/parser'
import { sharedIgnores } from '@remonta/config/eslint.base.mjs'
import { schemasBoundaries } from '@remonta/config/eslint.boundaries.mjs'

// The TypeScript parser is required, not optional. Without it ESLint falls back to
// espree, which cannot parse `import type` or type annotations -- and a config that
// cannot parse the files it guards enforces nothing while still exiting 0 on the
// files it skips. P-5 was silently unenforceable until this was added; the deliberate
// violation probe is what surfaced it.
export default [
  sharedIgnores,
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tsParser, ecmaVersion: 'latest', sourceType: 'module' },
    ...schemasBoundaries,
  },
]
