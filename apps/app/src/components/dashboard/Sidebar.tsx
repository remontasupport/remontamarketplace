'use client'

// The worker sidebar (U2 H5, R8.5): renders WORKER_MENU (features/navigation/workerMenu.ts)
// on the desktop and in the mobile drawer, and holds no item of its own. Everything it shows
// comes from the one profile read (features/worker/profile.ts): the name and photo, the Edit
// Profile children with their done state, the badge, and the requirement and service groups.
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  AcademicCapIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardDocumentCheckIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  HandRaisedIcon,
  HomeIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'
import { generateServicesSetupSteps, getServicesStepUrl } from '@/config/servicesSetupSteps'
import { generateComplianceSteps, getComplianceStepUrl } from '@/utils/dynamicComplianceSteps'
import { generateTrainingSteps, getTrainingStepUrl } from '@/utils/dynamicTrainingSteps'
import type { WorkerRequirements } from '@/hooks/queries/useWorkerRequirements'
import {
  editProfileBadge,
  editProfileChildren,
  groupOfPath,
  requirementsForSteps,
  serviceNamesOf,
  servicesChildren,
  WORKER_MENU,
  type ChildrenSource,
  type MenuIcon,
  type MenuLink,
} from '@/features/navigation/workerMenu'
import { useWorkerProfile } from '@/features/worker/profile'

const ICONS: Record<MenuIcon, React.ComponentType<{ className?: string }>> = {
  dashboard: HomeIcon,
  editProfile: PencilIcon,
  mandatory: ClipboardDocumentCheckIcon,
  trainings: AcademicCapIcon,
  myServices: HandRaisedIcon,
  credentials: DocumentTextIcon,
  jobs: BriefcaseIcon,
  account: Cog6ToothIcon,
}

function ChildLink({ link, active, onNavigate }: { link: MenuLink; active: boolean; onNavigate: () => void }) {
  return (
    <Link href={link.href} className={`nav-dropdown-item ${active ? 'active' : ''}`} onClick={onNavigate}>
      {link.done ? <CheckCircleIcon className="w-3.5 h-3.5 text-green-600 shrink-0" aria-label="Done" /> : <span className="nav-dropdown-bullet" />}
      <span>{link.label}</span>
    </Link>
  )
}

