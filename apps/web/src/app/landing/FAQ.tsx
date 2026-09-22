'use client'

import { useState, useMemo } from 'react'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { generateFAQSchema } from '@/lib/schema/faq-schema'

interface FAQItem {
  question: string
  answer: string
}

interface FAQSection {
  title: string
  items: FAQItem[]
}

export default function FAQ() {
  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({})

  // Initialize scroll animations
  useScrollAnimation()

  const toggleItem = (key: string) => {
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const faqSections: FAQSection[] = [
    {
      title: "Ready To Join The Team?",
      items: [
        {
          question: "Who can apply?",
          answer: "We welcome applications from qualified support workers, caregivers, and professionals who are passionate about helping others. All applicants must have relevant qualifications and pass background checks."
        },
        {
          question: "How do I apply? What's the process?",
          answer: "You can apply through our online portal. The process includes submitting your application, providing qualifications and references, completing background checks, and attending an interview."
        },
        {
          question: "Do you hire employees or contractors?",
          answer: "We work with both employees and independent contractors, depending on the role and your preferences. We'll discuss the best arrangement during the application process."
        },
        {
          question: "How are rates and payments handled?",
          answer: "We offer competitive rates that are transparent and fair. Payments are processed weekly through direct deposit. All rates are clearly outlined in your agreement."
        }
      ]
    },
    {
      title: "Or Looking For Support?",
      items: [
        {
          question: "Are your services available throughout Australia?",
          answer: "Yes, we provide services across Australia. Our network of support workers ensures we can match you with qualified professionals in your area."
        },
        {
          question: "What services do you offer?",
          answer: "We offer a comprehensive range of support services including personal care, domestic assistance, community participation, transport, and specialized disability support."
        },
        {
          question: "Can I meet the worker before services begin?",
          answer: "Absolutely! We encourage meet-and-greet sessions before services begin. This helps ensure a good match between you and your support worker."
        },
        {
          question: "Can I use my NDIS plan?",
          answer: "Yes, we are NDIS registered and can work with agency-managed, plan-managed, and self-managed participants. We'll help you navigate your NDIS funding."
        },
        {
          question: "How do you screen your workers?",
          answer: "All our support workers undergo comprehensive background checks, qualification verification, reference checks, and ongoing training to ensure the highest standards of care."
        }
      ]
    }
  ]

  // Flatten all FAQ items for schema generation
  const allFAQItems = useMemo(() =>
    faqSections.flatMap(section => section.items),
    [faqSections]
  )

  const faqSchema = useMemo(() => generateFAQSchema(allFAQItems), [allFAQItems])

  return (
    <section className="bg-[#F8F9FA] pt-4 pb-12 sm:py-16 md:py-20 lg:py-24 overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4 sm:py-0">
        <div className="text-center mb-8 sm:mb-12">
          <p className="font-sans text-xs sm:text-sm md:text-base font-medium uppercase tracking-wide mb-3 sm:mb-4 scroll-animate fade-up">
            <span className="bg-[#F8E8D8] px-2 py-1 rounded-lg text-[#0C1628]">FAQs</span>
          </p>
          <h2 className="section-title mb-2 sm:mb-4 scroll-animate fade-up" data-delay="1">
            Frequently Asked Questions
          </h2>
          <p className="font-sans text-base sm:text-lg text-[#0C1628] leading-relaxed max-w-2xl mx-auto scroll-animate fade-up" data-delay="2">
            Find answers to common questions about our services and how we can support you.
          </p>
        </div>

        <div className="space-y-8 sm:space-y-12">
          {faqSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm scroll-animate fade-up" data-delay={sectionIndex + 3}>
              <h3 className="font-cooper text-2xl sm:text-3xl font-normal text-[#0C1628] mb-6 sm:mb-8 text-center">
                {section.title}
              </h3>

              <div className="space-y-4">
                {section.items.map((item, itemIndex) => {
                  const key = `${sectionIndex}-${itemIndex}`
                  const isOpen = openItems[key]

                  return (
                    <div key={itemIndex} className="border-b border-gray-200 last:border-b-0">
                      <button
                        onClick={() => toggleItem(key)}
                        className="w-full flex items-center justify-between py-4 text-left hover:text-[#B1C3CD] transition-colors duration-200"
                      >
                        <span className="font-sans text-base sm:text-lg font-medium text-[#0C1628] pr-4">
                          {item.question}
                        </span>
                        <div className="flex-shrink-0">
                          <div className={`w-6 h-6 flex items-center justify-center transition-transform duration-200 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              className="text-[#0C1628]"
                            >
                              <path
                                d="M8 1V15M1 8H15"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                        </div>
                      </button>

                      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-4' : 'max-h-0'}`}>
                        <p className="font-sans text-sm sm:text-base text-[#0C1628] leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8 sm:mt-12 scroll-animate fade-up" data-delay="5">
          <p className="font-sans text-base sm:text-lg text-[#0C1628] mb-4">
            Didn't find the answer you are looking for?{' '}
            <a href="/contact" className="text-[#0C1628] underline font-semibold hover:text-[#B1C3CD] transition-colors">
              Contact our support
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}