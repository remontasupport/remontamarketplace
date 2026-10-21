'use client'

import { ReactNode, useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Sidebar from './Sidebar'
import SimpleDashboardHeader from './SimpleDashboardHeader'
import { ImpersonationBanner } from '@/components/admin/ImpersonationButton'
import { isImpersonating } from '@/lib/impersonation'
import { REPLAY_HREF, tourEnabled, WORKER_HOME } from '@/features/onboarding-tour/rules'

// onboarding-tour (TR-8, P4): the tour's code is a separate chunk, loaded only for a worker's session.
const OnboardingTour = dynamic(() => import('@/features/onboarding-tour/OnboardingTour'), { ssr: false })

interface DashboardLayoutProps {
  children: ReactNode
  showProfileCard?: boolean
  profileData?: {
    firstName: string
    photo: string | null
    role?: string
  }
}

export default function DashboardLayout({
  children,
  showProfileCard = true,
  profileData
}: DashboardLayoutProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  // onboarding-tour: workers only (this layout serves every role); the header's ? replays it (FR-REPLAY-01..02).
  const withTour = tourEnabled(session?.user?.role)
  const [tourReplay, setTourReplay] = useState(0)
  const takeTour = useCallback(() => {
    if (pathname === WORKER_HOME) setTourReplay((n) => n + 1)
    else router.push(REPLAY_HREF)
  }, [pathname, router])
  const openDrawer = useCallback(() => setIsMobileMenuOpen(true), [])

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
      <SimpleDashboardHeader onMenuToggle={toggleMobileMenu} onTakeTour={withTour ? takeTour : undefined} />

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

      {withTour && (
        <OnboardingTour pathname={pathname} impersonating={isImpersonating(session)} replayNonce={tourReplay} openDrawer={openDrawer} closeDrawer={closeMobileMenu} />
      )}

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
