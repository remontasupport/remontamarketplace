'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MagnifyingGlassIcon, UserGroupIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import '../styles/how-it-works.css'

const steps = [
  {
    step: 1,
    title: 'Fill Out the Form',
    description: 'Tell us about your NDIS support needs. It takes just a few minutes to complete the form with your requirements and preferences.',
    image: '/images/fill-up-form.jpg',
    icon: MagnifyingGlassIcon,
  },
  {
    step: 2,
    title: 'We Match You',
    description: 'Our platform connects you with verified, qualified professionals in your area who specialize in exactly what you need.',
    image: '/images/good-match.jpg',
    icon: UserGroupIcon,
  },
  {
    step: 3,
    title: 'Service Provided',
    description: 'Choose your preferred professional, schedule the work, and enjoy peace of mind knowing your project is in expert hands.',
    image: '/images/get-it-done.jpg',
    icon: CalendarDaysIcon,
  },
]

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(1)
  const currentStep = steps.find(s => s.step === activeStep) || steps[0]

  return (
    <section className="how-it-works-section">
      <div className="how-it-works-container">
        {/* Header */}
        <div className="how-it-works-header">
          <div className="how-it-works-badge-wrapper">
            <span className="section-badge">HOW IT WORKS</span>
          </div>
          <h2 className="section-title">
            How Easy Can Finding NDIS Support Be?
          </h2>
        </div>

        {/* Two Column Layout */}
        <div className="how-it-works-content">
          {/* Left: Steps List */}
          <div className="how-it-works-steps-list">
            {steps.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.step}
                  onClick={() => setActiveStep(item.step)}
                  className={`how-it-works-step-card ${activeStep === item.step ? 'active' : ''}`}
                >
                  <div className="step-card-icon">
                    <Icon className="step-icon" />
                  </div>
                  <div className="step-card-content">
                    <h3 className="step-card-title">
                      {item.step}. {item.title}
                    </h3>
                    <p className="step-card-description">
                      {item.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Right: Active Step Image */}
          <div className="how-it-works-image-display">
            <div className="image-display-wrapper">
              <Image
                src={currentStep.image}
                alt={currentStep.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 600px"
                className="display-image"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
