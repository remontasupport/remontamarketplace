'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserCircleIcon,
  HandRaisedIcon,
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  PencilIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline'
import { ACCOUNT_SETUP_STEPS, getStepUrl } from '@/config/accountSetupSteps'
import { SERVICES_SETUP_STEPS, getServicesStepUrl, generateServicesSetupSteps, ADDITIONAL_DOCUMENTS_STEP } from '@/config/servicesSetupSteps'
import { MANDATORY_REQUIREMENTS_SETUP_STEPS, getRequirementsStepUrl } from '@/config/mandatoryRequirementsSetupSteps'
import { useWorkerRequirements } from '@/hooks/queries/useWorkerRequirements'
import { useWorkerProfile } from '@/hooks/queries/useWorkerProfile'
import { useSession } from 'next-auth/react'
import { parseSetupProgress } from '@/types/setupProgress'
import { generateComplianceSteps, getComplianceStepUrl } from '@/utils/dynamicComplianceSteps'
import { generateTrainingSteps, getTrainingStepUrl } from '@/utils/dynamicTrainingSteps'

// Route-to-section mapping

const getSectionFromPath = (path: string): string | null => {
  if (path.includes('/account/')) return 'account-details';
  if (path.includes('/requirements/')) return 'requirements';
  if (path.includes('/trainings/')) return 'trainings';
  if (path.includes('/services/')) return 'services';
  if (path.includes('/additional-documents')) return 'additional-credentials';
  return null;
};

interface SubMenuItem {
  name: string
  href: string
}

interface MenuSection {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  items: SubMenuItem[]
}

// Dynamically generate account details items from centralized config
const accountDetailsItems = ACCOUNT_SETUP_STEPS.map(step => ({
  name: step.title,
  href: getStepUrl(step.slug)
}))

interface SidebarProps {
  isMobileOpen?: boolean
  onClose?: () => void
  profileData?: {
    firstName: string
    photo: string | null
    role?: string
  }
}

