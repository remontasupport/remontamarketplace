"use client";

import { ReactNode } from "react";
import RequestServiceMenu from "./RequestServiceMenu";
import ClientListPanel from "./ClientListPanel";
import { useRequestService } from "./RequestServiceContext";

interface RequestServiceLayoutProps {
  children: ReactNode;
  currentSection: string;
}

export default function RequestServiceLayout({ children, currentSection }: RequestServiceLayoutProps) {
  const { selectedParticipantId } = useRequestService();
  const hasClient = !!selectedParticipantId;

  return (
    <div className="profile-edit-container">
      {/* Main Content Grid */}
      <div className="profile-edit-grid">
        {/* Left: Menu - Hidden on mobile */}
        <div className="profile-edit-sidebar hide-on-mobile">
          <div style={!hasClient ? { opacity: 0.4, pointerEvents: "none", userSelect: "none" } : undefined}>
            <RequestServiceMenu currentSection={currentSection} />
          </div>
          <ClientListPanel />
        </div>

        {/* Right: Content Area */}
        <div
          className="profile-edit-main"
          style={!hasClient ? { opacity: 0.4, pointerEvents: "none", userSelect: "none" } : undefined}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
