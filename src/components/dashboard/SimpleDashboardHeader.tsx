'use client'

import Link from 'next/link'
import Image from 'next/image'
import { signOut, useSession } from 'next-auth/react'
import { PhoneIcon } from '@heroicons/react/24/outline'

export default function SimpleDashboardHeader() {
  const { data: session } = useSession()

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' })
  }

  // Determine dashboard home based on user role
  const getDashboardHome = () => {
    if (!session?.user?.role) return '/dashboard/worker' // Default fallback

    const role = session.user.role.toLowerCase()
    return `/dashboard/${role}`
  }

  return (
    <header className="simple-dashboard-header">
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

      {/* Right Side Actions */}
      <div className="simple-header-actions">
        <a href="tel:1300134153" className="phone-number-link">
          <PhoneIcon className="phone-icon" />
          <span>1300 134 153</span>
        </a>
        <button onClick={handleLogout} className="logout-button">
          Log Out
        </button>
      </div>
    </header>
  )
}
