'use client'
import Image from 'next/image'
import { useState } from 'react'
import '@/app/styles/services.css'

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
    imageAlt: "Professional cleaning services for NDIS participants"
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
    imageAlt: "Home and yard maintenance services"
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
    imageAlt: "Fitness and rehabilitation support"
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
    imageAlt: "Therapeutic support services"
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
    imageAlt: "Nursing and clinical care services"
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
    imageAlt: "Home modification services"
  }
]

export default function Services() {
  const [activeService, setActiveService] = useState<number>(1)
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false)

  const handleServiceChange = (id: number) => {
    if (id === activeService) return

    setIsTransitioning(true)
    setTimeout(() => {
      setActiveService(id)
      setIsTransitioning(false)
    }, 300)
  }

  const currentService = services.find(service => service.id === activeService) || services[0]

  return (
    <section id="services" className="services-section">
      <div className="services-container">
        {/* Header */}
        <div className="services-header">
          <p className="font-sans text-xs sm:text-sm md:text-base font-medium uppercase tracking-wide mb-3 sm:mb-4">
            <span className="services-badge">SERVICES</span>
          </p>
          <h2 className="section-title">
            This Is How We Create Transformation
          </h2>
          <p className="services-description">
            We offer comprehensive NDIS support services designed to empower participants to live independently and achieve their goals.
          </p>
        </div>

        {/* Mobile Accordion & Desktop Tabs */}
        <div className="services-tabs-container">
          {/* Mobile Accordion */}
          <div className="services-mobile-accordion">
            {services.map((service) => (
              <div key={service.id} className="services-accordion-item">
                <button
                  onClick={() => handleServiceChange(service.id)}
                  className={`services-accordion-button ${activeService === service.id ? 'active' : ''}`}
                >
                  <span>{service.title}</span>
                  <svg
                    className={`services-accordion-icon ${activeService === service.id ? 'rotate' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expandable Content */}
                <div className={`services-accordion-content ${activeService === service.id ? 'expanded' : ''}`}>
                  <div className="services-accordion-inner">
                    <p className="services-content-description">
                      {service.content}
                    </p>
                    <p className="services-content-subtitle">
                      What we offer:
                    </p>
                    <ul className="services-bullet-list">
                      {service.bulletPoints.map((point, index) => (
                        <li key={index} className="services-bullet-item">
                          <div className="services-bullet-icon"></div>
                          <span className="services-bullet-text">{point}</span>
                        </li>
                      ))}
                    </ul>
                    {/* Mobile Image */}
                    <div className="services-image-container mobile-image">
                      <Image
                        src={service.image}
                        alt={service.imageAlt}
                        fill
                        className="services-image"
                        priority
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Tabs Grid */}
          <div className="services-tabs-grid">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => handleServiceChange(service.id)}
                className={`services-tab ${activeService === service.id ? 'active' : ''}`}
              >
                {service.title}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Content Section */}
        <div className="services-content-container">
          {/* Image */}
          <div
            key={`image-${activeService}`}
            className={`services-image-container desktop-image ${isTransitioning ? 'services-content-transitioning' : ''}`}
          >
            <Image
              src={currentService.image}
              alt={currentService.imageAlt}
              fill
              className="services-image"
              priority
            />
          </div>

          {/* Text Content */}
          <div
            key={`content-${activeService}`}
            className={`services-content-text ${isTransitioning ? 'services-content-transitioning' : ''}`}
          >
            <h3 className="services-content-title">
              {currentService.title}
            </h3>
            <p className="services-content-description">
              {currentService.content}
            </p>
            <p className="services-content-subtitle">
              What we offer:
            </p>
            <ul className="services-bullet-list">
              {currentService.bulletPoints.map((point, index) => (
                <li key={index} className="services-bullet-item">
                  <div className="services-bullet-icon"></div>
                  <span className="services-bullet-text">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
