"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import JobDetailsMenu from "./JobDetailsMenu";
import AdditionalDetailsMenu from "./AdditionalDetailsMenu";
import { useWorkerProfileData } from "@/hooks/useWorkerProfile";

interface ProfileEditLayoutProps {
  children: ReactNode;
  currentSection: string;
}

export default function ProfileEditLayout({ children, currentSection }: ProfileEditLayoutProps) {
  // Prefetch data at layout level so it's ready for all sections
  const { data, isLoading } = useWorkerProfileData();
  const router = useRouter();

  useEffect(() => {
    console.log("Profile data loaded in layout:", data);
  }, [data]);

  return (
    <div className="profile-edit-container">
      {/* Page Header */}
      <div className="profile-edit-header">
        <h1 className="profile-edit-title">My profile</h1>
        <button className="profile-preview-button" onClick={() => router.push('/dashboard/worker/profile-preview')}>
          <svg className="profile-preview-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>Preview profile</span>
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="profile-edit-grid">
        {/* Left: Menus */}
        <div className="profile-edit-sidebar">
          <JobDetailsMenu currentSection={currentSection} />
          <AdditionalDetailsMenu currentSection={currentSection} />
        </div>

        {/* Right: Content Area */}
        <div className="profile-edit-main">
          {children}
        </div>
      </div>
    </div>
  );
}
