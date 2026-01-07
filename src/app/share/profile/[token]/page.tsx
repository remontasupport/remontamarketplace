"use client";

import * as React from 'react';
import { use } from "react";
import WorkerProfileView from "@/components/profile/WorkerProfileView";
import Loader from "@/components/ui/Loader";
import "@/app/styles/profile-preview.css";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function PublicProfilePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [profileData, setProfileData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);

        // Fetch profile data using the token via API
        const response = await fetch(`/api/share/profile?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(data.error || "Invalid or expired share link");
          setIsLoading(false);
          return;
        }

        setProfileData(data.data);
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      loadProfile();
    }
  }, [token]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader size="lg" />
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Invalid</h1>
          <p className="text-gray-600 mb-4">
            {error || "This profile link is invalid or has expired."}
          </p>
          <p className="text-sm text-gray-500">
            Please contact the person who shared this link with you.
          </p>
        </div>
      </div>
    );
  }

  const { profile, services, qualifications, additionalInfo } = profileData;

  // Generate initials
  const initials = profile?.firstName && profile?.lastName
    ? `${profile.firstName[0]}${profile.lastName[0]}`
    : "U";

  // Format services separated by slashes
  const servicesText = services && services.length > 0
    ? services.map((service: any) => service.categoryName).join(" / ")
    : "Support Worker";

  return (
    <div className="min-h-screen bg-gray-50 pt-8">
      {/* Clean profile view - no navigation, no banners */}
      <div className="profile-preview-page">
        {/* Profile Header */}
        <div className="profile-preview-header">
          <div className="profile-preview-header-content">
            {/* Avatar */}
            <div className="profile-preview-avatar">
              {profile?.photos ? (
                <img src={profile.photos} alt={`${profile.firstName} ${profile.lastName}`} />
              ) : (
                <div className="profile-preview-avatar-placeholder">
                  {initials}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="profile-preview-info">
              <h1 className="profile-preview-name">
                {profile.firstName} {profile.lastName}
              </h1>
              <p className="profile-preview-roles">
                {servicesText}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <WorkerProfileView
          profile={profile}
          services={services}
          qualifications={qualifications}
          additionalInfo={additionalInfo}
          isAdminView={true}
        />
      </div>
    </div>
  );
}
