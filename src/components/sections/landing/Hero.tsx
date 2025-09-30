import Image from 'next/image'
import Link from 'next/link'

export default function Hero() {
  return (
    <section className="bg-white pt-0 pb-4 sm:py-16 lg:py-6 overflow-x-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-2 pb-6 sm:py-8 py-4 sm:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-start">
          {/* Left Column - Content */}
          <div className="order-2 lg:order-1">
            <h1 className="font-cooper text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal leading-tight text-[#0C1628] mb-4 sm:mb-6">
              Your online platform to find, book, and <span className="bg-[#F8E8D8] px-2 py-0 rounded-lg">manage NDIS services</span>
            </h1>

            <p className="font-sans text-lg sm:text-xl lg:text-2xl text-[#0C1628] mb-6 sm:mb-8 leading-relaxed">
              Whether you need support or want to offer it, our platform makes the process simple and secure.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
              <Link
                href="/registration/client"
                className="inline-flex mx-12 lg:mx-0 items-center justify-center rounded-full bg-white border border-[#0C1628] px-8 sm:px-10 py-3 sm:py-4 font-sans font-semibold text-base sm:text-lg text-[#0C1628] hover:bg-gray-50 transition-colors duration-200"
              >
                Find support
              </Link>
              <Link
                href="/registration/contractor"
                className="inline-flex mx-12 lg:mx-0 items-center justify-center rounded-full bg-[#0C1628] px-8 sm:px-10 py-3 sm:py-4 font-sans font-semibold text-base sm:text-lg text-white hover:bg-[#B1C3CD] hover:text-[#0C1628] transition-colors duration-200"
              >
                Provide support
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#EDEFF3] rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#0C1628]" stroke="currentColor" fill="none" viewBox="0 0 64 64" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="32" cy="7.6" r="5.1"/>
                      <path d="M23.33,31.44l-.48-5c-.3-3.02-1.63-5.84-3.78-7.99L8.16,7.54c-1.16-1.16-1.16-3.04,0-4.2.58-.58,1.34-.87,2.1-.87s1.52.29,2.1.87l10.39,10.4c2.45,2.45,5.78,3.83,9.25,3.83,1.74,0,3.44-.35,5.01-1s3.01-1.61,4.24-2.83l10.39-10.4c1.16-1.16,3.04-1.16,4.2,0,.58.58.87,1.34.87,2.1s-.29,1.52-.87,2.1l-10.91,10.91c-2.15,2.15-3.48,4.97-3.78,7.99l-.48,5"/>
                      <circle cx="32" cy="45.23" r="16.29"/>
                      <polygon points="32 33.72 35.54 40.35 42.95 41.67 37.74 47.1 38.77 54.55 32 51.26 25.23 54.55 26.26 47.1 21.05 41.67 28.46 40.35 32 33.72"/>
                      <line x1="53.89" y1="46.75" x2="53.89" y2="25.48"/>
                      <polyline points="49.27 30.28 53.89 25.48 58.69 30.1"/>
                      <line x1="10.11" y1="46.75" x2="10.11" y2="25.48"/>
                      <polyline points="14.73 30.28 10.11 25.48 5.31 30.1"/>
                    </svg>
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="font-sans font-bold text-xl sm:text-2xl text-[#0C1628] leading-tight">99%</div>
                  <div className="font-sans text-sm sm:text-base text-gray-600 leading-tight">Job completion rate with verified workers.</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#EDEFF3] rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#0C1628]" stroke="currentColor" fill="none" viewBox="0 0 64 64" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M39.14,47.26l.02-.02,10.82-9.09c.35-.3.79-.45,1.23-.45.4,0,.8.13,1.14.38.89.65,1.04,1.91.35,2.76l-8.62,10.52c-3.32,4.05-8.35,6.28-13.59,6.12-4.95-.15-9.69.5-11.85.86"/>
                      <path d="M16,46.15l1.81-1.51c1.89-1.57,4.24-2.39,6.62-2.39,1.36,0,2.73.27,4.03.82,1.48.63,3.1.9,4.72.8l4.23-.29s.1,0,.14,0c1,0,1.88.68,2.13,1.66.18.73-.03,1.48-.5,2l-.02.02c-.27.3-.64.52-1.06.62-1.92.46-5.35.87-11.01.37"/>
                      <rect x="12.14" y="44.23" width="5.28" height="17.34" rx="2.64" ry="2.64" transform="translate(-10.84 4.31) rotate(-12.19)"/>
                      <path d="M40.76,33.13v6.13l-6.12-6.13h-10.34c-2.18,0-3.95-1.77-3.95-3.95V6.51c0-2.18,1.77-3.95,3.95-3.95h24.89c2.18,0,3.95,1.77,3.95,3.95v22.66c0,2.18-1.77,3.95-3.95,3.95h-8.42Z"/>
                      <path d="M37.74,27.38l8.5-7.59c2.33-2.08,2.89-5.51,1.35-8.22h0c-1.95-3.44-6.46-4.41-9.66-2.09l-1.18.86-1.18-.86c-3.2-2.32-7.71-1.35-9.66,2.09h0c-1.54,2.72-.98,6.14,1.35,8.22l8.5,7.59c.57.51,1.43.51,2,0Z"/>
                      <polyline points="33.53 17.12 35.82 19.41 39.94 15.29"/>
                    </svg>
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="font-sans font-bold text-xl sm:text-2xl text-[#0C1628] leading-tight">610,000+</div>
                  <div className="font-sans text-sm sm:text-base text-gray-600 leading-tight">Australian supported by the NDIS</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#EDEFF3] rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#0C1628]" stroke="currentColor" fill="none" viewBox="0 0 64 64" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <g>
                        <polyline points="33.41 47.79 3.76 47.79 3.76 2.79 56.48 2.79 56.48 38.48"/>
                        <circle cx="46.82" cy="47.79" r="13.42"/>
                        <circle cx="41.49" cy="43.99" r="2.71"/>
                        <circle cx="52.16" cy="43.99" r="2.71"/>
                        <path d="M41.08,50.69h11.48v.8c0,3.17-2.57,5.74-5.74,5.74h0c-3.17,0-5.74-2.57-5.74-5.74v-.8h0Z"/>
                      </g>
                      <rect x="44.31" y="8.74" width="5.74" height="21.26"/>
                      <rect x="32.94" y="19.38" width="5.74" height="10.63"/>
                      <rect x="21.56" y="8.74" width="5.74" height="21.26"/>
                      <rect x="10.18" y="16.16" width="5.74" height="13.84"/>
                      <line x1="10.18" y1="36.48" x2="32.94" y2="36.48"/>
                      <line x1="10.18" y1="42.45" x2="27.3" y2="42.45"/>
                    </svg>
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="font-sans font-bold text-xl sm:text-2xl text-[#0C1628] leading-tight">70%</div>
                  <div className="font-sans text-sm sm:text-base text-gray-600 leading-tight">Admin time saved.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="order-1 lg:order-2">
            <div className="relative mt-4 sm:mt-6 lg:mt-7">
              <div
                className="aspect-[4/3] w-full overflow-hidden shadow-lg"
                style={{
                  borderRadius: '2rem'
                  
                }}
              >
                <Image
                  src="/hero-image.png"
                  alt="Support worker embracing person with disability showing care and connection"
                  fill
                  className="object-cover object-center"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                  style={{ borderRadius: '2rem' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}