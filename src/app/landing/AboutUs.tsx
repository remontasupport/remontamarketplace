'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import '@/styles/about-us.css'

export default function AboutUs() {
  // Initialize scroll animations
  useScrollAnimation()

  return (
    <section className="about-section" id="about">
      <div className="about-container">
        {/* Header - Badge and Title */}
        <div className="about-header">
          {/* Section Badge */}
          <div className="about-badge-wrapper scroll-animate fade-up">
            <span className="section-badge">ABOUT US</span>
          </div>

          {/* Main Heading */}
          <h2 className="section-title scroll-animate fade-up" data-delay="1">
            A Better Way to Find the Right Support
          </h2>
        </div>

        {/* Image Column */}
        <div className="about-image-column scroll-animate fade-left" data-delay="2">
          <div className="about-image-wrapper">
            {/* NDIS Logo Badge */}
            <div className="about-ndis-badge">
              <Image
                src="/images/remonta-ndis.png"
                alt="NDIS Registered Provider"
                width={500}
                height={500}
                className="ndis-logo"
              />
            </div>

            {/* Main Image */}
            <div className="about-main-image">
              <Image
                src="/images/about-main-image.png"
                alt="NDIS support workers helping participants"
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="about-image"
                priority
              />
            </div>
          </div>
        </div>

        {/* Content Column */}
        <div className="about-content-column">
          <div className="about-content">
            {/* Desktop Badge and Title (hidden on mobile) */}
            <div className="about-desktop-header scroll-animate fade-up" aria-hidden="true">
              <div className="about-badge-wrapper">
                <span className="section-badge">ABOUT US</span>
              </div>
              <div className="section-title">
                A Better Way to Find the Right Support

              </div>
            </div>

            {/* Description */}
            <p className="about-description scroll-animate fade-up" data-delay="1">
              Remonta helps bring participants, families, support coordinators, and support workers together in a way that feels simple and reliable. 
              As an NDIS-registered organisation, we focus on making sure connections are safe, compliant, and built around real needs, while giving people the freedom to choose the support that works best for them :
            </p>

            {/* Services List */}
            <div className="about-services scroll-animate fade-up" data-delay="2">

              <ul className="about-services-list">
                <li className="about-service-item">NDIS Registered</li>
                <li className="about-service-item">Qualified & Compliant Team</li>
                <li className="about-service-item">Australia Wide Coverage</li>
              </ul>
            </div>

            {/* CTA Buttons */}
            <div className="about-cta-buttons scroll-animate fade-up" data-delay="3">
              <Link href="/registration/user" className="btn btn-primary">
                 Get started with us today
                <svg className="btn-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>

            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
