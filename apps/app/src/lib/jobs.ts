/**
 * The active job listings, exactly as the worker dashboard shows them.
 *
 * One query for every reader: the dashboard (NewsSliderAsync) and the public
 * GET /api/jobs, which the marketing site's /provide-support page reads. Both
 * show the same list, with the same rules and the same cache entry.
 *
 * The rules (decided 2026-11-25), read straight from the jobs table:
 *   - every active row is shown unless its status is in HIDDEN_STATUSES;
 *   - real listings first, then the seeded FAKE- rows, each group newest first.
 *
 * The select below is the whole public shape. Never add participant names
 * (firstName, lastName) or anything else that must not leave the app.
 */

import { authPrisma } from "@/lib/auth-prisma";
import { getOrFetch, CACHE_KEYS } from "@/lib/redis";

export type ActiveJob = {
  id: string
  zohoId: string
  recruitmentTitle: string | null
  service: string | null
  jobDescription: string | null
  city: string | null
  state: string | null
  postedAt: string | null
  createdAt: string
}

/** A row with one of these statuses is never shown. */
export const HIDDEN_STATUSES = ['Archived', 'Cancelled', 'Unresponsive']

/**
 * Rows are added and edited by hand in the database, which invalidates nothing,
 * so the cache is kept short: an edit shows within a minute.
 */
const CACHE_TTL_SECONDS = 60

/** Seeded rows carry a FAKE- zohoId; a real listing never does. */
const isFake = (zohoId: string) => zohoId.startsWith('FAKE-')

export async function fetchActiveJobs(): Promise<ActiveJob[]> {
  return getOrFetch(
    CACHE_KEYS.activeJobs(),
    async () => {
      try {
        const jobs = await authPrisma.job.findMany({
          where: {
            active: true,
            status: { notIn: HIDDEN_STATUSES },
          },
          select: {
            id:               true,
            zohoId:           true,
            recruitmentTitle: true,
            service:          true,
            jobDescription:   true,
            city:             true,
            state:            true,
            postedAt:         true,
            createdAt:        true,
          },
          orderBy: { postedAt: "desc" },
        });

        // Real listings first; Array.prototype.sort is stable, so each group
        // keeps the query's newest-first order.
        jobs.sort((a, b) => Number(isFake(a.zohoId)) - Number(isFake(b.zohoId)))

        return jobs.map((job) => ({
          ...job,
          postedAt:  job.postedAt  ? job.postedAt.toISOString()  : null,
          createdAt: job.createdAt.toISOString(),
        }));
      } catch (error) {
        console.error("[JOBS] Failed to fetch jobs:", error);
        return [];
      }
    },
    CACHE_TTL_SECONDS,
  );
}
