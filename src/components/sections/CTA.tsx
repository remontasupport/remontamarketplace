import Link from 'next/link'
import Image from 'next/image'

export default function CTA() {
  return (
    <section className="bg-white py-8 sm:py-12 md:py-16 lg:py-20 lg:pb-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0C1628] rounded-2xl sm:rounded-3xl px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:pl-16 lg:pr-0 lg:pt-4 lg:pb-8 relative overflow-visible">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-4 items-center">
          {/* Left Column - Content */}
          <div className="order-2 lg:order-1 lg:-translate-y-4">
            <h2 className="font-cooper text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-normal leading-tight text-white mb-4 sm:mb-6">
              Ready to work with us?
            </h2>

            <p className="font-sans text-base sm:text-lg lg:text-lg text-white leading-relaxed mb-6 sm:mb-8">
             Remonta provide tips and information to help you access experiences you love.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <Link
                href="/get-started"
                className="inline-flex items-center justify-center rounded-full bg-[#B1C3CD] px-6 sm:px-8 lg:px-8 py-3 sm:py-3.5 lg:py-3.5 font-sans font-semibold text-base sm:text-base text-[#0C1628] hover:bg-white hover:text-[#0C1628] transition-colors duration-200"
              >
                Provide Support
              </Link>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="order-1 lg:order-2 relative">
            <div className="relative w-full h-[280px] sm:h-[320px] md:h-[350px] lg:w-[120%] lg:h-[380px] lg:translate-y-8 lg:-translate-x-30 rounded-2xl overflow-hidden">
              <Image
                src="/images/cta-support-worker.png"
                alt="NDIS support worker helping young participant in wheelchair"
                fill
                className="object-cover object-left object-center scale-120"
                priority
              />
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>
  )
}