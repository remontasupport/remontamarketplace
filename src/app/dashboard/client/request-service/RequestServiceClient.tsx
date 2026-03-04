"use client";

import { Suspense } from "react";
import ClientDashboardLayout from "@/components/dashboard/client/ClientDashboardLayout";
import RequestServiceLayout from "@/components/dashboard/client/request-service/RequestServiceLayout";
import { RequestServiceProvider, useRequestService } from "@/components/dashboard/client/request-service/RequestServiceContext";
import WhatSection from "@/components/dashboard/client/request-service/sections/WhatSection";
import WhereSection from "@/components/dashboard/client/request-service/sections/WhereSection";
import WhenSection from "@/components/dashboard/client/request-service/sections/WhenSection";
import PreferencesSection from "@/components/dashboard/client/request-service/sections/PreferencesSection";
import SupportDetailsSection from "@/components/dashboard/client/request-service/sections/SupportDetailsSection";
import PreviewSection from "@/components/dashboard/client/request-service/sections/PreviewSection";

interface Props {
  displayName: string;
  defaultParticipantId?: string | null;
  defaultParticipantName?: string | null;
}

function RequestServiceContent({ displayName }: Props) {
  const { currentSection } = useRequestService();

  const renderSection = () => {
    switch (currentSection) {
      case "what":        return <WhatSection />;
      case "where":       return <WhereSection />;
      case "when":        return <WhenSection />;
      case "support-details": return <SupportDetailsSection />;
      case "preferences": return <PreferencesSection />;
      case "preview":     return <PreviewSection />;
      default:            return <WhatSection />;
    }
  };

  return (
    <ClientDashboardLayout
      profileData={{ firstName: displayName, photo: null }}
    >
      <RequestServiceLayout currentSection={currentSection}>
        {renderSection()}
      </RequestServiceLayout>
    </ClientDashboardLayout>
  );
}

export default function RequestServiceClient({ displayName, defaultParticipantId, defaultParticipantName }: Props) {
  return (
    <Suspense
      fallback={
        <ClientDashboardLayout
          profileData={{ firstName: displayName, photo: null }}
        >
          <div className="profile-edit-container" style={{ opacity: 0.6 }}>
            <div className="profile-edit-grid">
              <div className="profile-edit-sidebar">
                <div className="additional-details-menu">
                  <div style={{ width: "100%", height: "200px", background: "#f9fafb", borderRadius: "0.75rem" }} />
                </div>
              </div>
              <div className="profile-edit-main">
                <div style={{ width: "100%", height: "300px", background: "#f9fafb", borderRadius: "8px" }} />
              </div>
            </div>
          </div>
        </ClientDashboardLayout>
      }
    >
      <RequestServiceProvider defaultParticipantId={defaultParticipantId} defaultParticipantName={defaultParticipantName}>
        <RequestServiceContent displayName={displayName} />
      </RequestServiceProvider>
    </Suspense>
  );
}
