// Finding a user by email, case-insensitively, the safe way (hotfix; the S1 branch
// adds the index that also makes it fast).
//
// Prisma's `email: { equals, mode: "insensitive" }` compiles to `email ILIKE $1`
// WITHOUT escaping `_` or `%`: a sign-in as "a_b@x" matched "axb@x", and "%@x"
// matched another user (verified 2026-09-25). It also cannot use an index, so it
// scanned the whole users table on every sign-in (47 ms at 100 k users).
//
// This is an exact comparison of lower-cased emails -- no wildcards. It is served
// by the users_lower_email_idx expression index once the S1 migrations add it
// (0.2 ms at 100 k users); until then it scans users, as today (~1,700 rows).
import { authPrisma } from "@/lib/auth-prisma";

/**
 * The id of the user with this email, ignoring case; null if none.
 * If case-variants of one address exist (the unique index is case-sensitive), the
 * oldest account wins -- deterministic, where findFirst was not.
 */
export async function userIdByEmail(email: string): Promise<string | null> {
  const rows = await authPrisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM users WHERE lower(email) = lower(${email.trim()}) ORDER BY "createdAt" ASC, id ASC LIMIT 1`;
  return rows[0]?.id ?? null;
}