/** A sub-group inside a group (My Profile's three, Services' Modify Services): open while one of its pages is showing (a service step's `?step=` aside). */
function SubGroup({ link, pathname, onNavigate }: { link: MenuLink; pathname: string; onNavigate: () => void }) {
  const inside = link.children!.some((c) => c.href.split('?')[0] === pathname)
  const [open, setOpen] = useState(inside)
  useEffect(() => {
    if (inside) setOpen(true)
  }, [inside])
  return (
    <li>
      <button type="button" onClick={() => setOpen((o) => !o)} className={`nav-dropdown-item w-full ${inside ? 'active' : ''}`} aria-expanded={open}>
        {link.done ? <CheckCircleIcon className="w-3.5 h-3.5 text-green-600 shrink-0" aria-label="Done" /> : <span className="nav-dropdown-bullet" />}
        <span className="flex-1 text-left">{link.label}</span>
        {open ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
      </button>
      {open && (
        <ul className="pl-4">
          {link.children!.map((c) => (
            <li key={c.href}>
              <ChildLink link={c} active={pathname === c.href} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

interface SidebarProps {
  isMobileOpen?: boolean
  onClose?: () => void
  /** A page's own name and photo, shown until the profile read answers. */
  profileData?: {
    firstName: string
    photo: string | null
    role?: string
  }
}

export default function Sidebar({ isMobileOpen = false, onClose, profileData }: SidebarProps = {}) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { profile, isLoading } = useWorkerProfile()

  // R8.2-R8.4: every group's children from the one read; null while it loads (a skeleton).
  const children = useMemo<Record<ChildrenSource, MenuLink[] | null>>(() => {
    if (isLoading && !profile) return { editProfile: editProfileChildren(undefined), services: servicesChildren([]), mandatory: null, trainings: null }
    const reqs = requirementsForSteps(profile) as unknown as WorkerRequirements | undefined
    const names = serviceNamesOf(profile)
    return {
      editProfile: editProfileChildren(profile),
      mandatory: generateComplianceSteps(reqs).map((s) => ({ id: s.slug, label: s.title, href: getComplianceStepUrl(s.slug) })),
      trainings: generateTrainingSteps(reqs).map((s) => ({ id: s.slug, label: s.title, href: getTrainingStepUrl(s.slug) })),
      services: servicesChildren((names.length ? generateServicesSetupSteps(names) : []).map((s) => ({ id: s.slug, label: s.title, href: getServicesStepUrl(s.slug) })), profile),
    }
  }, [profile, isLoading])
  const badge = editProfileBadge(profile)

  // Only the current route's group is open; a route change opens its own group.
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const g = groupOfPath(pathname)
    return g ? { [g]: true } : {}
  })
  const [animate, setAnimate] = useState(false)
  useEffect(() => {
    const g = groupOfPath(pathname)
    if (g) setOpen({ [g]: true })
  }, [pathname])
  const toggle = (id: string) => {
    setAnimate(true)
    setOpen((o) => ({ ...o, [id]: !o[id] }))
    setTimeout(() => setAnimate(false), 500)
  }

  const [toDashboard, setToDashboard] = useState(false)
  useEffect(() => {
    if (pathname === '/dashboard/worker' && toDashboard) {
      const t = setTimeout(() => setToDashboard(false), 300)
      return () => clearTimeout(t)
    }
  }, [pathname, toDashboard])

  const close = () => onClose?.()
  const photoUrl = profile?.photos.main || profileData?.photo || '/images/profilePlaceHolder.png'
  const displayName = profile?.names.firstName || profileData?.firstName || session?.user?.email?.split('@')[0] || 'Worker'
  const displayRole = profile?.displayRole || profileData?.role || 'Support Worker'

  return (
    <aside className={`dashboard-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-logo-mobile">
        <Link href="/dashboard/worker" onClick={close}>
          <Image src="/logo/logo.svg" alt="Remonta" width={140} height={40} priority className="sidebar-logo-img" />
        </Link>
      </div>

      <div className="sidebar-profile-section">
        <div className="sidebar-profile-avatar">
          {/* A staged photo sits on the bucket, outside next/image's domains: remote photos are not optimised. */}
          <Image src={photoUrl} alt={displayName} width={64} height={64} className="sidebar-profile-img" unoptimized={!photoUrl.startsWith('/')} />
        </div>
        <div className="sidebar-profile-info">
          <h4 className="sidebar-profile-name">{displayName}</h4>
          <p className="sidebar-profile-role">{displayRole}</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {WORKER_MENU.map((item) => {
          const Icon = ICONS[item.icon]
          if (item.href) {
            const active = pathname === item.href
            return (
              <div key={item.id} className="nav-section">
                <ul className="nav-list">
                  <li>
                    <Link
                      href={item.href}
                      className={`nav-item ${active ? 'active' : ''}`}
                      onClick={() => {
                        if (item.id === 'dashboard' && pathname !== '/dashboard/worker') setToDashboard(true)
                        close()
                      }}
                    >
                      <Icon className="nav-icon" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                </ul>
              </div>
            )
          }
          const links = item.children ? children[item.children] : []
          const isOpen = !!open[item.id]
          const active = links?.some((l) => pathname === l.href || !!l.children?.some((c) => pathname === c.href)) ?? false
          const isEditProfile = item.children === 'editProfile'
          return (
            <div key={item.id} className="nav-section">
              <button type="button" onClick={() => toggle(item.id)} className={`nav-dropdown-header ${active ? 'active' : ''}`} aria-expanded={isOpen}>
                <div className="nav-dropdown-title">
                  <Icon className="nav-dropdown-badge-icon" />
                  <span>{item.label}</span>
                  {isEditProfile && badge.percent !== null && <span className="sidebar-edit-profile__badge">{badge.percent}%</span>}
                  {item.children === 'services' && badge.unplaced && <span className="ml-1 inline-block w-2 h-2 rounded-full bg-orange-500" title="Set your service area so clients can find you" aria-label="Service area not set" />}
                </div>
                {isOpen ? <ChevronUpIcon className="nav-dropdown-icon" /> : <ChevronDownIcon className="nav-dropdown-icon" />}
              </button>
              <ul className={`nav-dropdown-list ${isOpen ? 'open' : 'closed'} ${animate ? '' : 'no-transition'}`}>
                {links === null
                  ? Array.from({ length: 6 }, (_, i) => (
                      <li key={i} className="nav-dropdown-item pointer-events-none">
                        <span className="nav-dropdown-bullet opacity-30" />
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                      </li>
                    ))
                  : links.map((l) =>
                      l.children ? (
                        <SubGroup key={l.id} link={l} pathname={pathname} onNavigate={close} />
                      ) : (
                        <li key={l.href}>
                          <ChildLink link={l} active={pathname === l.href} onNavigate={close} />
                        </li>
                      ),
                    )}
              </ul>
            </div>
          )
        })}
      </nav>

      {toDashboard && (
        <div className="dashboard-loading-overlay">
          <div className="dashboard-loading-spinner">
            <div className="spinner"></div>
            <p className="loading-text">Loading Dashboard...</p>
          </div>
          <style jsx>{`
            .dashboard-loading-overlay {
              position: fixed;
              inset: 0;
              background: rgba(0, 0, 0, 0.7);
              backdrop-filter: blur(4px);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 9999;
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
          `}</style>
        </div>
      )}
    </aside>
  )
}
