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
  AcademicCapIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { ACCOUNT_SETUP_STEPS, getStepUrl } from '@/config/accountSetupSteps'
import { SERVICES_SETUP_STEPS, getServicesStepUrl } from '@/config/servicesSetupSteps'
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

// Dynamically generate services items from centralized config
const servicesItems = SERVICES_SETUP_STEPS.map(step => ({
  name: step.title,
  href: getServicesStepUrl(step.slug)
}))

interface SidebarProps {
  isMobileOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ isMobileOpen = false, onClose }: SidebarProps = {}) {
  // Get session and profile data for setup progress
  const { data: session } = useSession()
  const { data: profileData } = useWorkerProfile(session?.user?.id)

  // Parse setup progress to show checkmarks
  const setupProgress = useMemo(() => {
    return parseSetupProgress(profileData?.setupProgress)
  }, [profileData?.setupProgress])

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

      {/* Navigation */}
      <nav className="sidebar-nav">
        {/* Overview Section */}
        <div className="nav-section">
          <h3 className="nav-section-title">OVERVIEW</h3>
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
      </nav>
    </aside>
  )
}
