'use client'

import { ReactNode, useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import ProfileCard from './ProfileCard'
import SimpleDashboardHeader from './SimpleDashboardHeader'

interface DashboardLayoutProps {
  children: ReactNode
  showProfileCard?: boolean
  profileData?: {
    firstName: string
    photo: string | null
  }
}

export default function DashboardLayout({
  children,
  showProfileCard = true,
  profileData
}: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  return (
    <div className="dashboard-wrapper">
      {/* Dashboard Header - Full Width at Top */}
      <SimpleDashboardHeader onMenuToggle={toggleMobileMenu} />

      {/* Dashboard Container - Sidebar + Content + Profile */}
      <div className="dashboard-container">
        {/* Left Sidebar */}
        <Sidebar
          isMobileOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
        />

        {/* Main Content */}
        <main className="dashboard-main">
          {children}
        </main>

        {/* Right Sidebar - Profile Card */}
        {showProfileCard && (
          <aside className="dashboard-right-sidebar">
            <ProfileCard profileData={profileData} />
          </aside>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={closeMobileMenu}
        />
      )}
    </div>
  )
}
