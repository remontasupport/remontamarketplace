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
import { authPrisma } from "@/lib/auth-prisma";
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
  // PERFORMANCE LOGGING: Track dashboard rendering
  const dashboardStart = Date.now();
  // Server-side session validation using getServerSession (RECOMMENDED APPROACH)
  const session = await getServerSession(authOptions);
  // Redirect to login if no session
  if (!session || !session.user) {
    redirect("/login");
  }

  // Redirect if wrong role
  if (session.user.role !== UserRole.WORKER) {
    redirect("/unauthorized");
  }

  // REDIS OPTIMIZATION: Cache worker profile to avoid slow database queries
  // First load: ~700ms (database), Subsequent loads: ~20-50ms (Redis cache)
  const profileStart = Date.now();
  const workerProfile = await getOrFetch(
    CACHE_KEYS.workerProfile(session.user.id),
    async () => {
      return await authPrisma.workerProfile.findUnique({
        where: { userId: session.user.id },
        select: {
          firstName: true,
          lastName: true,
          photos: true,
          workerServices: {
            select: {
              categoryName: true,
            },
            orderBy: {
              createdAt: 'asc', // Get first service added (primary service)
            },
            take: 1,
          },
        },
      });
    },
    CACHE_TTL.WORKER_PROFILE
  );

  // PHASE 1 OPTIMIZATION: Single optimized query replaces 4 separate functions
  // REDIS OPTIMIZATION: Cache completion status (biggest performance win!)
  // First load: ~7000ms (multiple DB queries), Subsequent loads: ~50ms (Redis cache)
  const completionResult = await getOrFetch(
    CACHE_KEYS.completionStatus(session.user.id),
    () => getAllCompletionStatusOptimized(session.user.id),
    CACHE_TTL.COMPLETION_STATUS
  );
  
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

          {/* Profile Completion Reminder */}
          <ProfileCompletionReminder initialSetupProgress={setupProgress} />
        </div>
        {/* Decorative elements */}
        <div className="hero-decoration hero-decoration-1"></div>
        <div className="hero-decoration hero-decoration-2"></div>
      </div>

      {/* News Section - Streaming with Suspense */}
      <div style={{ marginTop: '0' }}>
        <Suspense fallback={<NewsSlider articles={[]} isLoading={true} />}>
          <NewsSliderAsync />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
