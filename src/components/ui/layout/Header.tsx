'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDownIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import '@/styles/header.css'

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
    href: '/find-support',
    hasDropdown: false
  },
  {
    name: 'Provide Support',
    href: '/provide-support',
    hasDropdown: false
  },
  {
    name: 'For Support Coordinators',
    href: '/support-coordinators',
    hasDropdown: false
  },
  {
    name: 'Services',
    href: '/services',
    hasDropdown: false
  },
  {
    name: 'News',
    href: '/newsroom',
    hasDropdown: false
  },
  {
    name: 'Get In Touch',
    href: '/contact',
    hasDropdown: false
  },
  // {
  //   name: 'More',
  //   href: '#',
  //   hasDropdown: true,
  //   dropdownItems: [
  //     { name: 'Help Centre', href: '/help', description: 'Find helpful articles, guides and answers to common queries.' },
  //     { name: 'FAQs', href: '/faqs', description: 'Find the answers to frequently asked questions about Remonta.' },
  //     { name: 'Trust and Safety', href: '/trust-safety', description: 'Explore how Remonta ensures the safety and wellbeing of our community.' },
  //     { name: 'Newsroom', href: '/newsroom', description: 'Find news, helpful tips and insightful stories from the Remonta community.' },
  //     { name: 'Leadership', href: '/leadership', description: 'Meet the leadership team behind Remonta.' },
  //     { name: 'Topic Libraries', href: '/topic-libraries', description: 'Browse guides to home care packages, the NDIS, becoming a support worker on Remonta and more.' },
  //     { name: 'Careers at Remonta', href: '/careers', description: 'Check open job listings at Remonta.' },
  //     { name: 'Contact us', href: '/contact', description: 'Get in touch with us via live chat, phone or email.' },
  //     { name: 'Our story', href: '/about', description: 'Learn more about Remonta and how the company got started.' },
  //   ]
  // },
]

