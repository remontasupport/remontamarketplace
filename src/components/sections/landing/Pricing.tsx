'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function Pricing() {
  const benefits = [
    {
      icon: <Image src="/images/ndis-funding.svg" alt="NDIS funding" width={44} height={44} />,
      title: "NDIS funding, including agency, plan and self managed",
      description: "Get help whenever you need it with our round-the-clock support team."
    },
    {
      icon: <Image src="/images/state-based.svg" alt="State-based funding" width={44} height={44} />,
      title: "State-based funding",
      description: "Your transactions are protected with bank-level security encryption."
    },
    // {
    //   icon: <Image src="/images/home-care.svg" alt="Home Care Packages" width={25} height={25} />,
    //   title: "Home Care Packages",
    //   description: "All support workers are background checked and professionally verified."
    // },
    {
      icon: <Image src="/images/insurance-based.svg" alt="Insurance-based funding" width={25} height={25} />,
      title: "Insurance-based funding",
      description: "Schedule, manage, and track all your support appointments in one place."
    },
    {
      icon: <Image src="/images/tac-funding.svg" alt="TAC funding" width={32} height={32} />,
      title: "TAC funding (Victoria)",
      description: "Full insurance protection for peace of mind during service delivery."
    },
    {
      icon: <Image src="/images/self-funding.svg" alt="Self-funding" width={44} height={44} />,
      title: "Self-funding through personal income",
      description: "Full insurance protection for peace of mind during service delivery."
    }
  ];

  return (
    <section className="bg-white pt-4 pb-4 sm:py-16 md:py-20 lg:py-24 overflow-x-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-0">
        {/* Mobile Header - Centered */}
        <div className="text-center mb-8 sm:mb-12 lg:hidden">
          <p className="font-sans text-xs sm:text-sm md:text-base font-medium uppercase tracking-wide mb-3 sm:mb-4">
            <span className="bg-[#F8E8D8] px-2 py-0 rounded-lg text-[#0C1628]">PRICING</span>
          </p>
          <h2 className="font-cooper text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-normal leading-tight text-[#0C1628] mb-2 sm:mb-8">
            We accept different types of f﻿unding
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-start">

          {/* Left Column - Benefits */}
          <div className="order-2 lg:order-1">
            {/* Desktop Header - Only visible on large screens */}
            <div className="hidden lg:block">
              <p className="font-sans text-xs sm:text-sm md:text-base font-medium uppercase tracking-wide mb-3 sm:mb-4">
                <span className="bg-[#F8E8D8] px-2 py-0 rounded-lg text-[#0C1628]">PRICING</span>
              </p>
              <h2 className="font-cooper text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-normal leading-tight text-[#0C1628] mb-2 sm:mb-8">
                We accept different types of f﻿unding
              </h2>
            </div>

            <p className="font-sans text-base sm:text-lg text-[#0C1628] mb-6 sm:mb-8 leading-relaxed text-center lg:text-left">
              Our rates are set, transparent and designed to be fair for everyone. Here are some of our funding options:
            </p>

            {/* Benefits List */}
            <div className="space-y-4 sm:space-y-5">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-[#EDEFF3] rounded-full flex items-center justify-center">
                      {benefit.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-sans font-semibold text-sm sm:text-lg text-[#0C1628] mb-1">
                      {benefit.title}
                    </h3>
                    {/* <p className="font-sans text-sm sm:text-base text-[#0C1628] leading-relaxed">
                      {benefit.description}
                    </p> */}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Pricing Image */}
          <div className="order-1 lg:order-2 lg:mt-16">
            <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden shadow-lg bg-[#0C1628]">
              <Image
                src="/images/pricing-image.webp"
                alt="Pricing information"
                fill
                className="object-cover"
                priority
              />

              {/* Floating Card */}
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
                <div className="bg-[#B1C3CD] rounded-2xl p-3 sm:p-6 shadow-xl">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="text-lg sm:text-2xl">👋</div>
                    <div className="flex-1">
                      <h3 className="font-sans font-semibold text-[#0C1628] text-xs sm:text-xl">
                        Remonta made it easy for you
                      </h3>
                      <p className="font-sans text-[#0C1628] text-xs sm:text-base">
                        Support without the hassle
                      </p>
                    </div>
                  </div>

                  <div className="pl-7 sm:pl-11">
                    <p className="font-sans text-[#0C1628] text-xs sm:text-base mb-1 sm:mb-2">
                      99% completion rate with trusted support workers
                    </p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-yellow-400 text-xs sm:text-base">⭐</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Second CTA Section */}
        <div className="mt-16 sm:mt-20 lg:mt-24">
          <div className="bg-[#0C1628] rounded-2xl sm:rounded-3xl px-6 py-8 sm:px-8 sm:py-12 md:px-12 md:py-16 lg:px-16 lg:py-20 text-center">
            <h2 className="font-cooper text-3xl sm:text-4xl md:text-3xl lg:text-5xl font-normal leading-tight text-white mb-2 sm:mb-8">
              Ready to join Remonta?
            </h2>

            <p className="font-sans text-lg sm:text-xl lg:text-2l text-white leading-relaxed mb-8 sm:mb-10 lg:mb-12 max-w-3xl mx-auto">
              Join thousands of participants who trust Remonta for reliable, compassionate support services tailored to your unique needs.
            </p>

            <div className="flex flex-col items-center justify-center gap-4">
              <a href="mailto:contact@remontaservices.com.au" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#B1C3CD] px-6 py-3 sm:px-8 sm:py-4 font-sans font-semibold text-sm sm:text-base text-[#0C1628] hover:bg-white transition-colors duration-200 w-full sm:w-auto max-w-md">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>contact@remontaservices.com.au</span>
              </a>

              <a href="tel:1300134153" className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-4 font-sans font-semibold text-base text-white underline hover:text-[#B1C3CD] transition-colors duration-200 w-full sm:w-auto max-w-md">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>1300 134 153</span>
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}