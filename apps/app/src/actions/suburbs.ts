'use server';

import { searchSuburbs, type SuburbMatch } from '@/lib/suburbs';

/** Server-action form of /api/suburbs (client registration). See lib/suburbs. */
export async function fetchSuburbs(query: string): Promise<SuburbMatch[]> {
  try {
    return await searchSuburbs(query);
  } catch {
    return [];
  }
}
