// A person's age in whole years from their date of birth, read as a calendar date (the year-month-day the record
// holds: "1990-05-01", or a Date / ISO string stored at midnight UTC), so the viewer's timezone never shifts it a day.
// One function for the client and coordinator dashboards and the admin's client page.
export function ageFrom(dateOfBirth: Date | string | null | undefined, today: Date = new Date()): number | undefined {
  if (!dateOfBirth) return undefined
  let year: number, month: number, day: number
  const ymd = typeof dateOfBirth === 'string' ? /^(\d{4})-(\d{2})-(\d{2})/.exec(dateOfBirth) : null
  if (ymd) {
    ;[year, month, day] = [Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3])]
  } else {
    const d = dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth)
    if (isNaN(d.getTime())) return undefined
    ;[year, month, day] = [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()]
  }
  const beforeBirthday = today.getMonth() < month || (today.getMonth() === month && today.getDate() < day)
  return today.getFullYear() - year - (beforeBirthday ? 1 : 0)
}
