"use client";

import { Suspense, useState, useLayoutEffect } from "react";
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

// ─── Types ────────────────────────────────────────────────────────────────────

type ApplyContext = { applyJobId: string; applyJobTitle: string } | null;

// ─── Inner content (needs Suspense because of useSearchParams) ────────────────

function ProfileBuildingContent({ applyContext }: { applyContext: ApplyContext }) {
  const searchParams = useSearchParams();
  const section = searchParams.get("section") || "preferred-hours";

  const { data: session } = useSession();
  const { data: profileData } = useWorkerProfile(session?.user?.id);
  const primaryService = profileData?.services?.[0] || 'Support Worker';

  const renderSection = () => {
    switch (section) {
      case "preferred-hours":      return <PreferredHoursSection />;
      case "experience":           return <ExperienceSection />;
      case "bank-account":         return <BankAccountSection />;
      case "work-history":         return <WorkHistorySection />;
      case "education-training":   return <EducationTrainingSection />;
      case "good-to-know":         return <GoodToKnowSection />;
      case "languages":            return <LanguagesSection />;
      case "cultural-background":  return <CulturalBackgroundSection />;
      case "religion":             return <ReligionSection />;
      case "interests-hobbies":    return <InterestsHobbiesSection />;
      case "about-me":             return <AboutMeSection />;
      case "personality":          return <PersonalitySection />;
      case "my-preferences":       return <MyPreferencesSection />;
      default:                     return <PreferredHoursSection />;
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
        <ProfileEditLayout
          currentSection={section}
          applyJobId={applyContext?.applyJobId}
          applyJobTitle={applyContext?.applyJobTitle}
        >
          {renderSection()}
        </ProfileEditLayout>
      </QueryProvider>
    </DashboardLayout>
  );
}

// ─── Page shell (OUTSIDE Suspense — never remounted during section navigation) ─

export default function ProfileBuildingPage() {
  /**
   * WHY this lives here and not inside ProfileBuildingContent:
   *
   * The sidebar menu links navigate with hardcoded hrefs like
   * `?section=work-history`, stripping applyJobId from the URL.
   * When useSearchParams() sees a param change, Next.js may remount the
   * Suspense child, resetting any state inside it.
   *
   * By owning applyContext HERE (outside <Suspense>), the value is stable
   * for the entire time the user is on the profile-building page, regardless
   * of how many sections they visit.
   *
   * WHY useLayoutEffect instead of useState lazy initializer or useEffect:
   * - Lazy initializer: causes a hydration mismatch (server returns null because
   *   `window` is absent, but client returns the real value; React 18 warns).
   * - useEffect: runs AFTER the browser has already painted, causing a visible
   *   flicker where the button is absent on the first frame.
   * - useLayoutEffect: runs synchronously after React commits the DOM but
   *   BEFORE the browser paints. React flushes the resulting setState before
   *   handing control to the browser, so the user always sees the final state.
   *   It is a no-op on the server, so SSR/hydration remain consistent.
   */
  const [applyContext, setApplyContext] = useState<ApplyContext>(null);

  useLayoutEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlJobId    = params.get('applyJobId');
    const urlJobTitle = params.get('applyJobTitle');

    if (urlJobId && urlJobTitle) {
      setApplyContext({
        applyJobId: urlJobId,
        applyJobTitle: decodeURIComponent(urlJobTitle),
      });
      return;
    }

    // Fallback: context was saved to sessionStorage when the user clicked
    // "Edit My Profile" in the apply modal and is still valid.
    try {
      const stored = sessionStorage.getItem('remonta_apply_context');
      if (stored) setApplyContext(JSON.parse(stored));
    } catch {}
  }, []); // runs once after mount — ProfileBuildingPage never remounts mid-session

  return (
    <Suspense fallback={
      <DashboardLayout
        profileData={{ firstName: 'Worker', photo: null, role: 'Support Worker' }}
      >
        <div className="profile-edit-container" style={{ opacity: 0.6 }}>
          <div className="profile-edit-header">
            <div style={{ width: '150px', height: '32px', background: '#e5e7eb', borderRadius: '4px' }} />
          </div>
          <div className="profile-edit-grid">
            <div className="profile-edit-sidebar">
              <div className="additional-details-menu">
                <div style={{ width: '100%', height: '200px', background: '#f9fafb', borderRadius: '0.75rem' }} />
              </div>
            </div>
            <div className="profile-edit-main">
              <div style={{ width: '100%', height: '300px', background: '#f9fafb', borderRadius: '8px' }} />
            </div>
          </div>
        </div>
      </DashboardLayout>
    }>
      <ProfileBuildingContent applyContext={applyContext} />
    </Suspense>
  );
}
