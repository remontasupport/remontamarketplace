import Image from 'next/image'

export default function Footer() {
  const menuItems = [
    { name: 'Home', href: '#' },
    { name: 'Features', href: '#' },
    { name: 'Clients', href: '#' },
    { name: 'Pricing', href: '#' },
    { name: 'Sign Up', href: '#' }
  ]

  const productItems = [
    { name: 'Analytics', href: '#' },
    { name: 'Businesses', href: '#' },
    { name: 'Testimonials', href: '#' },
    { name: 'Integrations', href: '#' }
  ]

  const legalItems = [
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Use', href: '#' }
  ]

  return (
    <footer className="bg-[#0C1628] sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">

          {/* Logo Section */}
          <div className="md:col-span-1">
            <div className="flex flex-col items-left lg:items-start">
              <Image
                className="h-30 w-40 sm:h-28 lg:h-35 relative -left-9 lg:-top-16 lg:-left-0"
                src="/logo/logo-dark.svg"
                alt="Remonta"
                width={250}
                height={120}
                priority
              />
              {/* <span className="text-xs italic text-gray-300 mt-1 lg:-mt-12 lg:relative lg:-top-12 lg:left-11">
                previously Remonta
              </span> */}
            </div>
          </div>

          {/* Menu Section */}
          <div className="md:col-span-1 text-left lg:mt-0 -mt-10">
            <h3 className="font-sans text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 uppercase tracking-wide">
              MENU
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <a
                    href={item.href}
                    className="font-sans text-sm sm:text-base text-white hover:text-[#B1C3CD] transition-colors duration-200"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Product Section */}
          <div className="md:col-span-1 text-left">
            <h3 className="font-sans text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 uppercase tracking-wide">
              PRODUCT
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {productItems.map((item, index) => (
                <li key={index}>
                  <a
                    href={item.href}
                    className="font-sans text-sm sm:text-base text-white hover:text-[#B1C3CD] transition-colors duration-200"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Section */}
          <div className="md:col-span-1 text-left">
            <h3 className="font-sans text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 uppercase tracking-wide">
              LEGAL
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {legalItems.map((item, index) => (
                <li key={index}>
                  <a
                    href={item.href}
                    className="font-sans text-sm sm:text-base text-white hover:text-[#B1C3CD] transition-colors duration-200"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Acknowledgement and Social Media Section */}
        <div className="mt-12 pt-8 border-t border-white/30">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

            {/* Acknowledgement of Country */}
            <div className="lg:col-span-2">
              <h3 className="font-sans text-lg font-semibold text-white mb-4">
                Acknowledgement of Country
              </h3>
              <p className="font-sans text-sm text-white/80 leading-relaxed mb-4">
                We acknowledge the cultures of our First Nations Peoples and are thankful for the community that we share together now. We pay our respects to our First Nations Peoples and their elders/leaders, both past and present, and those who are rising up to become leaders.
              </p>
              <p className="font-sans text-sm text-white/80">
                Remonta is a part of <span className="text-white font-medium">LocalAid</span>, dedicated to helping people attain better outcomes.
              </p>
            </div>

            {/* Connect with us */}
            <div className="lg:col-span-1 relative lg:left-78">
              <h3 className="font-sans text-lg font-semibold text-white mb-4">
                Connect with us
              </h3>
              <div className="flex space-x-4">
                <a href="#" className="text-white hover:text-[#B1C3CD] transition-colors duration-200">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="text-white hover:text-[#B1C3CD] transition-colors duration-200">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </a>
                <a href="#" className="text-white hover:text-[#B1C3CD] transition-colors duration-200">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#" className="text-white hover:text-[#B1C3CD] transition-colors duration-200">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Copyright Section */}
        <div className="mt-12 pt-8 border-t border-white/30">
          <div className="text-center">
            <p className="font-sans text-sm text-white/70">
              © 2025 Remonta. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}