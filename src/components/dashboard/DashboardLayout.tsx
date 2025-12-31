'use client'

import { ReactNode, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Sidebar from './Sidebar'
import SimpleDashboardHeader from './SimpleDashboardHeader'
import { ImpersonationBanner } from '@/components/admin/ImpersonationButton'
import { isImpersonating } from '@/lib/impersonation'

interface DashboardLayoutProps {
  children: ReactNode
  profileData?: {
    firstName: string
    photo: string | null
  }
}

export default function DashboardLayout({
  children,
  profileData
}: DashboardLayoutProps) {
  const { data: session } = useSession()
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
      {/* Impersonation Banner - Shows when admin is impersonating */}
      {isImpersonating(session) && <ImpersonationBanner />}

      {/* Dashboard Header - Full Width at Top */}
      <SimpleDashboardHeader onMenuToggle={toggleMobileMenu} />

      {/* Dashboard Container - Sidebar + Content */}
      <div className="dashboard-container">
        {/* Left Sidebar with Profile */}
        <Sidebar
          isMobileOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
          profileData={profileData}
        />

        {/* Main Content */}
        <main className="dashboard-main">
          {children}
        </main>
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
