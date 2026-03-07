/**
 * Worker Dashboard - Server Component
 * Protected route - only accessible to users with WORKER role
 * Uses getServerSession for server-side authentication (PRODUCTION-READY)
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { authOptions } from "@/lib/auth.config";
import { UserRole } from "@/types/auth";
import { authPrisma, withRetry } from "@/lib/auth-prisma";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import NewsSlider from "@/components/dashboard/NewsSlider";
import NewsSliderAsync from "@/components/dashboard/NewsSliderAsync";
import ProfileCompletionReminder from "@/components/dashboard/ProfileCompletionReminder";
import {
  getAllCompletionStatusOptimized,
} from "@/services/worker/setupProgress.service";
import { getOrFetch, CACHE_KEYS, CACHE_TTL } from "@/lib/redis";

// Disable caching for this page - CRITICAL for security
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function WorkerDashboard() {
  const session = await getServerSession(authOptions);
  // Redirect to login if no session
  if (!session || !session.user) {
    redirect("/login");
  }

  // Redirect if wrong role
  if (session.user.role !== UserRole.WORKER) {
    redirect("/unauthorized");
  }

  // Run profile fetch + completion status in parallel — both cached independently
  const [workerProfile, completionResult] = await Promise.all([
    getOrFetch(
      CACHE_KEYS.workerProfile(session.user.id),
      () => withRetry(() => authPrisma.workerProfile.findUnique({
        where: { userId: session.user.id },
        select: {
          firstName: true,
          lastName: true,
          photos: true,
          workerServices: {
            select: { categoryName: true },
            orderBy: { createdAt: 'asc' },
            take: 1,
          },
        },
      })),
      CACHE_TTL.WORKER_PROFILE
    ),
    getOrFetch(
      CACHE_KEYS.completionStatus(session.user.id),
      () => getAllCompletionStatusOptimized(session.user.id),
      CACHE_TTL.COMPLETION_STATUS
    ),
  ]);
  
  // Construct setupProgress from optimized single-query result
  const setupProgress = completionResult.success && completionResult.data
    ? completionResult.data
    : {
        accountDetails: false,
        compliance: false,
        trainings: false,
        services: false,
      };

  // Extract primary service for role display
  const primaryService = workerProfile?.workerServices?.[0]?.categoryName || 'Support Worker';

  // At this point, we have a valid WORKER session
  // This code only runs server-side, so it's completely secure
  return (
    <DashboardLayout
      profileData={{
        firstName: workerProfile?.firstName || 'Worker',
        // photos is now a string (single photo URL), not an array
        photo: workerProfile?.photos || null,
        role: primaryService,
      }}
    >
      {/* Hero Banner - Flex approach for mobile */}
      <div className="hero-banner" style={{ marginTop: '0' }}>
        <div className="hero-content">
          <h2 className="hero-title">
            Welcome to Remonta!
          </h2>
          <p className="hero-description">
            Connecting support workers with families to create meaningful, life-changing relationships.
          </p>

          {/* View Profile Button with Morphing Animation */}
          <a
            href="/dashboard/worker/profile-preview"
            className="group inline-flex items-center gap-3 transition-all duration-300 ease-in-out"
          >
            {/* Circular button that expands on hover */}
            <div className="relative flex items-center justify-center w-10 h-10 bg-teal-600 rounded-full transition-all duration-300 ease-in-out group-hover:w-[180px] group-hover:rounded-full overflow-hidden">
              {/* Arrow icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-5 h-5 text-white transition-transform duration-300 ease-in-out group-hover:translate-x-[-55px]"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>

              {/* Text inside button (visible only on hover) */}
              <span className="absolute left-12 text-sm font-poppins font-bold text-white uppercase tracking-wide opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100 whitespace-nowrap">
                VIEW PROFILE
              </span>
            </div>

            {/* Text outside button (hidden on hover) */}
            <span className="text-sm font-poppins font-bold text-white-800 uppercase tracking-wide transition-opacity duration-300 ease-in-out group-hover:opacity-0">
              VIEW PROFILE
            </span>
          </a>

          {/* Profile Completion Reminder */}
          <ProfileCompletionReminder initialSetupProgress={setupProgress} />
        </div>
        {/* Decorative elements */}
        <div className="hero-decoration hero-decoration-1"></div>
        <div className="hero-decoration hero-decoration-2"></div>
      </div>

      {/* Jobs Section - Streaming with Suspense */}
      <div style={{ marginTop: '0' }}>
        <Suspense fallback={<NewsSlider jobs={[]} isLoading={true} />}>
          <NewsSliderAsync />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
