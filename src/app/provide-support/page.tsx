import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import Footer from "@/components/ui/layout/Footer"
import JobsSection from "@/components/sections/JobsSection"

export const metadata: Metadata = {
  title: 'Become an NDIS Support Worker | Provide Support on Remonta',
  description: 'Join thousands of independent support workers on Remonta. Choose your own hours, set competitive rates, and build your own business helping people with disabilities.',
  keywords: ['support worker jobs', 'NDIS jobs', 'disability support jobs', 'independent support worker', 'become support worker', 'care worker jobs'],
  openGraph: {
    title: 'Become an NDIS Support Worker | Remonta',
    description: 'Choose your own hours, set competitive rates, and build your own support work business. Join Remonta today.',
    url: 'https://www.remontaservices.com.au/provide-support',
    siteName: 'Remonta Services',
    images: [
      {
        url: '/images/supportWorker.jpg',
        width: 1200,
        height: 630,
        alt: 'Become an NDIS Support Worker',
      },
    ],
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Become an NDIS Support Worker | Remonta',
    description: 'Choose your own hours, set competitive rates, and build your own support work business.',
    images: ['/images/supportWorker.jpg'],
  },
}

export default function JobsPage() {

  return (
    <div className="jobs-container">
      {/* Hero Section */}
      <section className="jobs-hero-section">
        <div className="jobs-hero-container">
          <div className="jobs-hero-grid">
            {/* Left Column - Content */}
            <div className="jobs-hero-content">
              <h1 className="jobs-hero-title">
                Provide Independent <span className="jobs-hero-highlight">Support Work</span> on Remonta
              </h1>
              <p className="jobs-hero-description">
                Support workers have a real impact on people’s lives. It’s a meaningful job that comes with both purpose and responsibility. Find out what being an independent support worker could mean for you.
              </p>
              <Link href="/registration/worker" className="jobs-hero-button">
                Get Started
              </Link>
            </div>

            {/* Right Column - Image */}
            <div className="jobs-hero-image-wrapper">
              <div className="jobs-hero-image-container">
                <div className="jobs-hero-image">
                  <Image
                    src="/images/supportWorker.jpg"
                    alt="Support worker helping someone"
                    fill
                    className="object-cover object-center"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                    style={{ borderRadius: '2rem' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Jobs Section */}
      <JobsSection />

      {/* Benefits Section */}
      <section className="jobs-benefits-section">
        <div className="jobs-benefits-container">
          <div className="jobs-benefits-grid">
            {/* Left Column - Heading */}
            <div className="jobs-benefits-content">
              <h2 className="jobs-benefits-title">
                Is providing support work on Remonta right for you?
              </h2>
              <p className="jobs-benefits-description">
                Join thousands of support workers who have built successful careers helping others while enjoying the flexibility and independence they deserve.
              </p>
              <p className="jobs-benefits-cta">
                Ready to take control of your career? Start your journey with Remonta today and discover the difference independent support work can make.
              </p>
            </div>

            {/* Right Column - Feature Cards */}
            <div className="jobs-benefits-cards">
              {/* Card 1 */}
              <div className="jobs-benefit-card">
                <div className="jobs-benefit-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="jobs-benefit-title">Choose your own hours</h3>
                <p className="jobs-benefit-text">
                  Work when it suits you. Set your own schedule and maintain the perfect work-life balance.
                </p>
              </div>

              {/* Card 2 */}
              <div className="jobs-benefit-card">
                <div className="jobs-benefit-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="jobs-benefit-title">Competitive Pay</h3>
                <p className="jobs-benefit-text">
                  Earn competitive rates with transparent pricing and regular payment processing.
                </p>
              </div>

              {/* Card 3 */}
              <div className="jobs-benefit-card">
                <div className="jobs-benefit-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="jobs-benefit-title">Apply for your preferred support worker jobs</h3>
                <p className="jobs-benefit-text">
                  Browse opportunities and choose the roles that match your skills and interests.
                </p>
              </div>

              {/* Card 4 */}
              <div className="jobs-benefit-card">
                <div className="jobs-benefit-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="jobs-benefit-title">Build your own business</h3>
                <p className="jobs-benefit-text">
                  Grow your client base, set your rates, and build a sustainable support work business.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="jobs-testimonial-section">
        <div className="jobs-testimonial-container">
          {/* Section Header */}
          <div className="jobs-testimonial-header">
            <h2 className="jobs-testimonial-heading">
              Support work is built on empathy, dedication, and responsibility.
            </h2>
            <p className="jobs-testimonial-subheading">
              Your role as a support worker makes a real difference in people's lives.
            </p>
          </div>

          <div className="jobs-testimonial-grid">
            {/* Left Column - Story Card */}
            <div className="jobs-testimonial-story-card">
              <div className="jobs-testimonial-image-wrapper">
                <Image
                  src="/images/workerTestimonial.jpg"
                  alt="Support worker testimonial"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  quality={100}
                  priority
                />
              </div>
            </div>

            {/* Right Column - Testimonial Quote */}
            <div className="jobs-testimonial-quote-card">
           
              <blockquote className="jobs-testimonial-quote">
                "Working with Remonta has transformed my career. I have the freedom to choose my schedule while making a real difference in people's lives every day."
              </blockquote>
              <p className="jobs-testimonial-author">Sarah Thompson</p>
            </div>
          </div>
        </div>
      </section>

      {/* Qualifications Section */}
      <section className="jobs-qualifications-section">
        <div className="jobs-qualifications-container">
          {/* Section Header */}
          <div className="jobs-qualifications-header">
            <h2 className="jobs-qualifications-heading">
              What kind of support work can you offer on Remonta?
            </h2>
            <p className="jobs-qualifications-subheading">
              The services you can provide to clients on Remonta depend on your qualifications and experience.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="jobs-qualifications-grid">
            {/* Left Card - Qualified */}
            <div className="jobs-qualifications-card jobs-qualifications-card-qualified">
              <h3 className="jobs-qualifications-card-title">
                Are you a qualified support worker?
              </h3>

              <div className="jobs-qualifications-card-content">
                <p className="jobs-qualifications-card-subtitle">This means you are either:</p>
                <ul className="jobs-qualifications-list">
                  <li>A Registered or Enrolled Nurse</li>
                  <li>An allied health professional</li>
                  <li>A qualified personal care worker</li>
                </ul>

                <p className="jobs-qualifications-card-text">
                  In-demand services on Remonta include nursing, personal care, psychology, occupational therapy,
                  speech therapy, and physiotherapy. If you are qualified to provide any of these services and can
                  supply the necessary documentation, you may be able to find work fast on the Remonta platform.
                </p>
              </div>
            </div>

            {/* Right Card - Unqualified */}
            <div className="jobs-qualifications-card jobs-qualifications-card-unqualified">
              <h3 className="jobs-qualifications-card-title">
                Are you a support worker without any formal qualifications?
              </h3>

              <div className="jobs-qualifications-card-content">
                <p className="jobs-qualifications-card-subtitle">You can provide support for:</p>
                <ul className="jobs-qualifications-list">
                  <li>Daily living activities</li>
                  <li>Social and community activities</li>
                  <li>Housework, transportation, and meal preparation</li>
                </ul>

                <p className="jobs-qualifications-card-subtitle-secondary">
                  Enhance skills for support work job opportunities
                </p>

                <p className="jobs-qualifications-card-text">
                  Complete accredited training to increase your skills and provide additional services to your clients.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="jobs-cta-section">
        <div className="jobs-cta-container">
          <div className="jobs-cta-card">
            {/* Left Side - Content */}
            <div className="jobs-cta-content">
              <h2 className="jobs-cta-title">
                I'm ready to become an independent support worker on Remonta
              </h2>
              <p className="jobs-cta-description">
                If you have all your documentation ready and you understand what's required of you as a support worker on Remonta, sign up below.
              </p>
              <Link href="/registration/worker" className="jobs-cta-button">
                Get started
              </Link>
            </div>

            {/* Right Side - Image */}
            <div className="jobs-cta-image-wrapper">
              <Image
                src="/images/readyToSupport.jpg"
                alt="Support worker with client"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                quality={100}
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
