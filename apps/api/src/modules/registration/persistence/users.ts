// The one way the sign-up asks "does an account with this email exist?".
//
// users.email is unique by exact value, and the contract normalises every email to
// lower case -- but accounts created before that (through apps/app) may be stored
// with capitals. Comparing lower(email) (users_lower_email_idx, 0.009 ms at 100 k
// users) treats "Mary@x.au" and "mary@x.au" as the same account everywhere: the
// availability check, the R1 branch of the sign-up, and the recovery after a
// concurrent insert. Two lookups that disagreed would let a second account be
// created for an existing person.
import type { Db, Tx } from '../../../platform/persistence/db'

export async function findUserIdByEmail(db: Db | Tx, email: string): Promise<string | null> {
  const rows = await db.$queryRaw<{ id: string }[]>`SELECT id FROM users WHERE lower(email) = lower(${email}) LIMIT 1`
  return rows[0]?.id ?? null
}
