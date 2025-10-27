'use client'

import Link from 'next/link'
import Image from 'next/image'
import Footer from "@/components/ui/layout/Footer"
import '@/app/styles/find-support.css'
import '@/app/styles/provide-support.css'
import {
 UserGroupIcon,
 DocumentTextIcon,
 ScissorsIcon,
 ShoppingBagIcon,
 HomeIcon,
 HeartIcon,
 WrenchScrewdriverIcon,
 BoltIcon,
 CakeIcon,
 TruckIcon,
 BuildingOfficeIcon,
 SparklesIcon,
 HandRaisedIcon,
 ArrowsUpDownIcon,
 UserIcon,
 BeakerIcon,
 ClipboardDocumentCheckIcon,
 CubeIcon,
 ChartBarIcon,
 HomeModernIcon,
 ChatBubbleLeftIcon,
 AcademicCapIcon
} from '@heroicons/react/24/outline'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

export default function FindSupportPage() {
 const sliderItems = [
  {
   title: 'Daily living and community support',
   description: 'Connect with support workers who can join you or your loved one in enjoying social, community, or recreational activities.',
   image: '/images/homeMaintenance.jpg',
   imageAlt: 'Daily living and community support',
   services: [
    {
     icon: UserGroupIcon,
     title: 'Community outings and activities'
    },
    {
     icon: DocumentTextIcon,
     title: 'Personal admin'
    },
    {
     icon: ScissorsIcon,
     title: 'Gardening'
    },
    {
     icon: ShoppingBagIcon,
     title: 'Shopping'
    },
    {
     icon: HomeIcon,
     title: 'Housework'
    },
    {
     icon: HeartIcon,
     title: 'Social support'
    },
    {
     icon: WrenchScrewdriverIcon,
     title: 'House maintenance'
    },
    {
     icon: BoltIcon,
     title: 'Sport and exercise'
    },
    {
     icon: CakeIcon,
     title: 'Meal preparation'
    },
    {
     icon: TruckIcon,
     title: 'Transport'
    }
   ]
  },
  {
   title: 'Personal support',
   description: 'Find support workers to help with hygiene, mobility, medication, and other personal care needs.',
   image: '/images/personalCare.jpg',
   imageAlt: 'Personal care services',
   services: [
    {
     icon: BuildingOfficeIcon,
     title: 'Toileting'
    },
    {
     icon: SparklesIcon,
     title: 'Showering, dressing and grooming'
    },
    {
     icon: HandRaisedIcon,
     title: 'Light massage'
    },
    {
     icon: ArrowsUpDownIcon,
     title: 'Hoist and transfer'
    },
    {
     icon: BoltIcon,
     title: 'Exercise assistance'
    },
    {
     icon: UserIcon,
     title: 'Manual handling and mobility'
    },
    {
     icon: BeakerIcon,
     title: 'Medication assistance'
    }
   ]
  },
  {
   title: 'Nursing',
   description: 'Our qualified nurses offer professional and specialised care tailored to your or your loved one’s needs.',
   image: '/images/nursing.jpg',
   imageAlt: 'Nursing services',
   services: [
    {
     icon: HeartIcon,
     title: 'Wound care'
    },
    {
     icon: ClipboardDocumentCheckIcon,
     title: 'Continence assessment and management'
    },
    {
     icon: BeakerIcon,
     title: 'Catheter care'
    },
    {
     icon: HomeModernIcon,
     title: 'Pre- and post-acute hospital care'
    },
    {
     icon: HandRaisedIcon,
     title: 'Respiratory care'
    },
    {
     icon: CubeIcon,
     title: 'Medication management'
    },
    {
     icon: ChartBarIcon,
     title: 'Vital signs monitoring'
    }
   ]
  },
  {
   title: 'Therapy and wellness services',
   description: 'Connect with qualified professionals who can offer occupational therapy, physiotherapy, and more.',
   image: '/images/psychology.jpg',
   imageAlt: 'Allied health services',
   services: [
    {
     icon: UserIcon,
     title: 'Occupational therapy'
    },
    {
     icon: BoltIcon,
     title: 'Physiotherapy'
    },
    {
     icon: ChatBubbleLeftIcon,
     title: 'Speech pathology'
    },
    {
     icon: AcademicCapIcon,
     title: 'Psychology'
    }
   ]
  },
  {
   title: 'Fitness and exercise services',
   description: 'Find support workers who can help you stay active and achieve your fitness goals through personalised exercise programs.',
   image: '/images/fitnessSupport.jpg',
   imageAlt: 'Fitness and exercise services',
   services: [
    {
     icon: BoltIcon,
     title: 'Personal training'
    },
    {
     icon: UserGroupIcon,
     title: 'Group fitness classes'
    },
    {
     icon: HeartIcon,
     title: 'Gym assistance'
    },
    {
     icon: TruckIcon,
     title: 'Swimming support'
    },
    {
     icon: HandRaisedIcon,
     title: 'Yoga and stretching'
    },
    {
     icon: BoltIcon,
     title: 'Sports participation'
    },
    {
     icon: ArrowsUpDownIcon,
     title: 'Balance and coordination'
    }
   ]
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
       <h3 className="find-support-testimonial-name">SARAH MITCHELL</h3>
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
   <section className="find-support-services-section">
    <div className="find-support-services-container">
     {/* Section Header with Navigation */}
     <div className="find-support-services-header">
      <div className="find-support-services-header-content">
       <h2 className="find-support-services-section-title">
        Find the right services for you
       </h2>
       <p className="find-support-services-section-description">
        On Remonta, you can choose the services that suit your goals and support needs.
       </p>
      </div>
      <div className="find-support-services-navigation">
       <button className="find-support-services-button-prev">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
       </button>
       <button className="find-support-services-button-next">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
       </button>
      </div>
     </div>

     {/* Services Slider */}
     <Swiper
      modules={[Navigation, Pagination]}
      spaceBetween={30}
      slidesPerView={1}
      navigation={{
       prevEl: '.find-support-services-button-prev',
       nextEl: '.find-support-services-button-next',
      }}
      pagination={{ clickable: true }}
      className="find-support-services-swiper"
     >
      {sliderItems.map((item, slideIndex) => (
       <SwiperSlide key={slideIndex}>
        <div className="find-support-services-grid">
         {/* Left Column - Image */}
         <div className="find-support-services-image-wrapper">
          <Image
           src={item.image}
           alt={item.imageAlt}
           fill
           className="object-cover"
           sizes="(max-width: 768px) 100vw, 50vw"
           quality={100}
          />
         </div>

         {/* Right Column - Content */}
         <div className="find-support-services-content">
          <h3 className="find-support-services-title">
           {item.title}
          </h3>
          <p className="find-support-services-description">
           {item.description}
          </p>

          {/* Services List */}
          <ul className="find-support-services-list">
           {item.services.map((service, serviceIndex) => {
            const IconComponent = service.icon
            return (
             <li key={serviceIndex} className="find-support-services-list-item">
              <div className="find-support-services-icon-wrapper">
               <IconComponent className="find-support-services-icon" />
              </div>
              <span>{service.title}</span>
             </li>
            )
           })}
          </ul>
         </div>
        </div>
       </SwiperSlide>
      ))}
     </Swiper>
    </div>
   </section>

   {/* How Remonta Works Section */}
   <section className="find-support-how-it-works-section">
    <div className="find-support-how-it-works-container">
     {/* Section Header */}
     <div className="find-support-how-it-works-header">
      <h2 className="find-support-how-it-works-title">
       How Remonta works for people receiving support
      </h2>
      <p className="find-support-how-it-works-description">
       If you’re a person with a disability, you have the freedom to choose who supports you and when.
      </p>
     </div>

     {/* Cards Grid */}
     <div className="find-support-how-it-works-grid">
      {/* Card 1 */}
      <div className="find-support-how-it-works-card">
       <div className="find-support-how-it-works-number">1</div>
       <h3 className="find-support-how-it-works-card-title">
        Choose the services that meet your needs
       </h3>
       <p className="find-support-how-it-works-card-text">
        Select the services you want, whether it’s help with daily care, preparing meals, getting around the community, or other supports that make life easier.
       </p>
      </div>

      {/* Card 2 */}
      <div className="find-support-how-it-works-card">
       <div className="find-support-how-it-works-number">2</div>
       <h3 className="find-support-how-it-works-card-title">
        Book a support worker
       </h3>
       <p className="find-support-how-it-works-card-text">
        Agree on job details with a support worker, including rates, and organise a time for the session.
       </p>
      </div>

      {/* Card 3 */}
      <div className="find-support-how-it-works-card">
       <div className="find-support-how-it-works-number">3</div>
       <h3 className="find-support-how-it-works-card-title">
        Manage your ongoing support
       </h3>
       <p className="find-support-how-it-works-card-text">
        Live your kind of independence knowing you're in charge of your support with Remonta.
       </p>
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
