import tsParser from '@typescript-eslint/parser'
import { sharedIgnores } from '@remonta/config/eslint.base.mjs'

export default [
  { ignores: [...sharedIgnores.ignores, 'generated/**', 'prisma/**'] },
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tsParser, ecmaVersion: 'latest', sourceType: 'module' },
    rules: {
      // Routes come only from @remonta/api-contract (S1-design 2.2). A Nest
      // controller would register a route the pipeline and the startup checks
      // never see.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@nestjs/common',
              importNames: ['Controller', 'Get', 'Post', 'Put', 'Patch', 'Delete', 'All'],
              message: 'Routes are declared in @remonta/api-contract and bound by src/platform/contract. Do not add Nest controllers.',
            },
          ],
        },
      ],
    },
  },
]
