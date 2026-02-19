"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import JobDetailsMenu from "./JobDetailsMenu";
import AdditionalDetailsMenu from "./AdditionalDetailsMenu";
import { useWorkerProfileData } from "@/hooks/useWorkerProfile";
import { BRAND_COLORS } from "@/constants";

interface ProfileEditLayoutProps {
  children: ReactNode;
  currentSection: string;
  applyJobId?: string | null;
  applyJobTitle?: string | null;
}

export default function ProfileEditLayout({ children, currentSection, applyJobId, applyJobTitle }: ProfileEditLayoutProps) {
  // Prefetch data at layout level so it's ready for all sections
  const { data, isLoading } = useWorkerProfileData();
  const router = useRouter();

  useEffect(() => {

  }, [data]);

  const inApplyFlow = !!applyJobId;

  return (
    <div className="profile-edit-container">
      {/* Apply flow context banner */}
      {inApplyFlow && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.625rem 1rem',
          marginBottom: '0.75rem',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '0.75rem',
          fontSize: '0.8125rem',
          color: '#15803d',
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
            <path d="M20 6h-2.18c.07-.44.18-.88.18-1.36C18 2.51 15.5.03 12.5.03c-1.65 0-3.1.7-4.14 1.8L7 3.15l-1.36-1.3C4.6.7 3.15 0 1.5 0 .67 0 0 .67 0 1.5v1C0 3.33.67 4 1.5 4H4L2.17 5.83A.996.996 0 002 6.5V8c0 .55.45 1 1 1h7v9c0 1.1.9 2 2 2s2-.9 2-2v-9h5c1.1 0 2-.9 2-2V8c0-.55-.45-1-1-1zm-8-4c.83 0 1.5.67 1.5 1.5S12.83 5 12 5s-1.5-.67-1.5-1.5S11.17 2 12 2z"/>
          </svg>
          <span>
            Applying for: <strong>{applyJobTitle}</strong> — update your profile and hit Apply Now when ready
          </span>
        </div>
      )}

      {/* Page Header */}
      <div className="profile-edit-header">
        <h1 className="profile-edit-title">My profile</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {inApplyFlow && (
            <button
              className="profile-preview-button"
              onClick={() => {
                // Do NOT remove sessionStorage here — the user may use the
                // browser back button to return to profile-building, and we
                // need the context to still be available as a fallback.
                // It is cleared only after a successful apply (in NewsSlider).
                router.push(`/dashboard/worker?apply=${applyJobId}`);
              }}
              style={{ background: BRAND_COLORS.TERTIARY, color: BRAND_COLORS.PRIMARY }}
            >
              <svg className="profile-preview-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Review Application</span>
            </button>
          )}
          <button className="profile-preview-button" onClick={() => router.push('/dashboard/worker/profile-preview')}>
            <svg className="profile-preview-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Preview profile</span>
          </button>
        </div>
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
