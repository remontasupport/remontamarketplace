'use client'
import Image from 'next/image'
import { useState } from 'react'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

interface ServiceItem {
  id: number
  title: string
  content: string
  bulletPoints: string[]
  image: string
  imageAlt: string
}

const services: ServiceItem[] = [
  {
    id: 1,
    title: "Support Work",
    content: "Personal care, household support, and community access designed to make daily life easier and more enjoyable while building confidence and independence.",
    bulletPoints: [
      "Daily Living & Personal Care",
      "Household Tasks",
      "Transport & Community Access",
      "Social & Community Participation",
      "Capacity Building & Skills",
      "Administration & Advocacy",
      "Complex Supports (if trained)"
    ],
    image: "/images/support-work.webp",
    imageAlt: "Support worker helping participant with personal care"
  },
  {
    id: 2,
    title: "Cleaning",
    content: "Comprehensive home cleaning services including general tidying, laundry, deep cleaning, and seasonal sanitising to ensure a healthy and welcoming living environment.",
    bulletPoints: [
      "General Cleaning",
      "Laundry",
      "Deep Cleaning",
      "Seasonal / Periodic"
    ],
    image: "/images/cleaning.webp",
    imageAlt: "Participants engaging in community activities"
  },
  {
    id: 3,
    title: "Home and Yard Maintenance",
    content: "Lawn, garden, and outdoor care to keep your spaces looking fresh, tidy, and enjoyable all year round",
    bulletPoints: [
      "Lawn & Garden Care",
      "Outdoor Cleaning",
      "Waste & Seasonal Tasks"
    ],
    image: "/images/homeyard.webp",
    imageAlt: "Support worker helping with daily living activities"
  },
  {
    id: 4,
    title: "Fitness and Rehabilitation",
    content: "Tailored exercise plans, mobility training and strength rehab delivered by qualified therapists to boost your wellbeing.",
    bulletPoints: [
      "Mobility & Rehabilitation",
      "Fitness & Health",
      "Personal Training"
    ],
    image: "/images/fitnessRehab.webp",
    imageAlt: "Specialized support worker providing care"
  },
  {
    id: 5,
    title: "Therapeutic Support",
    content: "One-on-one counselling, behavioural strategies and skill-building sessions to help you reach your personal goals.",
    bulletPoints: [
      "Behavior support and intervention",
      "Therapy session assistance",
      "Complex medical care coordination"
    ],
    image: "/images/therapueticSupport.webp",
    imageAlt: "Specialized support worker providing care"
  },
  {
    id: 6,
    title: "Nursing",
    content: "Specialised clinical care and health supports to manage complex needs, promote wellbeing, and give families peace of mind.",
    bulletPoints: [
      "Clinical Care",
      "Medication Management",
      "Health Monitoring",
      "Complex Disability Supports",
      "Education & Training"
    ],
    image: "/images/nursing.webp",
    imageAlt: "Specialized support worker providing care"
  },
    {
    id: 7,
    title: "Home Modifications",
    content: "Specialised design and construction services, including bathroom, kitchen, and vehicle modifications, to support independence and accessibility.",
    bulletPoints: [
      "Design and construction",
      "Bathroom and kitchen modifications",
      "Access ramps and rails",
      "Vehicle modifications"
    ],
    image: "/images/homemodify.webp",
    imageAlt: "Specialized support worker providing care"
  }
  
]

