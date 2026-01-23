'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  HomeIcon,
  UsersIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  HeartIcon,
} from '@heroicons/react/24/outline'

interface MenuItem {
  id: string
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    href: '/dashboard/client',
    icon: HomeIcon,
  },
  {
    id: 'participants',
    name: 'Participants',
    href: '/dashboard/client/participants',
    icon: UsersIcon,
  },
  {
    id: 'bookings',
    name: 'Bookings',
    href: '/dashboard/client/bookings',
    icon: CalendarDaysIcon,
  },
  {
    id: 'messages',
    name: 'Messages',
    href: '/dashboard/client/messages',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    id: 'favorites',
    name: 'Favorites',
    href: '/dashboard/client/favorites',
    icon: HeartIcon,
  },
]

interface ClientSidebarProps {
  isMobileOpen?: boolean
  onClose?: () => void
  profileData?: {
    firstName: string
    photo: string | null
  }
}

export default function ClientSidebar({
  isMobileOpen = false,
  onClose,
  profileData
}: ClientSidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isNavigating, setIsNavigating] = useState(false)

  // Get profile photo URL or use placeholder
  const photoUrl = profileData?.photo || '/images/profilePlaceHolder.png'
  const displayName = profileData?.firstName || session?.user?.email?.split('@')[0] || 'User'

  // Handle link click on mobile - close menu
  const handleLinkClick = () => {
    if (onClose) {
      onClose()
    }
  }

  // Handle navigation with loading state
  const handleNavClick = (href: string) => {
    if (pathname !== href) {
      setIsNavigating(true)
    }
    handleLinkClick()
  }

  // Clear loading state when navigation completes
  useEffect(() => {
    if (isNavigating) {
      setTimeout(() => {
        setIsNavigating(false)
      }, 300)
    }
  }, [pathname, isNavigating])

  return (
    <aside className={`dashboard-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
      {/* Logo - Only visible on mobile */}
      <div className="sidebar-logo-mobile">
        <Link href="/dashboard/client" onClick={handleLinkClick}>
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
          <p className="sidebar-profile-role">Client</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section">
          <ul className="nav-list">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              const ItemIcon = item.icon

              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.href)}
                  >
                    <ItemIcon className="nav-icon" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Account Button */}
        <div className="sidebar-account-section">
          <Link
            href="/dashboard/client/account"
            className="sidebar-account-button"
            onClick={handleLinkClick}
          >
            <Cog6ToothIcon className="sidebar-account-icon" />
            <span>Account</span>
          </Link>
        </div>
      </nav>

      {/* Loading Overlay */}
      {isNavigating && (
        <div className="dashboard-loading-overlay">
          <div className="dashboard-loading-spinner">
            <div className="spinner"></div>
            <p className="loading-text">Loading...</p>
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