export default function Header() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [signUpModalOpen, setSignUpModalOpen] = useState(false)
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
    <header className={`header ${isScrolled ? 'scrolled' : ''}`} ref={headerRef}>
      <nav className="header-nav" aria-label="Global">
        {/* Logo */}
        <div className="logo-container">
          <Link
            href="/"
            className="logo-link"
            onClick={() => {
              // Close dropdown after a brief delay to allow navigation to start
              setTimeout(() => setOpenDropdown(null), 100);
            }}
          >

            <div className="logo-inner">
              <Image
                className="logo-image"
                src={isScrolled ? "/logo/logo-dark.svg" : "/logo/logo.svg"}
                alt="Remonta"
                width={120}
                height={60}
                priority
              />
              {/* <span className={`ml-5 lg:ml-9 text-xs mt-0.5 italic transition-colors duration-300 ${isScrolled ? 'text-gray-300' : 'text-gray-500'}`}>
                previously Remonta
              </span> */}
            </div>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="mobile-menu-button-container">
          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className={`mobile-menu-icon ${isScrolled ? 'scrolled' : 'default'}`} aria-hidden="true" />
          </button>
        </div>

        {/* Desktop navigation */}
        <div className="desktop-nav">
          {navigation.map((item) => (
            <div key={item.name} className="nav-item">
              {item.hasDropdown ? (
                <button

                  className={`nav-dropdown-button ${isScrolled ? 'scrolled' : ''}`}
                  onClick={() => setOpenDropdown(openDropdown === item.name ? null : item.name)}
                >
                  {item.name}
                  <ChevronDownIcon className="dropdown-icon" aria-hidden="true" />
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={`nav-link ${isScrolled ? 'scrolled' : ''}`}
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
                    className="dropdown-backdrop"
                    onClick={() => setOpenDropdown(null)}
                  />

                  {/* Dropdown content - centered on screen */}
                  <div className="dropdown-content-wrapper">
                    <div className="dropdown-content">
                      <div className="dropdown-inner">
                        <div className="dropdown-grid">
                          {item.dropdownItems?.map((dropdownItem) => (
                            <Link
                              key={dropdownItem.name}
                              href={dropdownItem.href}
                              className="dropdown-item"
                              onClick={() => setOpenDropdown(null)}
                            >
                              <h4 className="dropdown-item-title">
                                {dropdownItem.name}
                              </h4>
                              <p className="dropdown-item-description">
                                {dropdownItem.description}
                              </p>
                            </Link>
                          ))}
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
        <div className="header-actions">
          {/* Login Button */}
          <Link
            href="https://app.remontaservices.com.au/login"
            className={`auth-button login-button ${isScrolled ? 'scrolled' : ''}`}
            onClick={() => {
              setTimeout(() => setOpenDropdown(null), 100);
            }}
          >
            Login
          </Link>

          {/* Sign Up Button */}
          <div className="signup-button-wrapper">
            <button
              className={`auth-button signup-button ${isScrolled ? 'scrolled' : ''}`}
              onClick={() => {
                setSignUpModalOpen(!signUpModalOpen);
                setTimeout(() => setOpenDropdown(null), 100);
              }}
            >
              Sign Up
            </button>

            {/* Sign Up Dropdown Modal - Desktop */}
            {signUpModalOpen && (
              <>
                <div className="signup-dropdown-backdrop" onClick={() => setSignUpModalOpen(false)} />
                <div className="signup-dropdown-content">
                  <h2 className="signup-dropdown-title">Sign up to Remonta</h2>

                  <div className="signup-dropdown-options">
                    <Link
                      href="/registration/user"
                      className="signup-dropdown-option"
                      onClick={() => setSignUpModalOpen(false)}
                    >
                      <h3 className="signup-option-title">I want to find support:</h3>
                      <p className="signup-option-description">
                        For myself, a client or on behalf of a friend or family member.
                      </p>
                    </Link>

                    <Link
                      href="https://app.remontaservices.com.au/registration/worker"
                      className="signup-dropdown-option"
                      onClick={() => setSignUpModalOpen(false)}
                    >
                      <h3 className="signup-option-title">I want to provide support:</h3>
                      <p className="signup-option-description">
                        As a support worker, nurse, allied health professional, gardener or cleaner.
                      </p>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div>
          <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)} />
          <div className="mobile-menu-panel">
            <div className="mobile-menu-header">
              <button
                className="mobile-menu-logo-button"
                onClick={() => handleMobileNavigation('/')}
                disabled={isNavigating}
              >
                <div className="mobile-logo-inner">
                  <Image
                    className="mobile-logo-image"
                    src="/logo/logo.svg"
                    alt="Remonta"
                    width={120}
                    height={60}
                  />
                  {/* <span className="text-xs mt-0.5 italic text-gray-500">
                    previously Remonta
                  </span> */}
                </div>
              </button>
              <button
                type="button"
                className="mobile-close-button"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon className="mobile-close-icon" aria-hidden="true" />
              </button>
            </div>
            <div className="mobile-menu-content">
              <div className="mobile-menu-divider">
                <div className="mobile-nav-section">
                  {navigation.map((item) => (
                    <div key={item.name}>
                      {item.hasDropdown ? (
                        <button
                          className="mobile-nav-button"
                          onClick={() => setOpenDropdown(openDropdown === item.name ? null : item.name)}
                        >
                          {item.name}
                          <ChevronDownIcon
                            className={`mobile-dropdown-icon ${openDropdown === item.name ? 'open' : ''}`}
                            aria-hidden="true"
                          />
                        </button>
                      ) : (
                        <button
                          className="mobile-nav-button"
                          onClick={() => handleMobileNavigation(item.href)}
                          disabled={isNavigating}
                        >
                          {item.name}
                        </button>
                      )}

                      {/* Mobile dropdown items */}
                      {item.hasDropdown && openDropdown === item.name && (
                        <div className="mobile-dropdown-items">
                          {item.dropdownItems?.map((dropdownItem) => (
                            <button
                              key={dropdownItem.name}
                              className="mobile-dropdown-button"
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

                {/* Login and Sign Up buttons for mobile */}
                <div className="mobile-auth-section">
                  {/* Login Button */}
                  <button
                    className="mobile-auth-button mobile-login-button"
                    onClick={() => handleMobileNavigation('https://app.remontaservices.com.au/login')}
                    disabled={isNavigating}
                  >
                    Login
                  </button>
                  <button
                    className="mobile-auth-button mobile-signup-button"
                    onClick={() => {
                      setSignUpModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Sign Up Modal - Mobile (centered) */}
      {signUpModalOpen && mobileMenuOpen === false && (
        <div className="signup-modal-overlay mobile-only" onClick={() => setSignUpModalOpen(false)}>
          <div className="signup-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="signup-modal-title">Sign up to Remonta</h2>

            <div className="signup-modal-options">
              <Link
                href="/registration/user"
                className="signup-modal-option"
                onClick={() => setSignUpModalOpen(false)}
              >
                <p className="signup-option-title">I want to find support:</p>
                <p className="signup-option-description">
                  For myself, a client or on behalf of a friend or family member.
                </p>
              </Link>

              <Link
                href="/registration/worker"
                className="signup-modal-option"
                onClick={() => setSignUpModalOpen(false)}
              >
                <p className="signup-option-title">I want to provide support:</p>
                <p className="signup-option-description">
                  As a support worker, nurse, allied health professional, gardener or cleaner.
                </p>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}