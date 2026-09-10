"use client";

import * as React from "react";
import { use } from "react";
import Loader from "@/components/ui/Loader";
import WorkerProfileView from "@/components/profile/WorkerProfileView";
import { getWorkerProfilePreview } from "@/services/worker/profilePreview.service";
import "@/app/styles/profile-preview.css";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function WorkerProfilePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id;

  const [profileData, setProfileData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const data = await getWorkerProfilePreview(userId);
        setProfileData(data);
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-red-600">{error || "Failed to load profile data"}</p>
      </div>
    );
  }

  const { profile, services, qualifications, additionalInfo } = profileData;

  const initials =
    profile?.firstName && profile?.lastName
      ? `${profile.firstName[0]}${profile.lastName[0]}`
      : "U";

  const servicesText =
    services && services.length > 0
      ? services
          .flatMap((service: any) => {
            if (
              service.categoryName === "Therapeutic Supports" &&
              service.subcategories?.length > 0
            ) {
              return service.subcategories.map((sub: any) => sub.subcategoryName);
            }
            return [service.categoryName];
          })
          .join(" / ")
      : "Support Worker";

  return (
    <div className="min-h-screen bg-gray-50 pt-8">
      <div className="profile-preview-page">
        {/* Profile Header */}
        <div className="profile-preview-header">
          <div className="profile-preview-header-content">
            {/* Avatar */}
            <div className="profile-preview-avatar">
              {profile?.photos ? (
                <img
                  src={profile.photos}
                  alt={`${profile.firstName} ${profile.lastName}`}
                />
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
              <p className="profile-preview-roles">{servicesText}</p>
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
