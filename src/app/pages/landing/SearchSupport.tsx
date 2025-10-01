'use client'
import { useState } from 'react'
import Image from 'next/image'

interface Worker {
  id: number
  name: string
  image: string
  specialties: string[]
  badges: string[]
}

const mockWorkers: Worker[] = [
  {
    id: 1,
    name: "Yulieth E",
    image: "/images/yuliethE.webp",
    specialties: ["Specialised supports"],
    badges: ["Support Work"]
  },
  {
    id: 2,
    name: "Alexandra A",
    image: "/images/alexandraA.webp",
    specialties: ["Provides specialised supports"],
    badges: ["Loves to laugh"]
  },
  {
    id: 3,
    name: "Angie V",
    image: "/images/angieV.webp",
    specialties: ["Social and everyday support"],
    badges: ["Psychology student"]
  },
  {
    id: 4,
    name: "Vivian C",
    image: "/images/vivianC.webp",
    specialties: ["Health student"],
    badges: ["Sleepover supports"]
  }
]

export default function SearchSupport() {
  const [location, setLocation] = useState('')
  const [supportType, setSupportType] = useState('All')
  const [distance, setDistance] = useState('20km')

  return (
    <section className="bg-white pt-4 pb-4 sm:py-16 md:py-20 lg:py-24 overflow-x-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-0">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <p className="font-sans text-xs sm:text-sm md:text-base font-medium uppercase tracking-wide mb-3 sm:mb-4">
            <span className="bg-[#F8E8D8] px-2 py-0 rounded-lg text-[#0C1628]">FIND SUPPORT</span>
          </p>
          <h2 className="font-cooper text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-normal leading-tight text-[#0C1628] mb-2 sm:mb-8">
            Search for NDIS disability workers in your area
          </h2>
          <p className="font-sans text-base sm:text-lg lg:text-xl text-[#0C1628] leading-relaxed max-w-4xl mx-auto">
            Meet a few of the amazing disability support workers making a difference every day.
          </p>
        </div>


        {/* <div className="bg-gray-50 rounded-2xl shadow-lg p-6 mb-12 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
      
            <div className="md:col-span-1">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Suburb or postcode
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g Sydney, NSW 2000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

       
            <div className="md:col-span-1">
              <label htmlFor="support-type" className="block text-sm font-medium text-gray-700 mb-2">
                Type of Support
              </label>
              <select
                id="support-type"
                value={supportType}
                onChange={(e) => setSupportType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All">All</option>
                <option value="Personal Care">Personal Care</option>
                <option value="Community Access">Community Access</option>
                <option value="Household Tasks">Household Tasks</option>
                <option value="Transport">Transport</option>
                <option value="Social Support">Social Support</option>
              </select>
            </div>

           
            <div className="md:col-span-1">
              <label htmlFor="distance" className="block text-sm font-medium text-gray-700 mb-2">
                Within
              </label>
              <select
                id="distance"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="5km">5km</option>
                <option value="10km">10km</option>
                <option value="20km">20km</option>
                <option value="50km">50km</option>
                <option value="100km">100km</option>
              </select>
            </div>

           
            <div className="md:col-span-1">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200">
                Search
              </button>
            </div>
          </div>
        </div> */}

        {/* Worker Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockWorkers.map((worker) => (
            <div key={worker.id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              {/* Worker Image */}
              <div className="relative h-64">
                <Image
                  src={worker.image}
                  alt={`${worker.name} - Support Worker`}
                  fill
                  className="object-cover"
                />
                {/* Name Badge */}
                <div className="absolute bottom-4 left-4">
                  <span className="bg-[#0C1628] text-white px-3 py-1 rounded-full text-lg font-medium">
                    {worker.name}
                  </span>
                </div>
              </div>

              {/* Worker Info */}
              <div className="p-4 space-y-3">
                {/* Specialties */}
                {worker.specialties.map((specialty, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-700">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                    {specialty}
                  </div>
                ))}

                {/* Badges */}
                {worker.badges.map((badge, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-700">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                    {badge}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}