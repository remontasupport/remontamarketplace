import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import NewsSlider from "./NewsSlider";
import { authPrisma } from "@/lib/auth-prisma";
import { fetchActiveJobs } from "@/lib/jobs";
import { SetupProgress } from "@/types/setupProgress";

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
    fetchActiveJobs(),
    session?.user?.id ? fetchAppliedJobIds(session.user.id) : Promise.resolve([]),
  ]);

  return <NewsSlider jobs={jobs} appliedJobIds={appliedJobIds} setupProgress={setupProgress} />;
}
