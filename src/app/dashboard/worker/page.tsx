/**
 * Worker Dashboard - Server Component
 * Protected route - only accessible to users with WORKER role
 * Uses getServerSession for server-side authentication (PRODUCTION-READY)
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth.config";
import { UserRole } from "@/types/auth";
import { authPrisma } from "@/lib/auth-prisma";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

// Disable caching for this page - CRITICAL for security
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// News array for dashboard
const newsItems = [
  {
    id: 1,
    image: "/images/howToSignUp.webp",
    headline: "How to Sign Up for the NDIS: Step-by-Step Guide"
  },
  {
    id: 2,
    image: "/images/remontaAndTech.avif",
    headline: "Remonta and Technology: Putting Choice Back in the Hands of Families"
  },
  {
    id: 3,
    image: "/images/ndisForChildren.avif",
    headline: "NDIS Changes for Children with Autism: What Does \"Thriving Kids\" Mean?"
  }
];

export default async function WorkerDashboard() {
  // Server-side session validation using getServerSession (RECOMMENDED APPROACH)
  const session = await getServerSession(authOptions);

  console.log("🔒 Server Component - Validating session");
  console.log("👤 Session:", session ? "Found" : "Not found");

  // Redirect to login if no session
  if (!session || !session.user) {
    console.log("❌ No session - redirecting to login");
    redirect("/login");
  }

  // Redirect if wrong role
  if (session.user.role !== UserRole.WORKER) {
    console.log("❌ Wrong role:", session.user.role, "- redirecting to unauthorized");
    redirect("/unauthorized");
  }

  console.log("✅ Access granted - rendering dashboard");

  // Fetch worker profile data from database
  const workerProfile = await authPrisma.workerProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      firstName: true,
      lastName: true,
      photos: true,
    },
  });

  console.log("📝 Worker Profile:", workerProfile ? "Found" : "Not found");

  // At this point, we have a valid WORKER session
  // This code only runs server-side, so it's completely secure
  return (
    <DashboardLayout
      profileData={{
        firstName: workerProfile?.firstName || 'Worker',
        photo: workerProfile?.photos ? (Array.isArray(workerProfile.photos) ? workerProfile.photos[0] : (workerProfile.photos as any)?.[0]) : null,
      }}
    >
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-content">
          <h2 className="hero-title">
            Welcome to Remonta!
          </h2>
          <p className="text-white/90 text-lg font-poppins mt-4">
            Connecting support workers with families to create meaningful, life-changing relationships.
          </p>
        </div>
        {/* Decorative elements */}
        <div className="hero-decoration hero-decoration-1"></div>
        <div className="hero-decoration hero-decoration-2"></div>
      </div>

      {/* Continue Watching Section */}
      <div>
        <div className="section-header-main">
          <h3 className="section-title-main">
            Read more news
          </h3>
          <div className="section-nav-btns">
            <button className="nav-arrow-btn">
              ←
            </button>
            <button className="nav-arrow-btn">
              →
            </button>
          </div>
        </div>

        <div className="course-cards-grid">
          {newsItems.map((news) => (
            <div key={news.id} className="course-card">
              <div className="course-thumbnail">
                <img
                  src={news.image}
                  alt={news.headline}
                  className="course-thumbnail-image"
                />
              </div>
              <div className="course-card-content">
                <h4 className="course-card-title">
                  {news.headline}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
