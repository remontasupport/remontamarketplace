import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import NewsSlider from "./NewsSlider";
import { authPrisma } from "@/lib/auth-prisma";
import { getOrFetch, CACHE_KEYS, CACHE_TTL } from "@/lib/redis";

async function fetchJobs() {
  // Jobs are identical for every user and only change when sync-jobs runs.
  // Cache them in Redis; sync-jobs invalidates this key after each successful
  // sync so workers always see the current list within one page load.
  return getOrFetch(
    CACHE_KEYS.activeJobs(),
    async () => {
      try {
        const jobs = await authPrisma.job.findMany({
          where: { active: true },
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
    CACHE_TTL.ACTIVE_JOBS,
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
export default async function NewsSliderAsync() {
  const session = await getServerSession(authOptions);

  const [jobs, appliedJobIds] = await Promise.all([
    fetchJobs(),
    session?.user?.id ? fetchAppliedJobIds(session.user.id) : Promise.resolve([]),
  ]);

  return <NewsSlider jobs={jobs} appliedJobIds={appliedJobIds} />;
}
