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
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.533 2.741.059.225.067.425.048.65-.172.717-.402 1.629-.402 1.629-.143.607-.58.826-1.129.602-1.757-.867-2.852-3.78-2.852-6.044 0-4.735 3.44-9.089 9.931-9.089 5.215 0 9.269 3.716 9.269 8.686 0 5.181-3.268 9.342-7.806 9.342-1.522 0-2.958-.8-3.449-1.754 0 0-.756 2.871-.94 3.581-.341 1.336-1.270 3.003-1.890 4.02 1.434.442 2.958.681 4.540.681 6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
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