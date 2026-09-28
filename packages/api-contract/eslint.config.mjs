import tsParser from '@typescript-eslint/parser'
import { sharedIgnores } from '@remonta/config/eslint.base.mjs'
import { apiContractBoundaries } from '@remonta/config/eslint.boundaries.mjs'

// The TypeScript parser is required: without it ESLint cannot read the files it
// guards and exits 0 (the P-5 lesson). test/boundary.test.ts proves the rule rejects.
export default [
  { ignores: [...sharedIgnores.ignores, 'test/fixtures/**'] },
  {
    files: ['src/**/*.ts'],
    languageOptions: { parser: tsParser, ecmaVersion: 'latest', sourceType: 'module' },
    ...apiContractBoundaries,
  },
  {
    files: ['scripts/**/*.ts', 'test/**/*.ts', '*.ts'],
    languageOptions: { parser: tsParser, ecmaVersion: 'latest', sourceType: 'module' },
  },
]
