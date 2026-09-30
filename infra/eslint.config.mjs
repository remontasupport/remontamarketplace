import tsParser from '@typescript-eslint/parser'
import { sharedIgnores } from '@remonta/config/eslint.base.mjs'

export default [
  { ignores: [...sharedIgnores.ignores] },
  {
    files: ['lib/**/*.ts', 'scripts/**/*.ts', 'test/**/*.ts', '*.ts'],
    languageOptions: { parser: tsParser, ecmaVersion: 'latest', sourceType: 'module' },
  },
]
