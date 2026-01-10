"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProfileEditLayout from "@/components/profile-building/ProfileEditLayout";
import QueryProvider from "@/providers/QueryProvider";
import PreferredHoursSection from "@/components/profile-building/sections/PreferredHoursSection";
// import LocationsSection from "@/components/profile-building/sections/LocationsSection";
import ExperienceSection from "@/components/profile-building/sections/ExperienceSection";
import BankAccountSection from "@/components/profile-building/sections/BankAccountSection";
import WorkHistorySection from "@/components/profile-building/sections/WorkHistorySection";
import EducationTrainingSection from "@/components/profile-building/sections/EducationTrainingSection";
import GoodToKnowSection from "@/components/profile-building/sections/GoodToKnowSection";
import LanguagesSection from "@/components/profile-building/sections/LanguagesSection";
import CulturalBackgroundSection from "@/components/profile-building/sections/CulturalBackgroundSection";
import ReligionSection from "@/components/profile-building/sections/ReligionSection";
import InterestsHobbiesSection from "@/components/profile-building/sections/InterestsHobbiesSection";
import AboutMeSection from "@/components/profile-building/sections/AboutMeSection";
import PersonalitySection from "@/components/profile-building/sections/PersonalitySection";
import MyPreferencesSection from "@/components/profile-building/sections/MyPreferencesSection";
import { useWorkerProfile } from "@/hooks/queries/useWorkerProfile";
import Loader from "@/components/ui/Loader";

function ProfileBuildingContent() {
  const searchParams = useSearchParams();
  const section = searchParams.get("section") || "preferred-hours";
  const { data: session } = useSession();

  // Fetch worker profile for dynamic role
  const { data: profileData } = useWorkerProfile(session?.user?.id);

  // Extract primary service for role display
  const primaryService = profileData?.services?.[0] || 'Support Worker';

  // Render the appropriate section based on URL parameter
  const renderSection = () => {
    switch (section) {
      // Job Details
      case "preferred-hours":
        return <PreferredHoursSection />;
      // case "locations":
      //   return <LocationsSection />;
      case "experience":
        return <ExperienceSection />;
      // Additional Details
      case "bank-account":
        return <BankAccountSection />;
      case "work-history":
        return <WorkHistorySection />;
      case "education-training":
        return <EducationTrainingSection />;
      case "good-to-know":
        return <GoodToKnowSection />;
      case "languages":
        return <LanguagesSection />;
      case "cultural-background":
        return <CulturalBackgroundSection />;
      case "religion":
        return <ReligionSection />;
      case "interests-hobbies":
        return <InterestsHobbiesSection />;
      case "about-me":
        return <AboutMeSection />;
      case "personality":
        return <PersonalitySection />;
      case "my-preferences":
        return <MyPreferencesSection />;
      default:
        return <PreferredHoursSection />;
    }
  };

  return (
    <DashboardLayout
      profileData={{
        firstName: profileData?.firstName || 'Worker',
        photo: profileData?.photos || null,
        role: primaryService,
      }}
    >
      <QueryProvider>
        <ProfileEditLayout currentSection={section}>
          {renderSection()}
        </ProfileEditLayout>
      </QueryProvider>
    </DashboardLayout>
  );
}

export default function ProfileBuildingPage() {
  return (
    <Suspense fallback={
      <DashboardLayout
        profileData={{
          firstName: 'Worker',
          photo: null,
          role: 'Support Worker',
        }}
      >
        {/* Skeleton that matches the actual layout to prevent flicker */}
        <div className="profile-edit-container" style={{ opacity: 0.6 }}>
          <div className="profile-edit-header">
            <div style={{ width: '150px', height: '32px', background: '#e5e7eb', borderRadius: '4px' }}></div>
          </div>
          <div className="profile-edit-grid">
            <div className="profile-edit-sidebar">
              <div className="additional-details-menu">
                <div style={{ width: '100%', height: '200px', background: '#f9fafb', borderRadius: '0.75rem' }}></div>
              </div>
            </div>
            <div className="profile-edit-main">
              <div style={{ width: '100%', height: '300px', background: '#f9fafb', borderRadius: '8px' }}></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    }>
      <ProfileBuildingContent />
    </Suspense>
  );
}
