'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
    name: 'Become a NDIS worker',
    href: '/registration/worker',
    hasDropdown: false
  },
  {
    name: 'Services',
    href: '/services',
    hasDropdown: false
  },
  {
    name: 'More',
    href: '#',
    hasDropdown: true,
    dropdownItems: [
      { name: 'Help Centre', href: '/help', description: 'Find helpful articles, guides and answers to common queries.' },
      { name: 'Incidents', href: '/incidents', description: 'Report an incident on Remonta.' },
      { name: 'FAQs', href: '/faqs', description: 'Find the answers to frequently asked questions about Remonta.' },
      { name: 'Trust and Safety', href: '/trust-safety', description: 'Explore how Remonta ensures the safety and wellbeing of our community.' },
      { name: 'Newsroom', href: '/newsroom', description: 'Find news, helpful tips and insightful stories from the Remonta community.' },
      { name: 'Topic Libraries', href: '/topic-libraries', description: 'Browse guides to home care packages, the NDIS, becoming a support worker on Remonta and more.' },
      { name: 'Shop consumables', href: '/shop', description: 'Discover an affordable and convenient way to shop for your everyday support needs.' },
      { name: 'Our story', href: '/about', description: 'Learn more about Remonta and how the company got started.' },
      { name: 'Leadership', href: '/leadership', description: 'Meet the leadership team behind Remonta.' },
      { name: 'Careers at Remonta', href: '/careers', description: 'Check open job listings at Remonta.' },
      { name: 'Contact us', href: '/contact', description: 'Get in touch with us via live chat, phone or email.' },
    ]
  },
]

