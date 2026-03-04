"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import RequestServiceMenu from "./RequestServiceMenu";
import ClientListPanel from "./ClientListPanel";
import { useRequestService } from "./RequestServiceContext";

interface RequestServiceLayoutProps {
  children: ReactNode;
  currentSection: string;
}

export default function RequestServiceLayout({ children, currentSection }: RequestServiceLayoutProps) {
  const { selectedParticipantId } = useRequestService();
  const pathname = usePathname();
  const isClientPath = !pathname.includes("supportcoordinators");

  // On client/self path the participant is always pre-set — UI is always enabled
  const hasClient = isClientPath || !!selectedParticipantId;

  return (
    <div className="profile-edit-container">
      {/* Main Content Grid */}
      <div className="profile-edit-grid">
        {/* Left: Menu - Hidden on mobile */}
        <div className="profile-edit-sidebar hide-on-mobile">
          {/* Participant selection first, before the steps (coordinator only) */}
          {!isClientPath && <ClientListPanel />}
          <div style={!hasClient ? { opacity: 0.4, pointerEvents: "none", userSelect: "none" } : undefined}>
            <RequestServiceMenu currentSection={currentSection} />
          </div>
        </div>

        {/* Right: Content Area */}
        <div className="profile-edit-main">
          {/* Mobile-only: participant selection above the form steps (coordinator only) */}
          {!isClientPath && (
            <div className="md:hidden mb-4">
              <ClientListPanel />
            </div>
          )}
          <div
            style={!hasClient ? { opacity: 0.4, pointerEvents: "none", userSelect: "none" } : undefined}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
