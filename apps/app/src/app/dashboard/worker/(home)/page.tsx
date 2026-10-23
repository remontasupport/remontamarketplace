/**
 * Worker Dashboard - Server Component
 * Protected route - only accessible to users with WORKER role
 * Uses getServerSession for server-side authentication (PRODUCTION-READY); the profile data is the api's (U5c)
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { authOptions } from "@/lib/auth.config";
import { UserRole } from "@/types/auth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import NewsSlider from "@/components/dashboard/NewsSlider";
import NewsSliderAsync from "@/components/dashboard/NewsSliderAsync";
import ProfileCompletionReminder from "@/components/dashboard/ProfileCompletionReminder";
import ActivationNote from "@/components/dashboard/ActivationNote";

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

  // U5c: the name, photo, role and completion come from the api's profile read on the client (the sidebar, the
  // reminder and the jobs share it); this server page no longer reads the database or the completion action.

  // At this point, we have a valid WORKER session
  // This code only runs server-side, so it's completely secure
  return (
    <DashboardLayout>
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
          <ProfileCompletionReminder />
        </div>
        {/* Decorative elements */}
        <div className="hero-decoration hero-decoration-1"></div>
        <div className="hero-decoration hero-decoration-2"></div>
      </div>

      {/* worker-activation (A8): "awaiting approval" while an admin has not switched the worker on */}
      <ActivationNote />

      {/* Jobs Section - Streaming with Suspense */}
      <div style={{ marginTop: '0' }}>
        <Suspense fallback={<NewsSlider jobs={[]} isLoading={true} />}>
          <NewsSliderAsync />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
