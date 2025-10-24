'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  HomeIcon,
  InboxIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard/worker', icon: HomeIcon },
  { name: 'Inbox', href: '/dashboard/worker/inbox', icon: InboxIcon },
  { name: 'Lesson', href: '/dashboard/worker/lesson', icon: BookOpenIcon },
  { name: 'Task', href: '/dashboard/worker/task', icon: ClipboardDocumentListIcon },
  { name: 'Group', href: '/dashboard/worker/group', icon: UserGroupIcon },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="dashboard-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <span className="text-white text-xl">✦</span>
        </div>
        <span className="logo-text">REMONTA</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section">
          <h3 className="nav-section-title">OVERVIEW</h3>
          <ul className="nav-list">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon className="nav-icon" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Settings Section */}
        <div className="nav-section nav-section-bottom">
          <h3 className="nav-section-title">SETTINGS</h3>
          <ul className="nav-list">
            <li>
              <Link href="/dashboard/worker/settings" className="nav-item">
                <Cog6ToothIcon className="nav-icon" />
                <span>Settings</span>
              </Link>
            </li>
            <li>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="nav-item nav-item-logout"
              >
                <ArrowRightOnRectangleIcon className="nav-icon" />
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  )
}
