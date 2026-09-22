'use client'

import { BRAND_COLORS } from "@/lib/constants"

export default function ScrollToServicesButton() {
  const handleClick = () => {
    const servicesSection = document.getElementById('services')
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center justify-center rounded-full px-6 py-2.5 sm:px-8 sm:py-3 border-2 font-poppins font-medium text-sm sm:text-base transition-colors duration-300"
      style={{ borderColor: BRAND_COLORS.PRIMARY, color: BRAND_COLORS.PRIMARY }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = BRAND_COLORS.PRIMARY
        e.currentTarget.style.color = 'white'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
        e.currentTarget.style.color = BRAND_COLORS.PRIMARY
      }}
    >
      View our services
    </button>
  )
}
