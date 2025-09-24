'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDownIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

const navigation = [
  {
    name: 'Find support',
    href: '/find-support',
    hasDropdown: true,
    dropdownItems: [
      {
        name: 'NDIS Provider Staffing Solutions',
        description: 'Get direct access to a network of 13,000+ pre-vetted, screened, and trained workers.',
        href: '/find-support/browse'
      },
      {
        name: 'NDIS Support Coordination Platform',
        description: 'Find the right workers for your participant\'s goals, easily and safely.',
        href: '/find-support/emergency'
      },
      {
        name: 'Home Care Providers & Coordinators',
        description: 'Build your workforce from a national network of 13,000+ employed and skilled workers.',
        href: '/find-support/plan-management'
      },
    ]
  },
  {
    name: 'Become a support worker',
    href: '/become-support-worker',
    hasDropdown: true,
    dropdownItems: [
      {
        name: 'Apply Now',
        description: 'Join our network of qualified support workers and start making a difference.',
        href: '/become-support-worker/apply'
      },
      {
        name: 'Requirements',
        description: 'Learn about the qualifications and requirements to become a support worker.',
        href: '/become-support-worker/requirements'
      },
      {
        name: 'Training Resources',
        description: 'Access comprehensive training materials and professional development.',
        href: '/become-support-worker/training'
      },
    ]
  },
  {
    name: 'Coordinators and providers',
    href: '/coordinators-providers',
    hasDropdown: true,
    dropdownItems: [
      {
        name: 'Partner with Us',
        description: 'Join our network of trusted providers and coordinators.',
        href: '/coordinators-providers/partner'
      },
      {
        name: 'Provider Portal',
        description: 'Access your dedicated portal for managing participants and workers.',
        href: '/coordinators-providers/portal'
      },
      {
        name: 'Resources',
        description: 'Tools and resources to help you deliver quality support services.',
        href: '/coordinators-providers/resources'
      },
    ]
  },
  { name: 'Pricing', href: '/pricing', hasDropdown: false },
  // {
  //   name: 'More',
  //   href: '#',
  //   hasDropdown: true,
  //   dropdownItems: [
  //     { name: 'About Us', href: '/about' },
  //     { name: 'How It Works', href: '/how-it-works' },
  //     { name: 'Contact', href: '/contact' },
  //     { name: 'Help Center', href: '/help' },
  //   ]
  // },
]

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <header className="bg-white shadow-sm" ref={headerRef}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6  lg:px-8" aria-label="Global">
        {/* Logo */}
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">Remonta</span>
            <Image
              className="h-16 w-auto sm:h-32 lg:h-32"
              src="/logo/logo.svg"
              alt="Remonta"
              width={1000}
              height={20}
              priority
            />
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-[#0C1628]"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Desktop navigation */}
        <div className="hidden lg:flex lg:gap-x-8">
          {navigation.map((item) => (
            <div key={item.name} className="relative">
              {item.hasDropdown ? (
                <button
                  className="flex items-center gap-x-1 font-sans font-medium text-sm leading-6 text-[#0C1628] hover:text-[#B1C3CD] transition-colors"
                  onClick={() => setOpenDropdown(openDropdown === item.name ? null : item.name)}
                >
                  {item.name}
                  <ChevronDownIcon className="h-4 w-4 flex-none text-gray-400" aria-hidden="true" />
                </button>
              ) : (
                <Link
                  href={item.href}
                  className="font-sans font-medium text-sm leading-6 text-[#0C1628] hover:text-[#B1C3CD] transition-colors"
                >
                  {item.name}
                </Link>
              )}

              {/* Dropdown menu */}
              {item.hasDropdown && openDropdown === item.name && (
                <div className="absolute left-1/2 z-10 mt-3 w-screen max-w-lg -translate-x-1/2 transform px-2 sm:px-0">
                  <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                    <div className="relative bg-white">
                      {item.dropdownItems?.map((dropdownItem) => (
                        <Link
                          key={dropdownItem.name}
                          href={dropdownItem.href}
                          className="block p-6 hover:bg-[#B1C3CD] transition ease-in-out duration-150 border-b border-gray-100 last:border-b-0"
                          onClick={() => setOpenDropdown(null)}
                        >
                          <div>
                            <h3 className="font-sans font-semibold text-base text-[#0C1628] mb-2">
                              {dropdownItem.name}
                            </h3>
                            <p className="font-sans text-sm text-gray-600 leading-relaxed">
                              {dropdownItem.description}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right side buttons */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
          <Link
            href="/login"
            className="flex items-center justify-center font-sans font-medium text-sm leading-6 text-[#0C1628] hover:text-[#B1C3CD] transition-colors border border-[#0C1628] rounded-full px-6 py-2 hover:border-[#B1C3CD]"
          >
            Log in
          </Link>
          <div className="relative">
            <button
              className="flex items-center justify-center gap-x-1 rounded-full bg-[#0C1628] px-6 py-2 font-sans font-medium text-sm text-white hover:bg-[#B1C3CD] transition-colors"
              onMouseEnter={() => setOpenDropdown('get-started')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              Get started
              <ChevronDownIcon className="h-4 w-4 flex-none text-white" aria-hidden="true" />
            </button>

            {/* Get started dropdown */}
            {openDropdown === 'get-started' && (
              <div
                className="absolute right-0 z-10 mt-3 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5"
                onMouseEnter={() => setOpenDropdown('get-started')}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <div className="py-1">
                  <Link
                    href="/register/client"
                    className="block px-4 py-2 text-sm font-sans font-medium text-[#0C1628] hover:bg-[#F8E8D8]"
                  >
                    I need support
                  </Link>
                  <Link
                    href="/register/support-worker"
                    className="block px-4 py-2 text-sm font-sans font-medium text-[#0C1628] hover:bg-[#F8E8D8]"
                  >
                    I want to provide support
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-50 bg-black bg-opacity-25" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between">
              <Link href="/" className="-m-1.5 p-1.5" onClick={() => setMobileMenuOpen(false)}>
                <span className="sr-only">Remonta</span>
                <Image
                  className="h-32 w-auto"
                  src="/logo/logo.svg"
                  alt="Remonta"
                  width={180}
                  height={180}
                />
              </Link>
              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 text-[#0C1628]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  {navigation.map((item) => (
                    <div key={item.name}>
                      {item.hasDropdown ? (
                        <button
                          className="flex w-full items-center justify-between rounded-lg py-2 pl-3 pr-3.5 text-base font-sans font-medium leading-7 text-[#0C1628] hover:bg-[#F8E8D8]"
                          onClick={() => setOpenDropdown(openDropdown === item.name ? null : item.name)}
                        >
                          {item.name}
                          <ChevronDownIcon
                            className={`h-5 w-5 flex-none transform transition-transform ${
                              openDropdown === item.name ? 'rotate-180' : ''
                            }`}
                            aria-hidden="true"
                          />
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          className="-mx-3 block rounded-lg px-3 py-2 text-base font-sans font-medium leading-7 text-[#0C1628] hover:bg-[#F8E8D8]"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.name}
                        </Link>
                      )}

                      {/* Mobile dropdown items */}
                      {item.hasDropdown && openDropdown === item.name && (
                        <div className="mt-2 space-y-2 pl-6">
                          {item.dropdownItems?.map((dropdownItem) => (
                            <Link
                              key={dropdownItem.name}
                              href={dropdownItem.href}
                              className="block rounded-lg py-2 pl-3 pr-3.5 text-sm font-sans text-[#0C1628] hover:bg-[#F8E8D8]"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              {dropdownItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="py-6 space-y-4">
                  <Link
                    href="/login"
                    className="block rounded-lg px-3 py-2.5 text-base font-sans font-medium leading-7 text-[#0C1628] hover:bg-[#F8E8D8] border border-[#0C1628] text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <div className="space-y-2">
                    <Link
                      href="/register/client"
                      className="block rounded-lg px-3 py-2.5 text-base font-sans font-medium leading-7 text-white bg-[#0C1628] hover:bg-[#B1C3CD] text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      I need support
                    </Link>
                    <Link
                      href="/register/support-worker"
                      className="block rounded-lg px-3 py-2.5 text-base font-sans font-medium leading-7 text-[#0C1628] border border-[#0C1628] hover:bg-[#F8E8D8] text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      I want to provide support
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}