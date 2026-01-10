'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { signOut, useSession } from 'next-auth/react'
import { PhoneIcon, Bars3Icon } from '@heroicons/react/24/outline'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface SimpleDashboardHeaderProps {
  onMenuToggle?: () => void
}

export default function SimpleDashboardHeader({ onMenuToggle }: SimpleDashboardHeaderProps) {
  const { data: session } = useSession()
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  const handleLogoutClick = () => {
    setLogoutDialogOpen(true)
  }

  const confirmLogout = () => {
    signOut({ callbackUrl: '/login' })
  }

  // Determine dashboard home based on user role
  const getDashboardHome = () => {
    if (!session?.user?.role) return '/dashboard/worker' // Default fallback

    const role = session.user.role.toLowerCase()
    return `/dashboard/${role}`
  }

  return (
    <>
      <ConfirmDialog
        isOpen={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        onConfirm={confirmLogout}
        title="Log Out"
        message="Are you sure you want to log out?"
        confirmText="Yes"
        cancelText="No"
      />

      <header className="simple-dashboard-header">
        {/* Left Side - Burger Menu + Logo */}
        <div className="simple-header-left">
          {/* Burger Menu - Only visible on mobile */}
          <button
            className="burger-menu-button"
            onClick={onMenuToggle}
            aria-label="Toggle menu"
          >
            <Bars3Icon className="burger-icon" />
          </button>

          {/* Logo */}
          <div className="simple-header-logo">
            <Link href={getDashboardHome()}>
              <Image
                src="/logo/logo.svg"
                alt="Remonta"
                width={140}
                height={40}
                priority
                className="header-logo-img"
              />
            </Link>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="simple-header-actions">
          <a href="tel:1300134153" className="phone-number-link">
            <PhoneIcon className="phone-icon" />
            <span>1300 134 153</span>
          </a>
          <button onClick={handleLogoutClick} className="logout-button">
            Log Out
          </button>
        </div>
      </header>
    </>
  )
}
