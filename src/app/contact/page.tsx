'use client'

import { useState } from "react"
import Footer from "@/components/ui/layout/Footer"
import Image from "next/image"
import Link from "next/link"

export default function ContactPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="order-2 lg:order-1">
              <h1 className="text-4xl md:text-5xl lg:text-6xl text-[#0C1628] mb-6 font-cooper">
                Need Help
              </h1>

              <p className="text-lg md:text-xl text-[#0C1628] mb-4 font-poppins">
                Have any questions about Remonta?
              </p>

              <p className="text-lg  md:text-lg text-[#0C1628] mb-8 font-poppins">
                Get in touch with this form and we'll get back to you as soon as possible.
              </p>

              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center rounded-full px-8 py-3 bg-[#0C1628] text-white font-sans font-medium text-base hover:bg-[#B1C3CD] hover:text-[#0C1628] transition-colors duration-300"
              >
                Contact us
              </button>
            </div>

            {/* Right Image */}
            <div className="order-1 lg:order-2">
              <div className="relative w-full aspect-[3/3] lg:aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/contactMainPhoto.webp"
                  alt="Customer support representative"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        
      </section>

      {/* Feedback Section */}
      <section className="relative overflow-hidden bg-[#EDEFF3] py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Right Side - Content (First on mobile) */}
            <div className="text-left lg:pl-8 order-1 lg:order-2">
              <h2 className="text-3xl md:text-4xl lg:text-5xl text-[#0C1628] mb-6 font-cooper">
                Complaints, feedback, compliments?
              </h2>

              <p className="text-base md:text-lg text-[#0C1628] mb-8 font-poppins">
                If you would like to submit a complaint, feedback, or a compliment, please complete this form and our team will respond as soon as possible.
              </p>

              {/* Contact Information */}
              <div className="mt-12 flex flex-col sm:flex-row gap-6 sm:gap-8">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-[#0C1628]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                  </div>
                  <span className="text-lg font-medium text-[#0C1628] font-poppins">contact@remontaservices.com.au</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-[#0C1628]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                  </div>
                  <span className="text-lg font-medium text-[#0C1628] font-poppins">1300 134 153</span>
                </div>
              </div>
            </div>

            {/* Left Side - Form (Second on mobile) */}
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl order-2 lg:order-1">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm lg:text-lg text-[#0C1628] mb-2 font-poppins">
                      First Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Howard"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C1628] font-poppins"
                    />
                  </div>
                  <div>
                    <label className="block text-sm lg:text-lg text-[#0C1628] mb-2 font-poppins">
                      Last Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Thurman"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C1628] font-poppins"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm lg:text-lg text-[#0C1628] mb-2 font-poppins">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. howard@gmail.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C1628] font-poppins"
                    />
                  </div>
                  <div>
                    <label className="block text-sm lg:text-lg text-[#0C1628] mb-2 font-poppins">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +1 (234) 567-8910"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C1628] font-poppins"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm lg:text-lg text-[#0C1628] mb-3 font-poppins">
                    What type of feedback would you like to provide?
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="feedback-type"
                        value="complaint"
                        className="w-4 h-4 text-[#0C1628] border-gray-300 focus:ring-[#0C1628]"
                      />
                      <span className="ml-3 text-[#0C1628] font-poppins">Complaint</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="feedback-type"
                        value="compliment"
                        className="w-4 h-4 text-[#0C1628] border-gray-300 focus:ring-[#0C1628]"
                      />
                      <span className="ml-3 text-[#0C1628] font-poppins">Compliment</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="feedback-type"
                        value="general-feedback"
                        className="w-4 h-4 text-[#0C1628] border-gray-300 focus:ring-[#0C1628]"
                      />
                      <span className="ml-3 text-[#0C1628] font-poppins">General Feedback</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm lg:text-lg text-[#0C1628] mb-2 font-poppins">
                    Your message
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C1628] font-poppins"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#0C1628] text-white py-3 rounded-lg font-poppins font-medium hover:bg-[#B1C3CD] hover:text-[#0C1628] transition-colors"
                >
                  Submit
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Contact Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl text-[#0C1628] font-cooper">Contact Us</h2>
                <p className="text-sm text-gray-600 font-poppins">Please complete the relevant form below</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form className="space-y-4">
              {/* Community Support Dropdown */}
              <div>
                <select className="w-full px-4 py-2 border border-gray-300 rounded font-poppins text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0C1628]">
                  <option>Community Support</option>
                  <option>General Inquiry</option>
                  <option>Technical Support</option>
                </select>
              </div>

              {/* Your email address */}
              <div>
                <label className="block text-sm font-medium text-[#0C1628] mb-1 font-poppins">
                  Your email address
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded font-poppins focus:outline-none focus:ring-2 focus:ring-[#0C1628]"
                />
              </div>

              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-[#0C1628] mb-1 font-poppins">
                  First Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded font-poppins focus:outline-none focus:ring-2 focus:ring-[#0C1628]"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-[#0C1628] mb-1 font-poppins">
                  Last Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded font-poppins focus:outline-none focus:ring-2 focus:ring-[#0C1628]"
                />
              </div>

              {/* Pronouns */}
              <div>
                <label className="block text-sm font-medium text-[#0C1628] mb-1 font-poppins">
                  Pronouns
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded font-poppins focus:outline-none focus:ring-2 focus:ring-[#0C1628]"
                />
              </div>

              {/* My enquiry is about */}
              <div>
                <label className="block text-sm font-medium text-[#0C1628] mb-1 font-poppins">
                  My enquiry is about:
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded font-poppins text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0C1628]">
                  <option value="">-</option>
                  <option>General Question</option>
                  <option>Service Inquiry</option>
                  <option>Support Request</option>
                </select>
                <p className="text-xs text-blue-600 mt-1 font-poppins">Choose which best suits your enquiry</p>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-[#0C1628] mb-1 font-poppins">
                  Subject
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded font-poppins focus:outline-none focus:ring-2 focus:ring-[#0C1628]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[#0C1628] mb-1 font-poppins">
                  Description
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded font-poppins focus:outline-none focus:ring-2 focus:ring-[#0C1628]"
                />
                <p className="text-xs text-gray-600 mt-1 font-poppins">
                  Please enter the details of your request. A member of our support staff will respond as soon as possible.
                </p>
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-sm font-medium text-[#0C1628] mb-1 font-poppins">
                  Attachments
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center">
                  <p className="text-sm text-blue-600 font-poppins">
                    <span className="underline cursor-pointer">Add file</span> or drop files here
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-[#0C1628] text-white py-3 rounded font-poppins text-md font-medium hover:bg-[#B1C3CD] hover:text-[#0C1628] transition-colors"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
