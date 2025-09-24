import Link from 'next/link'

const steps = [
  {
    step: 1,
    title: 'Complete the Registration Form',
    description: 'Fill in your basic details and service type.',
  },
  {
    step: 2,
    title: 'Submit Compliance Documents',
    description: 'Upload your ID, qualifications, insurance, and checks (we’ll guide you through this).',
  },
  {
    step: 3,
    title: 'Join the Network',
    description: 'Once verified, you’ll be onboarded and start receiving job opportunities in your area.',
  },
]

export default function HowItWorks() {
  return (
    <section className="bg-[#EDEFF3] py-8 sm:py-12 md:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-16 items-start mb-8 sm:mb-12 md:mb-16 lg:mb-20">
          {/* Left Column - Title */}
          <div>
            <p className="font-sans text-xs sm:text-sm md:text-base font-medium uppercase tracking-wide mb-3 sm:mb-4">
              <span className="bg-[#F8E8D8] px-2 py-0 rounded-lg text-[#0C1628]">HOW IT WORKS</span>
            </p>
            <h2 className="font-cooper text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal leading-tight text-[#0C1628]">
              What We Look For
            </h2>
          </div>

          {/* Right Column - Description and CTA */}
          <div className="lg:pt-8">
            <div className="sm:mb-8">
              <p className="font-sans text-sm sm:text-base lg:text-lg text-[#0C1628] sm:mb-4">
                We partner with individuals and businesses that:
              </p>
              <ul className="font-sans text-sm sm:text-base lg:text-lg text-[#0C1628] ml-3 sm:ml-4">
                <li className="flex items-start">
                  <span className="text-[#0C1628] mr-2 sm:mr-3 flex-shrink-0">•</span>
                  <span>Are passionate about helping others</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0C1628] mr-2 sm:mr-3 flex-shrink-0">•</span>
                  <span>Hold current ABNs and relevant insurances</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0C1628] mr-2 sm:mr-3 flex-shrink-0">•</span>
                  <span>Are reliable, respectful, and compliant with NDIS guidelines</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
              <Link
                href="/get-started"
                className="inline-flex items-center justify-center rounded-full bg-[#0C1628] px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 lg:py-3 font-sans font-semibold text-sm sm:text-base text-white hover:bg-[#B1C3CD] hover:text-[#0C1628] transition-colors duration-200 flex-shrink-0"
              >
                Get started
              </Link>
              <p className="font-sans text-xs sm:text-sm text-gray-500 flex-1 leading-relaxed">
                * Don't worry - if you're just starting out, our team can guide you through what you need.
              </p>
            </div>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 items-stretch">
          {steps.map((item) => (
            <div
              key={item.step}
              className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 lg:p-8 hover:shadow-lg transition-shadow duration-300 flex flex-col min-h-[280px] sm:min-h-[320px] lg:min-h-[320px]"
            >
              {/* Step Number */}
              <div className="mb-4 sm:mb-6">
                <span className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#F8E8D8] font-cooper text-lg sm:text-xl font-normal text-[#0C1628]">
                  {item.step}
                </span>
              </div>

              {/* Step Content */}
              <div className="flex-grow flex flex-col">
                <h3 className="font-cooper text-lg sm:text-xl lg:text-2xl font-normal text-[#0C1628] mb-2 sm:mb-3 lg:mb-4 min-h-[3rem] sm:min-h-[4rem] flex items-start leading-tight">
                  {item.title}
                </h3>
                <p className="font-sans text-xs sm:text-sm lg:text-base text-[#0C1628] leading-relaxed flex-grow">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}