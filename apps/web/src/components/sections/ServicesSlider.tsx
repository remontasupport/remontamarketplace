'use client'

import Image from 'next/image'
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

const sliderItems = [
  {
    title: 'Daily living and community support',
    description: 'Connect with support workers who can join you or your loved one in enjoying social, community, or recreational activities.',
    image: '/images/homeMaintenance.jpg',
    imageAlt: 'Daily living and community support',
    services: [
      { icon: UserGroupIcon, title: 'Community outings and activities' },
      { icon: DocumentTextIcon, title: 'Personal admin' },
      { icon: ScissorsIcon, title: 'Gardening' },
      { icon: ShoppingBagIcon, title: 'Shopping' },
      { icon: HomeIcon, title: 'Housework' },
      { icon: HeartIcon, title: 'Social support' },
      { icon: WrenchScrewdriverIcon, title: 'House maintenance' },
      { icon: BoltIcon, title: 'Sport and exercise' },
      { icon: CakeIcon, title: 'Meal preparation' },
      { icon: TruckIcon, title: 'Transport' }
    ]
  },
  {
    title: 'Personal support',
    description: 'Find support workers to help with hygiene, mobility, medication, and other personal care needs.',
    image: '/images/personalCare.jpg',
    imageAlt: 'Personal care services',
    services: [
      { icon: BuildingOfficeIcon, title: 'Toileting' },
      { icon: SparklesIcon, title: 'Showering, dressing and grooming' },
      { icon: HandRaisedIcon, title: 'Light massage' },
      { icon: ArrowsUpDownIcon, title: 'Hoist and transfer' },
      { icon: BoltIcon, title: 'Exercise assistance' },
      { icon: UserIcon, title: 'Manual handling and mobility' },
      { icon: BeakerIcon, title: 'Medication assistance' }
    ]
  },
  {
    title: 'Nursing',
    description: 'Our qualified nurses offer professional and specialised care tailored to your or your loved one\'s needs.',
    image: '/images/nursing.jpg',
    imageAlt: 'Nursing services',
    services: [
      { icon: HeartIcon, title: 'Wound care' },
      { icon: ClipboardDocumentCheckIcon, title: 'Continence assessment and management' },
      { icon: BeakerIcon, title: 'Catheter care' },
      { icon: HomeModernIcon, title: 'Pre- and post-acute hospital care' },
      { icon: HandRaisedIcon, title: 'Respiratory care' },
      { icon: CubeIcon, title: 'Medication management' },
      { icon: ChartBarIcon, title: 'Vital signs monitoring' }
    ]
  },
  {
    title: 'Therapy and wellness services',
    description: 'Connect with qualified professionals who can offer occupational therapy, physiotherapy, and more.',
    image: '/images/psychology.jpg',
    imageAlt: 'Allied health services',
    services: [
      { icon: UserIcon, title: 'Occupational therapy' },
      { icon: BoltIcon, title: 'Physiotherapy' },
      { icon: ChatBubbleLeftIcon, title: 'Speech pathology' },
      { icon: AcademicCapIcon, title: 'Psychology' }
    ]
  },
  {
    title: 'Fitness and exercise services',
    description: 'Find support workers who can help you stay active and achieve your fitness goals through personalised exercise programs.',
    image: '/images/fitnessSupport.jpg',
    imageAlt: 'Fitness and exercise services',
    services: [
      { icon: BoltIcon, title: 'Personal training' },
      { icon: UserGroupIcon, title: 'Group fitness classes' },
      { icon: HeartIcon, title: 'Gym assistance' },
      { icon: TruckIcon, title: 'Swimming support' },
      { icon: HandRaisedIcon, title: 'Yoga and stretching' },
      { icon: BoltIcon, title: 'Sports participation' },
      { icon: ArrowsUpDownIcon, title: 'Balance and coordination' }
    ]
  }
]

export default function ServicesSlider() {
  return (
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
            <button className="find-support-services-button-prev" aria-label="Previous slide">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="find-support-services-button-next" aria-label="Next slide">
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
  )
}
