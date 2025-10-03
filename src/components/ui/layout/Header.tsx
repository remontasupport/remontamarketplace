'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDownIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

interface NavigationItem {
  name: string
  href: string
  hasDropdown: boolean
  dropdownItems?: Array<{
    name: string
    href: string
    description?: string
  }>
}

const navigation: NavigationItem[] = [
  {
    name: 'Find support',
    href: '/registration/client',
    hasDropdown: false
  },
  {
    name: 'Become a support worker',
    href: '/registration/worker',
    hasDropdown: false
  },
  {
    name: 'Services',
    href: '#services',
    hasDropdown: false
  },
  // {
  //   name: 'More',
  //   href: '#',
  //   hasDropdown: true,
  //   dropdownItems: [
  //     { name: 'About Us', href: '/about' },
  //     { name: 'How It Works', href: '/how-it-works' },
  //     { name: 'Contact', href: '/contact' },
  //     { name: 'Help Center', href: '/help' },
  //     { name: 'Pricing', href: '/pricing' },
  //   ]
  // },
]

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
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

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 0)
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <header className={`sticky top-0 z-40 transition-colors duration-300 ${isScrolled ? 'bg-[#0C1628]' : 'bg-white'}`} ref={headerRef}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Global">
        {/* Logo */}
        <div className="flex lg:flex-1 relative -left-2 lg:-left-0 lg:py-0">
          <Link href="/" className="-m-1">
           
            <div className="flex flex-col items-center relative left-2 lg:left-1 ">
              <Image
                className="h-25 w-35 lg:w-45 sm:h-2 md:h-15 lg:h-34"
                src={isScrolled ? "/logo/logo-dark.svg" : "/logo/logo.svg"}
                alt="Remonta"
                width={15}
                height={15}
                priority
              />
              {/* <span className={`ml-5 lg:ml-9 text-xs mt-0.5 italic transition-colors duration-300 ${isScrolled ? 'text-gray-300' : 'text-gray-500'}`}>
                previously Remonta
              </span> */}
            </div>
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
            <Bars3Icon className={`h-8 w-8 md:h-10 md:w-10 transition-colors duration-300 ${isScrolled ? 'text-white' : 'text-[#0C1628]'}`} aria-hidden="true" />
          </button>
        </div>

        {/* Desktop navigation */}
        <div className="hidden lg:flex lg:gap-x-8">
          {navigation.map((item) => (
            <div key={item.name} className="relative">
              {item.hasDropdown ? (
                <button
                  disabled
                  className={`flex items-center gap-x-1 font-sans font-medium text-base leading-6 transition-colors duration-300 ${isScrolled ? 'text-white hover:text-[#B1C3CD]' : 'text-[#0C1628] hover:text-[#B1C3CD]'}`}
                  onClick={() => setOpenDropdown(openDropdown === item.name ? null : item.name)}
                >
                  {item.name}
                  <ChevronDownIcon className="h-4 w-4 flex-none text-gray-400" aria-hidden="true" />
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={`font-sans font-medium text-base leading-6 transition-colors duration-300 ${isScrolled ? 'text-white hover:text-[#B1C3CD]' : 'text-[#0C1628] hover:text-[#B1C3CD]'}`}
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
                            {/* <p className="font-sans text-sm text-gray-600 leading-relaxed">
                              {dropdownItem.description}
                            </p> */}
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
          {/* <Link
            
            href="/" // "/login"
            className={`flex items-center justify-center font-sans font-medium text-sm leading-6 transition-colors duration-300 rounded-full px-6 py-2 border ${isScrolled ? 'bg-white text-[#0C1628] border-[#B1C3CD] hover:bg-white hover:text-[#0C1628]' : 'text-[#0C1628] hover:bg-white hover:text-[#0C1628]'}`}
          >
            Log in
          </Link> */}
          <div className="relative">
            <Link
              href="/contact"
              className={`flex items-center justify-center gap-x-1 rounded-full px-6 py-2 font-poppins font-medium text-xl transition-colors duration-300 ${isScrolled ? 'bg-[#B1C3CD] text-[#0C1628] hover:bg-[#B1C3CD] hover:text-[#0C1628]' : 'bg-[#0C1628] hover:text-[#0C1628] text-white hover:bg-[#B1C3CD]'}`}
            >
              Contact Us
            </Link>

            {/* <button
              
              className={`flex items-center justify-center gap-x-1 rounded-full px-6 py-2 font-sans font-medium text-sm transition-colors duration-300 ${isScrolled ? 'bg-[#B1C3CD] text-[#0C1628] hover:bg-[#B1C3CD] hover:text-[#0C1628]' : 'bg-[#0C1628] hover:text-[#0C1628] text-white hover:bg-[#B1C3CD]'}`}
              onClick={() => setOpenDropdown(openDropdown === 'get-started' ? null : 'get-started')}
            >
              Contact Us
              <ChevronDownIcon className="h-4 w-4 flex-none text-white" aria-hidden="true" />
            </button> */}

            {/* Get started dropdown */}
            {/* {openDropdown === 'get-started' && (
              <div
                className="absolute left-0 z-10 mt-3 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5"
              >
                <div className="py-1">
                  <Link
                    href="/register/client"
                    className="block px-4 py-2 text-sm font-sans font-medium text-[#0C1628] hover:bg-[#B1C3CD] transition ease-in-out duration-150"
                  >
                    I need support
                  </Link>
                  <Link
                    href="/registration/worker"
                    className="block px-4 py-2 text-sm font-sans font-medium text-[#0C1628] hover:bg-[#B1C3CD] transition ease-in-out duration-150"
                  >
                    I want to provide support
                  </Link>
                </div>
              </div>
            )} */}
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-50 bg-black bg-opacity-25" onClick={() => !isNavigating && setMobileMenuOpen(false)} />
          <div className={`fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-4 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10 ${isNavigating ? 'hidden' : ''}`}>
            <div className="flex items-center justify-between">
              <Link href="/" className="-m-1.5 p-1.5" onClick={() => setMobileMenuOpen(false)}>
                
                <div className="flex flex-col items-center">
                  <Image
                    className="h-30 w-35 sm:h-35"
                    src="/logo/logo.svg"
                    alt="Remonta"
                    width={120}
                    height={40}
                  />
                  {/* <span className="text-xs mt-0.5 italic text-gray-500">
                    previously Remonta
                  </span> */}
                </div>
              </Link>
              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 text-[#0C1628]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon className="h-8 w-8 md:h-10 md:w-10" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  {navigation.map((item) => (
                    <div key={item.name}>
                      {item.hasDropdown ? (
                        <button
                          className="flex w-full items-center justify-between rounded-lg py-2 pl-3 pr-3.5 text-lg font-sans font-medium leading-7 text-[#0C1628] hover:bg-[#F8E8D8]"
                          onClick={() => setOpenDropdown(openDropdown === item.name ? null : item.name)}
                        >
                          {item.name}
                          <ChevronDownIcon
                            className={`h-5 w-5 flex-none transform transition-transform ${openDropdown === item.name ? 'rotate-180' : ''
                              }`}
                            aria-hidden="true"
                          />
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          className="flex w-full items-center justify-between rounded-lg py-2 pl-3 pr-3.5 text-lg font-sans font-medium leading-7 text-[#0C1628] hover:bg-[#F8E8D8]"
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
                {/* <div className="py-6 space-y-4">
                  <Link
                    href="/login"
                    className="block rounded-full px-3 py-2.5 text-base font-sans font-medium leading-7 text-[#0C1628] hover:bg-[#F8E8D8] border border-[#0C1628] text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <div className="space-y-2">
                    <Link
                      href="/register/client"
                      className="block rounded-full px-3 py-2.5 text-base font-sans font-medium leading-7 text-white bg-[#0C1628] hover:bg-[#B1C3CD] text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      I need support
                    </Link>
                    <Link
                      href="/registration/worker"
                      className="block rounded-full px-3 py-2.5 text-base font-sans font-medium leading-7 text-[#0C1628] border border-[#0C1628] hover:bg-[#F8E8D8] text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      I want to provide support
                    </Link>
                  </div>
                </div> */}


                <div className="relative py-6">
                  <Link
                    href="/contact"
                    className={`flex items-center justify-center gap-x-1 rounded-full px-6 py-2 font-poppins font-medium text-xl transition-colors duration-300 ${isScrolled ? 'bg-[#B1C3CD] text-[#0C1628] hover:bg-[#B1C3CD] hover:text-[#0C1628]' : 'bg-[#0C1628] hover:text-[#0C1628] text-white hover:bg-[#B1C3CD]'}`}
                    onClick={(e) => {
                      e.preventDefault()
                      setIsNavigating(true)
                      setTimeout(() => {
                        setMobileMenuOpen(false)
                        window.location.href = '/contact'
                      }, 500)
                    }}
                  >
                    Contact Us
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Loading Overlay */}
          {isNavigating && (
            <div className="fixed inset-0 z-[60] bg-white flex items-center justify-center">
              <svg className="animate-spin h-12 w-12 text-[#0C1628]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </div>
      )}
    </header>
  )
}