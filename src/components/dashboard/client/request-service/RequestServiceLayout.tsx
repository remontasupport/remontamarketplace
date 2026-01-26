"use client";

import { ReactNode } from "react";
import RequestServiceMenu from "./RequestServiceMenu";

interface RequestServiceLayoutProps {
  children: ReactNode;
  currentSection: string;
}

export default function RequestServiceLayout({ children, currentSection }: RequestServiceLayoutProps) {
  return (
    <div className="profile-edit-container">
      {/* Main Content Grid */}
      <div className="profile-edit-grid">
        {/* Left: Menu */}
        <div className="profile-edit-sidebar">
          <RequestServiceMenu currentSection={currentSection} />
        </div>

        {/* Right: Content Area */}
        <div className="profile-edit-main">
          {children}
        </div>
      </div>
    </div>
  );
}
