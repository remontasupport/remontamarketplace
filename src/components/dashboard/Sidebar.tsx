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
import { CheckCircleIcon } from '@heroicons/react/24/solid'
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
  }
}

export default function Sidebar({ isMobileOpen = false, onClose, profileData: profileDataProp }: SidebarProps = {}) {
  // Get session and profile data for setup progress
  const { data: session } = useSession()
  const { data: profileDataFromHook } = useWorkerProfile(session?.user?.id)

  // Use prop data if available, otherwise fall back to hook data
  const profileData = profileDataProp || profileDataFromHook

  // Parse setup progress to show checkmarks
  // Only access setupProgress if it exists (it's only on WorkerProfile, not the prop type)
  const setupProgress = useMemo(() => {
    if (!profileData) return parseSetupProgress(undefined)
    const progress = 'setupProgress' in profileData ? profileData.setupProgress : undefined
    return parseSetupProgress(progress)
  }, [profileData])

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
  const pathname = usePathname();
  const previousSectionRef = useRef<string | null>(getSectionFromPath(pathname));
  const [shouldTransition, setShouldTransition] = useState(false);

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

  // Get profile photo URL from database or use placeholder
  // Handle both prop type (photo) and WorkerProfile type (photos)
  const photoUrl = (profileData && 'photo' in profileData ? profileData.photo : profileData?.photos) || '/images/profilePlaceHolder.png'
  const displayName = profileData?.firstName || session?.user?.email?.split('@')[0] || 'Worker'

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
          />
        </div>
        <div className="sidebar-profile-info">
          <h4 className="sidebar-profile-name">{displayName}</h4>
          <p className="sidebar-profile-role">Support Worker</p>
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
                onClick={handleLinkClick}
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
                  {isSectionCompleted(section.id) && (
                    <CheckCircleIcon
                      className="nav-section-checkmark"
                      style={{
                        width: '18px',
                        height: '18px',
                        color: '#10B981',
                        marginLeft: '8px'
                      }}
                    />
                  )}
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
    </aside>
  )
}
