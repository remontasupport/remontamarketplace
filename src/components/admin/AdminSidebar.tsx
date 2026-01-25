'use client'

import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Users, UserCheck, HeadphonesIcon, FileText, LogOut, ClipboardCheck } from 'lucide-react'
import { Suspense } from 'react'

interface NavItem {
  label: string
  href: string
  tab: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    label: 'Contractors',
    href: '/admin/manage?tab=contractors',
    tab: 'contractors',
    icon: <Users className="w-5 h-5" />,
  },
  {
    label: 'Clients',
    href: '/admin/manage?tab=clients',
    tab: 'clients',
    icon: <UserCheck className="w-5 h-5" />,
  },
  {
    label: 'Support Coordinators',
    href: '/admin/manage?tab=support-coordinators',
    tab: 'support-coordinators',
    icon: <HeadphonesIcon className="w-5 h-5" />,
  },
  {
    label: 'Check Compliance',
    href: '/admin/manage?tab=check-compliance',
    tab: 'check-compliance',
    icon: <ClipboardCheck className="w-5 h-5" />,
  },
  {
    label: 'Generate Reports',
    href: '/admin/manage?tab=reports',
    tab: 'reports',
    icon: <FileText className="w-5 h-5" />,
  },
]

function SidebarContent() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const currentTab = searchParams.get('tab') || 'contractors'

  const isActive = (tab: string) => {
    // Check if on /admin/compliance/[id] route - only highlight Check Compliance tab
    if (pathname.startsWith('/admin/compliance/')) {
      return tab === 'check-compliance'
    }
    return currentTab === tab
  }

  return (
    <ul className="space-y-2">
      {navItems.map((item) => {
        const active = isActive(item.tab)
        return (
          <li key={item.tab}>
            <Link
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${active
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export default function AdminSidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0C1628] text-white flex flex-col z-40">
      {/* Logo / Header */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-semibold tracking-tight">Admin Dashboard</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <Suspense fallback={
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.tab}>
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300">
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </div>
              </li>
            ))}
          </ul>
        }>
          <SidebarContent />
        </Suspense>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-300 hover:bg-red-600/20 hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}
