import JobsSection from "./JobsSection";
import { authPrisma } from "@/lib/auth-prisma";

async function fetchJobs() {
  try {
    const jobs = await authPrisma.job.findMany({
      where: { active: true },
      select: {
        id:               true,
        zohoId:           true,
        recruitmentTitle: true,
        service:          true,
        description:      true,
        city:             true,
        state:            true,
        postedAt:         true,
        createdAt:        true,
      },
      orderBy: { postedAt: "desc" },
    })

    // Serialize dates to strings for client component
    return jobs.map((job) => ({
      ...job,
      postedAt:  job.postedAt  ? job.postedAt.toISOString()  : null,
      createdAt: job.createdAt.toISOString(),
    }))
  } catch (error) {
    console.error("[JOBS] Failed to fetch jobs:", error)
    return []
  }
}

/**
 * Async Server Component for Job Listings
 * Fetches directly from DB — no API round-trip, no auth overhead.
 * Use with Suspense boundary for streaming SSR.
 */
export default async function JobsSectionAsync() {
  const jobs = await fetchJobs()
  return <JobsSection jobs={jobs} />
}
