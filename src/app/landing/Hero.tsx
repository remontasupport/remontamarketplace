'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import '@/styles/hero.css'

export default function Hero() {
  // Initialize scroll animations
  useScrollAnimation()

  return (
    <section className="hero-section">
      {/* Background Image Slider */}
      <div className="hero-background">
        <div className="hero-background-slider">
          <Image
            src="/hero-image.png"
            alt="Support worker embracing person with disability showing care and connection"
            fill
            className="hero-background-image hero-slide-1"
            priority
            sizes="100vw"
          />
          <Image
            src="/hero-image-2.png"
            alt="NDIS support and care services"
            fill
            className="hero-background-image hero-slide-2"
            sizes="100vw"
          />
          <Image
            src="/hero-image-3.png"
            alt="Quality NDIS care and support"
            fill
            className="hero-background-image hero-slide-3"
            sizes="100vw"
          />
        </div>
        <div className="hero-overlay"></div>
      </div>

      {/* Content */}
      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-title scroll-animate fade-up">
            Your Trusted, Ethical and Reliable Care Matching Platform
          </h1>

          <p className="hero-description scroll-animate fade-up" data-delay="1">
           Getting the right support starts with the right match.
           We help connect people with trusted support workers and service providers in their local area.
          </p>

          {/* Buttons */}
          <div className="hero-buttons scroll-animate fade-up" data-delay="2">
            <Link
              href="/find-support"
              className="hero-button hero-button-primary"
            >
              Find support
            </Link>
            <Link
              href="/provide-support"
              className="hero-button hero-button-secondary"
            >
              Provide support
            </Link>
          </div>

          {/* NDIS Badge - Desktop */}
          <div className="hero-ndis-badge-desktop scroll-animate fade-up" data-delay="3">
            <div className="hero-ndis-content">
              <Image
                src="/logo/ndisLogo.svg"
                alt="NDIS Logo"
                width={150}
                height={100}
                className="hero-ndis-logo-desktop"
              />
              <div className="hero-ndis-text-desktop">
                <span>Care Matching</span>
                <span>Platform</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}