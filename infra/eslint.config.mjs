import tsParser from '@typescript-eslint/parser'
import { sharedIgnores } from '@remonta/config/eslint.base.mjs'

export default [
  { ignores: [...sharedIgnores.ignores, 'cdk.out/**'] },
  {
    files: ['bin/**/*.ts', 'lib/**/*.ts', 'test/**/*.ts', '*.ts'],
    languageOptions: { parser: tsParser, ecmaVersion: 'latest', sourceType: 'module' },
  },
]
