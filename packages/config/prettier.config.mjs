/**
 * Shared Prettier configuration.
 *
 * Neither app had a Prettier config before U7 -- formatting was whatever each
 * developer's editor did. This establishes one definition without reformatting
 * anything: no format-on-commit hook is added here, and no existing file is
 * touched, because a repo-wide reformat inside a structural unit would bury the
 * real change under thousands of whitespace diffs and violate PS-6.
 *
 * Adopt it incrementally, or run it repo-wide as its own commit later.
 */
export default {
  semi: false,
  singleQuote: true,
  trailingComma: 'es5',
  printWidth: 100,
  tabWidth: 2,
}
