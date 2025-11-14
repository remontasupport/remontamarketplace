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
      <div className="hero-container">
        <div className="hero-grid">
          {/* Left Column - Content */}
          <div className="hero-content">
            <h1 className="hero-title scroll-animate fade-up">
              Your <span className="hero-highlight">Trusted, Ethical</span>
              {' '}and <span className="hero-highlight hero-highlight-mt">Reliable</span> NDIS
              service provider
            </h1>

            <p className="hero-description scroll-animate fade-up" data-delay="1">
              Whether you need support or want to offer it, our platform makes the process simple and secure.
            </p>

            {/* Buttons */}
            <div className="hero-buttons scroll-animate fade-up" data-delay="2">
              <Link
                href="/registration/user"
                className="hero-button hero-button-primary"
              >
                Find support
              </Link>
              <Link
                href="/registration/worker"
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
                  <span>Registered </span>
                  <span>NDIS provider</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="hero-image-column">
            <div className="hero-image-wrapper scroll-animate fade-right" data-delay="2">
              <div className="hero-image-container">
                <Image
                  src="/hero-image.png"
                  alt="Support worker embracing person with disability showing care and connection"
                  fill
                  className="hero-image"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}