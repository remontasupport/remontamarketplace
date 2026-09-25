import tsParser from '@typescript-eslint/parser'
import { sharedIgnores } from '@remonta/config/eslint.base.mjs'
import { formEngineBoundaries } from '@remonta/config/eslint.boundaries.mjs'

export default [
  { ignores: [...sharedIgnores.ignores, 'test/fixtures/**'] },
  {
    files: ['src/**/*.ts'],
    languageOptions: { parser: tsParser, ecmaVersion: 'latest', sourceType: 'module' },
    ...formEngineBoundaries,
  },
  { files: ['test/**/*.ts', '*.ts'], languageOptions: { parser: tsParser, ecmaVersion: 'latest', sourceType: 'module' } },
]