export default function Sidebar({ isMobileOpen = false, onClose, profileData: profileDataProp }: SidebarProps = {}) {
  // Get pathname first (needed for other hooks)
  const pathname = usePathname()

  // Get session and profile data for setup progress
  const { data: session } = useSession()
  const { data: profileDataFromHook, refetch, isRefetching } = useWorkerProfile(session?.user?.id)

  // CRITICAL: Aggressively refetch when on dashboard to ensure checkmarks appear
  useEffect(() => {
    if (pathname === '/dashboard/worker' && session?.user?.id) {
      // Force refetch immediately when dashboard mounts
      // This bypasses React Query cache and gets fresh setupProgress from API
      refetch()
    }
  }, [pathname, session?.user?.id, refetch])

  // CRITICAL FIX: Always use hook data for setupProgress (real-time calculated from API)
  // profileDataProp is from server component and doesn't include setupProgress
  // profileDataFromHook is from client-side API call with real-time progress calculation
  const profileData = profileDataProp || profileDataFromHook

  // Parse setup progress to show checkmarks
  // ALWAYS use profileDataFromHook for setupProgress (not profileDataProp!)
  const setupProgress = useMemo(() => {
    // Use hook data which has real-time calculated setupProgress from API
    const progress = profileDataFromHook?.setupProgress
    const parsed = parseSetupProgress(progress)

    return parsed
  }, [profileDataFromHook])

  // Fetch worker requirements to generate dynamic compliance items
  const { data: requirementsData, isLoading: isLoadingRequirements } = useWorkerRequirements()

  // Generate dynamic compliance steps from API data
  const dynamicComplianceSteps = useMemo(() => {
    return generateComplianceSteps(requirementsData)
  }, [requirementsData])

  // Generate dynamic training steps from API data
  const dynamicTrainingSteps = useMemo(() => {
    return generateTrainingSteps(requirementsData)
  }, [requirementsData])

  // Generate requirements items dynamically from API or fallback to static
  const requirementsItems = useMemo(() => {
    if (dynamicComplianceSteps.length > 0) {
      // Use dynamic steps from API
      return dynamicComplianceSteps.map(step => ({
        name: step.title,
        href: getComplianceStepUrl(step.slug)
      }))
    }
    // Fallback to static steps if API data not available yet
    return MANDATORY_REQUIREMENTS_SETUP_STEPS.map(step => ({
      name: step.title,
      href: getRequirementsStepUrl(step.slug)
    }))
  }, [dynamicComplianceSteps])

  // Generate trainings items dynamically from API
  const trainingsItems = useMemo(() => {
    if (dynamicTrainingSteps.length > 0) {
      return dynamicTrainingSteps.map(step => ({
        name: step.title,
        href: getTrainingStepUrl(step.slug)
      }))
    }
    return []
  }, [dynamicTrainingSteps])

  // Generate services items dynamically from profile data
  const servicesItems = useMemo(() => {
    // Get services from profile data (use hook data which has services array)
    const services = profileDataFromHook?.services || []

    if (services.length > 0) {
      // Generate dynamic steps based on selected services
      const dynamicSteps = generateServicesSetupSteps(services)
      return dynamicSteps.map(step => ({
        name: step.title,
        href: getServicesStepUrl(step.slug)
      }))
    }

    // Fallback to static steps if no services selected yet
    return SERVICES_SETUP_STEPS.map(step => ({
      name: step.title,
      href: getServicesStepUrl(step.slug)
    }))
  }, [profileDataFromHook?.services])

  // Additional Credentials items (Section 3)
  const additionalCredentialsItems = useMemo(() => {
    return [{
      name: ADDITIONAL_DOCUMENTS_STEP.title,
      href: '/dashboard/worker/additional-documents'
    }]
  }, [])

  // Helper to check if a section is completed
  const isSectionCompleted = (sectionId: string): boolean => {
    switch (sectionId) {
      case 'account-details':
        return setupProgress.accountDetails
      case 'requirements':
        return setupProgress.compliance
      case 'trainings':
        return setupProgress.trainings
      case 'services':
        return setupProgress.services
      case 'additional-credentials':
        return setupProgress.additionalCredentials || false
      default:
        return false
    }
  }

  const menuSections: MenuSection[] = [
    {
      id: 'account-details',
      name: 'Personal Info',
      icon: UserCircleIcon,
      items: accountDetailsItems
    },
    {
      id: 'requirements',
      name: 'Mandatory',
      icon: ClipboardDocumentCheckIcon,
      items: requirementsItems
    },
    {
      id: 'trainings',
      name: 'Trainings',
      icon: AcademicCapIcon,
      items: trainingsItems
    },
    {
      id: 'services',
      name: 'My Services',
      icon: HandRaisedIcon,
      items: servicesItems
    },
    {
      id: 'additional-credentials',
      name: 'Additional Credentials',
      icon: DocumentTextIcon,
      items: additionalCredentialsItems
    }
  ]
  // pathname already declared at top of component
  const previousSectionRef = useRef<string | null>(getSectionFromPath(pathname));
  const [shouldTransition, setShouldTransition] = useState(false);
  const [isNavigatingToDashboard, setIsNavigatingToDashboard] = useState(false);

  // State: Only current section open based on route
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const currentSection = getSectionFromPath(pathname);
    return {
      'account-details': currentSection === 'account-details',
      'requirements': currentSection === 'requirements',
      'trainings': currentSection === 'trainings',
      'services': currentSection === 'services',
      'additional-credentials': currentSection === 'additional-credentials',
    };
  });

  // Auto-expand current section and collapse others on route change
  useEffect(() => {
    const currentSection = getSectionFromPath(pathname);
    if (currentSection) {
      // Check if section actually changed
      const sectionChanged = previousSectionRef.current !== currentSection;

      if (sectionChanged) {
        // Enable transitions only when section changes
        setShouldTransition(true);
        previousSectionRef.current = currentSection;

        // Close all sections, open only current
        setOpenSections({
          'account-details': currentSection === 'account-details',
          'requirements': currentSection === 'requirements',
          'trainings': currentSection === 'trainings',
          'services': currentSection === 'services',
          'additional-credentials': currentSection === 'additional-credentials',
        });

        // Disable transitions after animation completes
        setTimeout(() => setShouldTransition(false), 500);
      }
    }
  }, [pathname]);

  // Manual toggle (no persistence - navigation controls state)
  const toggleSection = (sectionId: string) => {
    setShouldTransition(true);
    setOpenSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
    setTimeout(() => setShouldTransition(false), 500);
  };

  // Handle link click on mobile - close menu
  const handleLinkClick = () => {
    if (onClose) {
      onClose()
    }
  }

  // Handle dashboard navigation with loading state
  const handleDashboardClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only show loading if we're NOT already on the dashboard
    if (pathname !== '/dashboard/worker') {
      setIsNavigatingToDashboard(true)
    }
    handleLinkClick()
  }

  // Clear loading state when we arrive at dashboard
  useEffect(() => {
    if (pathname === '/dashboard/worker' && isNavigatingToDashboard) {
      // Small delay to ensure smooth transition
      setTimeout(() => {
        setIsNavigatingToDashboard(false)
      }, 300)
    }
  }, [pathname, isNavigatingToDashboard])

  // Get profile photo URL from database or use placeholder
  // Handle both prop type (photo) and WorkerProfile type (photos)
  const photoUrl = (profileData && 'photo' in profileData ? profileData.photo : profileData?.photos) || '/images/profilePlaceHolder.png'
  const displayName = profileData?.firstName || session?.user?.email?.split('@')[0] || 'Worker'
  // Get role from API's displayRole field (handles Therapeutic Supports subcategory names)
  const displayRole = profileDataFromHook?.displayRole || profileData?.role || 'Support Worker'

  return (
    <aside className={`dashboard-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
      {/* Logo - Only visible on mobile */}
      <div className="sidebar-logo-mobile">
        <Link href="/dashboard/worker" onClick={handleLinkClick}>
          <Image
            src="/logo/logo.svg"
            alt="Remonta"
            width={140}
            height={40}
            priority
            className="sidebar-logo-img"
          />
        </Link>
      </div>

      {/* Profile Section */}
      <div className="sidebar-profile-section">
        <div className="sidebar-profile-avatar">
          <Image
            src={photoUrl}
            alt={displayName}
            width={64}
            height={64}
            className="sidebar-profile-img"
            unoptimized={photoUrl?.includes('blob.vercel-storage.com')}
          />
        </div>
        <div className="sidebar-profile-info">
          <h4 className="sidebar-profile-name">{displayName}</h4>
          <p className="sidebar-profile-role">{displayRole}</p>
        </div>
      </div>

      {/* Edit Profile Link - Separate Section */}
      <div className="sidebar-edit-profile-section">
        <Link href="/dashboard/worker/profile-building" className="sidebar-edit-profile" onClick={handleLinkClick}>
          <PencilIcon className="sidebar-edit-icon" />
          <span>Edit profile</span>
        </Link>
        <Link href="/dashboard/worker/services/manage" className="sidebar-edit-profile" onClick={handleLinkClick} style={{ marginTop: '0.75rem' }}>
          <WrenchScrewdriverIcon className="sidebar-edit-icon" />
          <span>Edit services</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {/* Overview Section */}
        <div className="nav-section">
          <ul className="nav-list">
            <li>
              <Link
                href="/dashboard/worker"
                className={`nav-item ${pathname === '/dashboard/worker' ? 'active' : ''}`}
                onClick={handleDashboardClick}
              >
                <HomeIcon className="nav-icon" />
                <span>Dashboard</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Dropdown Sections */}
        {menuSections.map((section) => {
          const isOpen = openSections[section.id]
          const isSectionActive = section.items.some(item => pathname === item.href)
          const SectionIcon = section.icon

          return (
            <div key={section.id} className="nav-section">
              <button
                onClick={() => toggleSection(section.id)}
                className={`nav-dropdown-header ${isSectionActive ? 'active' : ''}`}
              >
                <div className="nav-dropdown-title">
                  <SectionIcon className="nav-dropdown-badge-icon" />
                  <span>{section.name}</span>
                </div>
                {isOpen ? (
                  <ChevronUpIcon className="nav-dropdown-icon" />
                ) : (
                  <ChevronDownIcon className="nav-dropdown-icon" />
                )}
              </button>

              <ul className={`nav-dropdown-list ${isOpen ? 'open' : 'closed'} ${!shouldTransition ? 'no-transition' : ''}`}>
                {section.items.map((item) => {
                  const isActive = pathname === item.href

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`nav-dropdown-item ${isActive ? 'active' : ''}`}
                        onClick={handleLinkClick}
                      >
                        <span className="nav-dropdown-bullet"></span>
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}

        {/* Account Button */}
        <div className="sidebar-account-section">
          <Link href="/dashboard/worker/account" className="sidebar-account-button" onClick={handleLinkClick}>
            <Cog6ToothIcon className="sidebar-account-icon" />
            <span>Account</span>
          </Link>
        </div>
      </nav>

      {/* Loading Overlay */}
      {isNavigatingToDashboard && (
        <div className="dashboard-loading-overlay">
          <div className="dashboard-loading-spinner">
            <div className="spinner"></div>
            <p className="loading-text">Loading Dashboard...</p>
          </div>
          <style jsx>{`
            .dashboard-loading-overlay {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.7);
              backdrop-filter: blur(4px);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 9999;
              animation: fadeIn 0.2s ease-in-out;
            }

            .dashboard-loading-spinner {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 1rem;
            }

            .spinner {
              width: 48px;
              height: 48px;
              border: 4px solid rgba(255, 255, 255, 0.2);
              border-top-color: #6366f1;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
            }

            .loading-text {
              color: white;
              font-family: 'Poppins', sans-serif;
              font-size: 1rem;
              font-weight: 500;
              margin: 0;
            }

            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }

            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
          `}</style>
        </div>
      )}
    </aside>
  )
}
