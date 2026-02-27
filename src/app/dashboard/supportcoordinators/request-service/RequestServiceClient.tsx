"use client";

import { Suspense } from "react";
import ClientDashboardLayout from "@/components/dashboard/client/ClientDashboardLayout";
import RequestServiceLayout from "@/components/dashboard/client/request-service/RequestServiceLayout";
import { RequestServiceProvider, useRequestService } from "@/components/dashboard/client/request-service/RequestServiceContext";
import WhatSection from "@/components/dashboard/client/request-service/sections/WhatSection";
import WhereSection from "@/components/dashboard/client/request-service/sections/WhereSection";
import WhenSection from "@/components/dashboard/client/request-service/sections/WhenSection";
import DetailsSection from "@/components/dashboard/client/request-service/sections/DetailsSection";
import DiagnosesSection from "@/components/dashboard/client/request-service/sections/DiagnosesSection";
import PreferencesSection from "@/components/dashboard/client/request-service/sections/PreferencesSection";
import SupportDetailsSection from "@/components/dashboard/client/request-service/sections/SupportDetailsSection";
import PreviewSection from "@/components/dashboard/client/request-service/sections/PreviewSection";

interface Props {
  displayName: string;
}

function RequestServiceContent({ displayName }: Props) {
  const { currentSection } = useRequestService();

  const renderSection = () => {
    switch (currentSection) {
      case "what":            return <WhatSection />;
      case "where":           return <WhereSection />;
      case "when":            return <WhenSection />;
      case "support-details": return <SupportDetailsSection />;
      case "details":         return <DetailsSection hideRelationship />;
      case "diagnoses":       return <DiagnosesSection />;
      case "preferences":     return <PreferencesSection />;
      case "preview":         return <PreviewSection />;
      default:                return <WhatSection />;
    }
  };

  return (
    <ClientDashboardLayout
      profileData={{ firstName: displayName, photo: null }}
      basePath="/dashboard/supportcoordinators"
      roleLabel="Support Coordinator"
    >
      <RequestServiceLayout currentSection={currentSection}>
        {renderSection()}
      </RequestServiceLayout>
    </ClientDashboardLayout>
  );
}

export default function RequestServiceClient({ displayName }: Props) {
  return (
    <Suspense
      fallback={
        <ClientDashboardLayout
          profileData={{ firstName: displayName, photo: null }}
          basePath="/dashboard/supportcoordinators"
          roleLabel="Support Coordinator"
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
      <RequestServiceProvider>
        <RequestServiceContent displayName={displayName} />
      </RequestServiceProvider>
    </Suspense>
  );
}
