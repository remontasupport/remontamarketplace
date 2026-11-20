// The "Suspended accounts" search (2026-11-20): the list is loaded whole, so the search filters it in the browser.
// Case-insensitive; every word typed must appear in the name ("first last") or the email address.
import type { WorkerRow } from '@remonta/api-contract'

export function matchesNameOrEmail(worker: Pick<WorkerRow, 'firstName' | 'lastName' | 'email'>, text: string): boolean {
  const words = text.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const haystack = `${worker.firstName} ${worker.lastName} ${worker.email ?? ''}`.toLowerCase()
  return words.every((w) => haystack.includes(w))
}
