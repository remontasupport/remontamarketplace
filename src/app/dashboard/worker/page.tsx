"use client";

/**
 * Worker Dashboard
 * Protected route - only accessible to users with WORKER role
 */

import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

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
    headline: "NDIS Changes for Children with Autism: What Does “Thriving Kids” Mean?"
  }
];

export default function WorkerDashboard() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="font-poppins text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-content">
          <h2 className="hero-title">
            Welcome to Remonta!<br />Verify Your Account Today
          </h2>
          <button className="hero-btn">
            Verify →
          </button>
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