export default function Header() {
  const router = useRouter()
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

  useEffect(() => {
    // Close menu when navigation is complete
    if (isNavigating) {
      const handleRouteChange = () => {
        setMobileMenuOpen(false)
        setIsNavigating(false)
      }

      // Listen for route change completion
      window.addEventListener('load', handleRouteChange)

      return () => {
        window.removeEventListener('load', handleRouteChange)
      }
    }
  }, [isNavigating])

  // Reusable function to handle mobile menu navigation
  const handleMobileNavigation = (href: string) => {
    setIsNavigating(true)
    window.location.href = href
  }

  return (
    <header className={`sticky top-0 z-[100] transition-colors duration-300 ${isScrolled ? 'bg-[#0C1628]' : 'bg-white'}`} ref={headerRef}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 " aria-label="Global">
        {/* Logo */}
        <div className="flex lg:flex-1 relative -left-2 lg:-left-0 lg:py-0">
          <Link
            href="/"
            className="-m-1"
            onClick={() => {
              // Close dropdown after a brief delay to allow navigation to start
              setTimeout(() => setOpenDropdown(null), 100);
            }}
          >

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
                  onClick={() => {
                    // Close dropdown after a brief delay to allow navigation to start
                    setTimeout(() => setOpenDropdown(null), 100);
                  }}
                >
                  {item.name}
                </Link>
              )}

              {/* Dropdown menu */}
              {item.hasDropdown && openDropdown === item.name && (
                <>
                  {/* Semi-transparent backdrop overlay - below header */}
                  <div
                    className="fixed left-0 right-0 bottom-0 top-[127px] bg-gray-600/60 z-[90] transition-all duration-300"
                    onClick={() => setOpenDropdown(null)}
                  />

                  {/* Dropdown content - centered on screen */}
                  <div className="fixed left-1/2 top-99 -translate-x-1/2 -translate-y-1/2 z-[110] w-full max-w-5xl px-4 animate-in fade-in zoom-in-95 duration-300">
                    <div className="overflow-hidden rounded-2xl shadow-2xl">
                      <div className="relative bg-white p-12">
                        <div className="grid grid-cols-3 gap-12">
                          {/* Help Column */}
                          <div>
                            <h3 className="font-sans font-semibold text-lg text-gray-500 mb-6">Help</h3>
                            <div className="space-y-6">
                              {item.dropdownItems?.slice(0, 4).map((dropdownItem) => (
                                <Link
                                  key={dropdownItem.name}
                                  href={dropdownItem.href}
                                  className="block group transition-all duration-200"
                                  onClick={() => setOpenDropdown(null)}
                                >
                                  <h4 className="font-sans font-semibold text-base text-[#6B4DE6] group-hover:underline mb-1 transition-all duration-200">
                                    {dropdownItem.name}
                                  </h4>
                                  <p className="font-sans text-sm text-gray-600 leading-relaxed">
                                    {dropdownItem.description}
                                  </p>
                                </Link>
                              ))}
                            </div>
                          </div>

                          {/* Resources Column */}
                          <div>
                            <h3 className="font-sans font-semibold text-lg text-gray-500 mb-6">Resources</h3>
                            <div className="space-y-6">
                              {item.dropdownItems?.slice(4, 7).map((dropdownItem) => (
                                <Link
                                  key={dropdownItem.name}
                                  href={dropdownItem.href}
                                  className="block group transition-all duration-200"
                                  onClick={() => setOpenDropdown(null)}
                                >
                                  <h4 className="font-sans font-semibold text-base text-[#6B4DE6] group-hover:underline mb-1 transition-all duration-200">
                                    {dropdownItem.name}
                                  </h4>
                                  <p className="font-sans text-sm text-gray-600 leading-relaxed">
                                    {dropdownItem.description}
                                  </p>
                                </Link>
                              ))}
                            </div>
                          </div>

                          {/* About us Column */}
                          <div>
                            <h3 className="font-sans font-semibold text-lg text-gray-500 mb-6">About us</h3>
                            <div className="space-y-6">
                              {item.dropdownItems?.slice(7).map((dropdownItem) => (
                                <Link
                                  key={dropdownItem.name}
                                  href={dropdownItem.href}
                                  className="block group transition-all duration-200"
                                  onClick={() => setOpenDropdown(null)}
                                >
                                  <h4 className="font-sans font-semibold text-base text-[#6B4DE6] group-hover:underline mb-1 transition-all duration-200">
                                    {dropdownItem.name}
                                  </h4>
                                  <p className="font-sans text-sm text-gray-600 leading-relaxed">
                                    {dropdownItem.description}
                                  </p>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
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
              onClick={() => {
                // Close dropdown after a brief delay to allow navigation to start
                setTimeout(() => setOpenDropdown(null), 100);
              }}
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
          <div className="fixed inset-0 z-50 bg-black bg-opacity-25" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-4 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between">
              <button
                className="-m-1.5 p-1.5"
                onClick={() => handleMobileNavigation('/')}
                disabled={isNavigating}
              >
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
              </button>
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
                        <button
                          className="flex w-full items-center justify-between rounded-lg py-2 pl-3 pr-3.5 text-lg font-sans font-medium leading-7 text-[#0C1628] hover:bg-[#F8E8D8]"
                          onClick={() => handleMobileNavigation(item.href)}
                          disabled={isNavigating}
                        >
                          {item.name}
                        </button>
                      )}

                      {/* Mobile dropdown items */}
                      {item.hasDropdown && openDropdown === item.name && (
                        <div className="mt-2 space-y-2 pl-6">
                          {item.dropdownItems?.map((dropdownItem) => (
                            <button
                              key={dropdownItem.name}
                              className="block w-full text-left rounded-lg py-2 pl-3 pr-3.5 text-sm font-sans text-[#0C1628] hover:bg-[#F8E8D8]"
                              onClick={() => handleMobileNavigation(dropdownItem.href)}
                              disabled={isNavigating}
                            >
                              {dropdownItem.name}
                            </button>
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
                  <button
                    className={`w-full flex items-center justify-center gap-x-1 rounded-full px-6 py-2 font-poppins font-medium text-xl transition-colors duration-300 ${isScrolled ? 'bg-[#B1C3CD] text-[#0C1628] hover:bg-[#B1C3CD] hover:text-[#0C1628]' : 'bg-[#0C1628] hover:text-[#0C1628] text-white hover:bg-[#B1C3CD]'}`}
                    onClick={() => handleMobileNavigation('/contact')}
                    disabled={isNavigating}
                  >
                    Contact Us
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </header>
  )
}