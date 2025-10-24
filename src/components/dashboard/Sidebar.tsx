'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserCircleIcon,
  HandRaisedIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { ACCOUNT_SETUP_STEPS, getStepUrl } from '@/config/accountSetupSteps'

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

const menuSections: MenuSection[] = [
  {
    id: 'account-details',
    name: 'Account details',
    icon: UserCircleIcon,
    items: accountDetailsItems
  },
  {
    id: 'services',
    name: 'Your services',
    icon: HandRaisedIcon,
    items: [
      { name: 'Services you offer', href: '/dashboard/worker/services/offer' },
      { name: 'Additional training', href: '/dashboard/worker/services/training' }
    ]
  },
  {
    id: 'mandatory-training',
    name: 'Mandatory training',
    icon: DocumentTextIcon,
    items: [
      { name: 'Infection control training', href: '/dashboard/worker/training/infection-control' },
      { name: 'Professional responsibility training', href: '/dashboard/worker/training/professional-responsibility' }
    ]
  }
]

export default function Sidebar() {
  const pathname = usePathname()
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'account-details': false,
    'services': false,
    'mandatory-training': false
  })

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  return (
    <aside className="dashboard-sidebar">
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

              {isOpen && (
                <ul className="nav-dropdown-list">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`nav-dropdown-item ${isActive ? 'active' : ''}`}
                        >
                          <span className="nav-dropdown-bullet"></span>
                          <span>{item.name}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
