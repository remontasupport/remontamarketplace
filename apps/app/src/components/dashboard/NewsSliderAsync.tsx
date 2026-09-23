import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import NewsSlider from "./NewsSlider";
import { authPrisma } from "@/lib/auth-prisma";
import { getOrFetch, CACHE_KEYS, CACHE_TTL } from "@/lib/redis";
import { SetupProgress } from "@/types/setupProgress";

/**
 * Development-only filter: show ONLY seeded jobs (zohoId starting "FAKE-").
 *
 * Set SHOW_ONLY_FAKE_JOBS=true in apps/app/.env.local to work on the jobs UI
 * against seed data without deleting anything from the live jobs table. The
 * table holds 230 real rows and 108 worker applications hang off them, so
 * clearing it for a UI task is a bad trade — this hides them for one developer
 * instead.
 *
 * Unset in production, so production behaviour is unchanged. It is read from
 * the environment rather than NODE_ENV so it can also be switched on for a
 * preview deployment when that is genuinely wanted, and stays off otherwise.
 */
const ONLY_FAKE_JOBS = process.env.SHOW_ONLY_FAKE_JOBS === 'true'

async function fetchJobs() {
  // Jobs are identical for every user and only change when sync-jobs runs.
  // Cache them in Redis; sync-jobs invalidates this key after each successful
  // sync so workers always see the current list within one page load.
  //
  // The cache key carries the filter mode. Without that, switching the flag
  // would serve whichever list happened to be cached first — filtered results
  // to production, or the full list while filtering — and look like the flag
  // being ignored. Two modes, two entries.
  const cacheKey = ONLY_FAKE_JOBS ? `${CACHE_KEYS.activeJobs()}:fake-only` : CACHE_KEYS.activeJobs()

  // Production caches for 2 hours because jobs only change when sync-jobs runs,
  // and that invalidates the key explicitly — the TTL is just a backstop.
  //
  // In fake-jobs mode the assumption is inverted: rows are being inserted by hand
  // in the Neon console, which invalidates nothing. A 2-hour TTL then means every
  // insert appears to do nothing, with no error and no log line, until the cache
  // is cleared manually. Ten seconds keeps the cache doing its job across a page's
  // own requests while making a reload show new rows.
  const cacheTtl = ONLY_FAKE_JOBS ? 10 : CACHE_TTL.ACTIVE_JOBS

  if (ONLY_FAKE_JOBS) {
    console.warn(
      `[JOBS] SHOW_ONLY_FAKE_JOBS is on — real jobs hidden, cache TTL ${cacheTtl}s (production uses ${CACHE_TTL.ACTIVE_JOBS}s).`
    )
  }

  return getOrFetch(
    cacheKey,
    async () => {
      try {
        const jobs = await authPrisma.job.findMany({
          where: {
            active: true,
            // Seeded rows carry a FAKE- zohoId. In fake-jobs mode they are the
            // ONLY thing shown; everywhere else they are EXCLUDED.
            //
            // The exclusion is the important half. Seed rows live in the same
            // production table as real listings — there is no separate database —
            // so without this a worker on the live site sees them among genuine
            // vacancies and can apply to one. They read as real: "Support Worker —
            // Morning Personal Care", "Home Cleaner — Weekly General Clean".
            //
            // This filters on zohoId rather than the primary key deliberately.
            // zohoId is the upsert key the Zoho sync owns, so a real listing can
            // never arrive carrying FAKE-; ids are free-form and were being set by
            // hand, which is exactly why they ended up leaking "fake" into
            // /dashboard/worker?apply=fake-job-0024 in the first place.
            ...(ONLY_FAKE_JOBS
              ? { zohoId: { startsWith: 'FAKE-' } }
              : { NOT: { zohoId: { startsWith: 'FAKE-' } } }),
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
    cacheTtl,
  );
}

async function fetchAppliedJobIds(workerId: string): Promise<string[]> {
  try {
    const applications = await authPrisma.jobApplication.findMany({
      where: { workerId, status: "PENDING" },
      select: { jobId: true },
    });
    return applications.map((a) => a.jobId);
  } catch (error) {
    console.error("[JOBS] Failed to fetch applied job IDs:", error);
    return [];
  }
}

/**
 * Async Server Component — fetches job listings and the worker's applied job IDs directly from DB.
 * Use with Suspense boundary for streaming SSR.
 */
export default async function NewsSliderAsync({ setupProgress }: { setupProgress?: SetupProgress }) {
  const session = await getServerSession(authOptions);

  const [jobs, appliedJobIds] = await Promise.all([
    fetchJobs(),
    session?.user?.id ? fetchAppliedJobIds(session.user.id) : Promise.resolve([]),
  ]);

  return <NewsSlider jobs={jobs} appliedJobIds={appliedJobIds} setupProgress={setupProgress} />;
}
