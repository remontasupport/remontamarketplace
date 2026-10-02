// Whether an address can sign up: no account with it, ignoring case (user
// decision, 2026-09-28: this entry reveals existence; the send and the sign-up do
// not). One indexed lookup, nothing else.
import type { EmailAvailability } from '@remonta/schemas/schema/workerRegistrationSchema'
import type { Db } from '../../../platform/persistence/db'
import { findUserIdByEmail } from '../persistence/users'

export async function emailAvailable(db: Db, input: EmailAvailability): Promise<{ available: boolean }> {
  return { available: (await findUserIdByEmail(db, input.email)) === null }
}
