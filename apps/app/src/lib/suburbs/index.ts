// Suburb search for every autocomplete in apps/app (worker and client sign-up,
// account setup, service requests, admin and worker search). S1: reads our own
// au_localities -- every Australian suburb-postcode pair from G-NAF -- instead of
// two Google calls per keystroke, which returned at most 5 results and dropped
// leading zeros from NT postcodes.
//
// Response shape is unchanged for the callers, plus `id` (the au_localities id
// the new registration sends). `postcode` is now a string, so "0870" stays
// "0870"; every caller interpolates it or wraps it in String().
import { authPrisma } from '@/lib/auth-prisma';
import { googleSuburbs } from './google';

export interface SuburbMatch {
  id: number | null;
  name: string;
  postcode: string;
  state: { abbreviation: string };
}

const MAX = 10;

/** Makes LIKE's wildcards (% and _) and its escape character (\) match literally. */
export function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => "\\" + c);
}

/**
 * Name-prefix matches first ("parra" -> Parramatta), then later-word matches
 * ("kilda" -> St Kilda); "suburb postcode" narrows by both; digits alone match
 * postcodes. The same ranking as apps/api's LocalityDirectory.
 */
export async function searchSuburbs(raw: string): Promise<SuburbMatch[]> {
  const q = raw.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 60);
  if (q.length < 2) return [];
  const m = /^(.*?)\s*(\d{1,4})$/.exec(q);
  const text = m ? m[1].trim() : q;
  const digits = m ? m[2] : '';
  const prefix = `${escapeLike(text)}%`;
  const word = `% ${escapeLike(text)}%`;
  const hyphen = `%-${escapeLike(text)}%`;
  const pc = `${escapeLike(digits)}%`;

  try {
    const rows = await authPrisma.$queryRaw<{ id: number; suburb: string; state: string; postcode: string }[]>`
      SELECT id, suburb, state, postcode FROM au_localities
       WHERE "retiredAt" IS NULL
         AND (${digits} = '' OR postcode LIKE ${pc})
         AND (${text} = '' OR "searchName" LIKE ${prefix} OR "searchName" LIKE ${word} OR "searchName" LIKE ${hyphen})
       ORDER BY CASE WHEN ${text} = '' OR "searchName" LIKE ${prefix} THEN 0 ELSE 1 END, "searchName", state, postcode
       LIMIT ${MAX}`;
    return rows.map((r) => ({ id: r.id, name: r.suburb, postcode: r.postcode, state: { abbreviation: r.state } }));
  } catch (err) {
    // 42P01: the table does not exist yet on this database (before the S1
    // migration). Anything else is a real error.
    const code = (err as { meta?: { code?: string }; code?: string })?.meta?.code ?? (err as { code?: string })?.code;
    const missing = code === '42P01' || /au_localities.*does not exist/i.test(String((err as Error)?.message));
    if (!missing) throw err;
    console.warn('[suburbs] au_localities missing on this database; falling back to Google');
    const legacy = await googleSuburbs(raw);
    return legacy.map((s) => ({ id: null, name: s.name, postcode: String(s.postcode).padStart(4, '0'), state: s.state }));
  }
}
