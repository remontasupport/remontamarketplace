'use client'

import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import ProfileCard from './ProfileCard'

interface DashboardLayoutProps {
  children: ReactNode
  showProfileCard?: boolean
}

export default function DashboardLayout({
  children,
  showProfileCard = true
}: DashboardLayoutProps) {
  return (
    <div className="dashboard-container">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="dashboard-main">
        {children}
      </main>

      {/* Right Sidebar - Profile Card */}
      {showProfileCard && (
        <aside className="dashboard-right-sidebar">
          <ProfileCard />
        </aside>
      )}
    </div>
  )
}
