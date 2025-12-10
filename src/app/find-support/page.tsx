import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import Footer from "@/components/ui/layout/Footer"
import HowItWorks from "@/components/sections/HowItWorks"
import ServicesSlider from "@/components/sections/ServicesSlider"
import '@/styles/find-support.css'
import '@/styles/provide-support.css'

export const metadata: Metadata = {
  title: 'Find NDIS Support Workers Near You | Remonta',
  description: 'Find local NDIS support workers that suit your needs and share your interests. Choose from personal care, daily living support, nursing, therapy services, and more.',
  keywords: ['find support workers', 'NDIS support', 'disability care', 'personal care', 'daily living assistance', 'nursing services', 'allied health'],
  openGraph: {
    title: 'Find NDIS Support Workers | Remonta',
    description: 'Connect with local support workers who understand your needs and share your interests. NDIS registered support services across Australia.',
    url: 'https://www.remontaservices.com.au/find-support',
    siteName: 'Remonta Services',
    images: [
      {
        url: '/images/findSupport-hero.jpg',
        width: 1200,
        height: 630,
        alt: 'Find NDIS Support Workers',
      },
    ],
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find NDIS Support Workers | Remonta',
    description: 'Connect with local support workers who understand your needs and share your interests.',
    images: ['/images/findSupport-hero.jpg'],
  },
}

export default function FindSupportPage() {
 const howItWorksSteps = [
  {
   number: 1,
   title: 'Choose the services that meet your needs',
   description: 'Select the services you want, whether it\'s help with daily care, preparing meals, getting around the community, or other supports that make life easier.'
  },
  {
   number: 2,
   title: 'Book a support worker',
   description: 'Agree on job details with a support worker, including rates, and organise a time for the session.'
  },
  {
   number: 3,
   title: 'Manage your ongoing support',
   description: 'Live your kind of independence knowing you\'re in charge of your support with Remonta.'
  }
 ]

 return (
  <div className="find-support-container">
   {/* Hero Section */}
   <section className="find-support-hero-section">
    <div className="find-support-hero-container">
     <div className="find-support-hero-grid">
      {/* Left Column - Content */}
      <div className="find-support-hero-content">
       <h1 className="find-support-hero-title">
        <span className="find-support-hero-highlight">Find Support Services</span> That Work For You
       </h1>
       <p className="find-support-hero-description">
        Find local support workers that suit your needs and share your interests.
       </p>

       {/* Feature List */}
       <ul className="find-support-hero-list">
        <li className="find-support-hero-list-item">
         <span className="find-support-hero-checkmark">
          <svg className="find-support-hero-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
         </span>
         <span className="find-support-hero-list-text">
          Choose from services, like daily care, meal preparation, and more
         </span>
        </li>
        <li className="find-support-hero-list-item">
         <span className="find-support-hero-checkmark">
          <svg className="find-support-hero-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
         </span>
         <span className="find-support-hero-list-text">
          We carefully match you with the right support worker
         </span>
        </li>
        <li className="find-support-hero-list-item">
         <span className="find-support-hero-checkmark">
          <svg className="find-support-hero-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
         </span>
         <span className="find-support-hero-list-text">
          Connect with verified workers who are ready to support you
         </span>
        </li>
       </ul>

       <Link href="/registration/user" className="find-support-hero-button">
        Find Support
       </Link>
      </div>

      {/* Right Column - Image */}
      <div className="find-support-hero-image-wrapper">
       <div className="find-support-hero-image-container">
        <div className="find-support-hero-image">
         <Image
          src="/images/findSupport-hero.jpg"
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

   {/* Testimonial Section */}
   <section className="find-support-testimonial-section">
    <div className="find-support-testimonial-container">
     <div className="find-support-testimonial-grid">
      {/* Left Column - Image */}
      <div className="find-support-testimonial-image-wrapper">
       <Image
        src="/images/findSupport-testimonial.jpg"
        alt="Happy participant with support worker"
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
        quality={100}
       />
      </div>

      {/* Right Column - Testimonial Card */}
      <div className="find-support-testimonial-card">
       <div className="find-support-testimonial-name">SARAH MITCHELL</div>
       <p className="find-support-testimonial-role">NDIS PARTICIPANT</p>

       {/* Star Rating */}
       <div className="find-support-testimonial-stars">
        {[...Array(5)].map((_, index) => (
         <svg key={index} className="find-support-testimonial-star" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
         </svg>
        ))}
       </div>

       {/* Testimonial Text */}
       <blockquote className="find-support-testimonial-quote">
        Finding the right support worker through Remonta has been life-changing. The team made it so easy to connect with someone who truly understands my needs and shares my interests. I finally have the independence and support I've been looking for.
       </blockquote>
      </div>
     </div>
    </div>
   </section>

   {/* Services Section */}
   <ServicesSlider />

   {/* How Remonta Works Section */}
   <HowItWorks
    title="How Remonta works for people receiving support"
    subtitle="If you're a person with a disability, you have the freedom to choose who supports you and when."
    steps={howItWorksSteps}
   />

   {/* CTA Section */}
   <section className="jobs-cta-section">
    <div className="jobs-cta-container">
     <div className="jobs-cta-card">
      {/* Left Side - Content */}
      <div className="jobs-cta-content">
       <h2 className="jobs-cta-title">
        Find support that suits your budget
       </h2>
       <p className="jobs-cta-description">
        Choose a support worker and mutually agree on rates.
       </p>
       <Link href="/registration/user" className="jobs-cta-button">
        Find Support
       </Link>
      </div>

      {/* Right Side - Image */}
      <div className="jobs-cta-image-wrapper">
       <Image
        src="/images/findSupport.jpg"
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
