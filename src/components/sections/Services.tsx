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
    content: "Hands-on personal care, daily living assistance and social support to help you stay engaged and independent.",
    bulletPoints: [
      "Assistance with daily personal hygiene",
      "Support with grooming and dressing",
      "Medication reminders and management",
      "Mobility assistance and transfers"
    ],
    image: "/images/support-work.webp",
    imageAlt: "Support worker helping participant with personal care"
  },
  {
    id: 2,
    title: "Cleaning",
    content: "From routine tidies to deep and hazardous-grade cleans. Our pros handle kitchens, bathrooms, hoarder situations and more.",
    bulletPoints: [
      "Community outings and social activities",
      "Support accessing public transport",
      "Assistance with recreational programs",
      "Building social skills and connections"
    ],
    image: "/images/cleaning.webp",
    imageAlt: "Participants engaging in community activities"
  },
  {
    id: 3,
    title: "Home and Yard Maintenance",
    content: "Mowing, gardening, gutter clears, hedge trimming and general upkeep with all tools supplied for a safe, well-kept home.",
    bulletPoints: [
      "Cooking and meal preparation support",
      "Household management assistance",
      "Shopping and budgeting guidance",
      "Life skills development programs"
    ],
    image: "/images/homeyard.webp",
    imageAlt: "Support worker helping with daily living activities"
  },
  {
    id: 4,
    title: "Fitness and Rehabilitation",
    content: "Tailored exercise plans, mobility training and strength rehab delivered by qualified therapists to boost your wellbeing.",
    bulletPoints: [
      "Behavior support and intervention",
      "Therapy session assistance",
      "Complex medical care coordination",
      "Specialized equipment support"
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
      "Complex medical care coordination",
      "Specialized equipment support"
    ],
    image: "/images/therapueticSupport.webp",
    imageAlt: "Specialized support worker providing care"
  },
  {
    id: 6,
    title: "Nursing",
    content: "Hands-on personal care, daily living assistance and social support to help you stay engaged and independent.",
    bulletPoints: [
      "Behavior support and intervention",
      "Therapy session assistance",
      "Complex medical care coordination",
      "Specialized equipment support"
    ],
    image: "/images/nursing.webp",
    imageAlt: "Specialized support worker providing care"
  },
    {
    id: 7,
    title: "Home Modifications",
    content: "Accessible ramps, grab rails, bathroom adap­tations and small renovations designed for safety and ease of movement.",
    bulletPoints: [
      "Behavior support and intervention",
      "Therapy session assistance",
      "Complex medical care coordination",
      "Specialized equipment support"
    ],
    image: "/images/homemodify.webp",
    imageAlt: "Specialized support worker providing care"
  }
  
]

export default function Services() {
  const [openAccordion, setOpenAccordion] = useState<number>(1)

  const toggleAccordion = (id: number) => {
    setOpenAccordion(openAccordion === id ? 0 : id)
  }

  const currentService = services.find(service => service.id === openAccordion) || services[0]

  return (
    <section className="bg-white py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <p className="font-sans text-xs sm:text-sm md:text-base font-medium uppercase tracking-wide mb-3 sm:mb-4">
            <span className="bg-[#F8E8D8] px-2 py-0 rounded-lg text-[#0C1628]">SERVICES</span>
          </p>
          <h2 className="font-cooper text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-normal leading-tight text-[#0C1628] mb-6 sm:mb-8">
            This Is How We Create Transformation
          </h2>
          <p className="font-sans text-base sm:text-lg lg:text-xl text-[#0C1628] leading-relaxed max-w-4xl mx-auto">
            We offer comprehensive NDIS support services designed to empower participants to live independently and achieve their goals.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Accordion Section */}
          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md"
              >
                <button
                  onClick={() => toggleAccordion(service.id)}
                  className="w-full flex items-center justify-between p-6 sm:p-8 bg-white hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center">
                    <div className="w-4 h-4 sm:w-10 sm:h-10 bg-[#B1C3CD] rounded-full flex items-center justify-center mr-4 sm:mr-6">
                      <div className="w-1 h-1 sm:w-4 sm:h-4 bg-[#0C1628] rounded-full"></div>
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
                      ? 'max-h-96 opacity-100'
                      : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="p-6 sm:p-8 pt-0 bg-gray-50">
                    <p className="font-sans text-base sm:text-lg text-[#0C1628] leading-relaxed mb-6">
                      {service.content}
                    </p>
                    <ul className="space-y-3">
                      {service.bulletPoints.map((point, index) => (
                        <li key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-[#B1C3CD] rounded-full mt-2 mr-3 flex-shrink-0"></div>
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

          {/* Image Section */}
          <div className="lg:sticky lg:top-8">
            <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden shadow-lg">
              <Image
                src={currentService.image}
                alt={currentService.imageAlt}
                fill
                className="object-cover transition-all duration-500 ease-in-out"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <h4 className="font-cooper text-xl sm:text-2xl font-normal text-white mb-2">
                  {currentService.title}
                </h4>
                <p className="font-sans text-sm sm:text-base text-white/90">
                  Professional NDIS support services
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}