export default function Services() {
  const [openAccordion, setOpenAccordion] = useState<number>(1)
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false)
  const [displayService, setDisplayService] = useState<ServiceItem | undefined>(services[0])

  const toggleAccordion = (id: number) => {
    const newId = openAccordion === id ? 0 : id

    if (openAccordion !== 0 && newId !== openAccordion) {
      // If switching from one open accordion to another, handle smooth transition
      setIsTransitioning(true)
      setTimeout(() => {
        setOpenAccordion(newId)
        setDisplayService(services.find(service => service.id === newId))
        setIsTransitioning(false)
      }, 300) // Half of fade out duration
    } else if (openAccordion !== 0 && newId === 0) {
      // If closing accordion, fade out then remove
      setIsTransitioning(true)
      setTimeout(() => {
        setOpenAccordion(newId)
        setDisplayService(undefined)
        setIsTransitioning(false)
      }, 600) // Full fade out duration
    } else {
      // If opening accordion from closed state
      setOpenAccordion(newId)
      setDisplayService(services.find(service => service.id === newId))
    }
  }

  const currentService = displayService

  return (
    <section id="services" className="bg-white pt-4 pb-4 sm:py-16 md:py-20 lg:py-24 overflow-x-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-0">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <p className="font-sans text-xs sm:text-sm md:text-base font-medium uppercase tracking-wide mb-3 sm:mb-4">
            <span className="bg-[#F8E8D8] px-2 py-0 rounded-lg text-[#0C1628]">SERVICES</span>
          </p>
          <h2 className="section-title mb-2 sm:mb-8">
            This Is How We Create Transformation
          </h2>
          <p className="font-sans text-base sm:text-lg lg:text-xl text-[#0C1628] leading-relaxed max-w-4xl mx-auto">
            We offer comprehensive NDIS support services designed to empower participants to live independently and achieve their goals.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 lg:items-start">
          {/* Accordion Section */}
          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md"
              >
                <button
                  onClick={() => toggleAccordion(service.id)}
                  className="w-full flex items-center justify-between p-6 sm:p-8 bg-white transition-colors duration-200"
                >
                  <div className="flex items-center">
                    <div className="w-3 h-3 sm:w-6 sm:h-6 bg-[#B1C3CD] rounded-full flex items-center justify-center mr-4 sm:mr-6">
                      <div className="w-1 h-1 sm:w-2 sm:h-2 bg-[#0C1628] rounded-full"></div>
                    </div>
                    <h3 className="font-cooper text-xl sm:text-2xl lg:text-3l font-normal text-[#0C1628] text-left">
                      {service.title}
                    </h3>
                  </div>
                  {openAccordion === service.id ? (
                    <ChevronUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#0C1628] flex-shrink-0" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#0C1628] flex-shrink-0" />
                  )}
                </button>

                <div
                  className={`overflow-hidden transition-all duration-500 ease-out ${
                    openAccordion === service.id
                      ? 'max-h-[800px] opacity-100'
                      : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="p-6 sm:p-8 pt-0 bg-gray-50">
                    <p className="font-sans text-base sm:text-lg text-[#0C1628] leading-relaxed mb-6">
                      {service.content}
                    </p>

                    {/* Mobile Image - Only visible on mobile */}
                    <div className="block lg:hidden mb-6">
                      <div className="relative w-full h-[250px] rounded-2xl overflow-hidden shadow-lg">
                        <Image
                          src={service.image}
                          alt={service.imageAlt}
                          fill
                          className="object-cover"
                          priority
                        />
                      </div>
                    </div>

                    <ul className="space-y-3">
                      {service.bulletPoints.map((point, index) => (
                        <li key={index} className="flex items-start">
                          <div className="w-1.5 h-1.5 bg-[#B1C3CD] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span className="font-sans text-base sm:text-lg text-[#0C1628]">
                            {point}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Image Section - Only visible on large screens when accordion is open */}
          {currentService && (
            <div
              key={currentService.id}
              className={`hidden lg:block ${
                isTransitioning
                  ? 'animate-[fadeOutDown_0.6s_ease-out_forwards]'
                  : 'opacity-0 translate-y-6 animate-[fadeInUp_0.6s_ease-out_forwards]'
              }`}
            >
              <div className="relative lg:-top-6 w-full h-[400px] sm:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src={currentService.image}
                  alt={currentService.imageAlt}
                  fill
                  className="object-cover transition-all duration-500 ease-in-out"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                <div className={`absolute bottom-6 left-6 right-6 ${
                  isTransitioning
                    ? 'animate-[fadeOutDown_0.6s_ease-out_forwards]'
                    : 'opacity-0 translate-y-4 animate-[fadeInUp_0.6s_ease-out_0.3s_forwards]'
                }`}>
                  <h4 className="font-cooper text-xl sm:text-2xl font-normal text-white mb-2">
                    {currentService.title}
                  </h4>
                  <p className="font-sans text-sm sm:text-base text-white/90">
                    Professional NDIS support services
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}