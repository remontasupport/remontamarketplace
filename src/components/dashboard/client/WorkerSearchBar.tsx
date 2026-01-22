'use client'

import { useState } from 'react'
import { MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { BRAND_COLORS } from '@/constants'

interface WorkerSearchBarProps {
  onSearch?: (keywords: string, location: string) => void
}

export default function WorkerSearchBar({ onSearch }: WorkerSearchBarProps) {
  const [keywords, setKeywords] = useState('')
  const [location, setLocation] = useState('')

  const handleSearch = () => {
    if (onSearch) {
      onSearch(keywords, location)
    }
    console.log('Searching for:', { keywords, location })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="w-full max-w-[900px] mx-auto">
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center bg-white border-2 border-gray-200 rounded-full px-4 py-1 hover:border-gray-300 focus-within:border-[#0C1628] focus-within:shadow-[0_0_0_3px_rgba(12,22,40,0.1)] transition-all">
        {/* Keywords Input */}
        <div className="flex items-center flex-1 min-w-0">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Service type, keywords, or name"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border-none outline-none px-3 py-3 font-poppins text-[15px] text-gray-900 bg-transparent placeholder:text-gray-400 min-w-0"
          />
        </div>

        {/* Divider */}
        <div className="w-px h-7 bg-gray-200 flex-shrink-0 mx-2" />

        {/* Location Input */}
        <div className="flex items-center flex-1 min-w-0">
          <MapPinIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder='City, suburb, or postcode'
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border-none outline-none px-3 py-3 font-poppins text-[15px] text-gray-900 bg-transparent placeholder:text-gray-400 min-w-0"
          />
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="flex-shrink-0 px-5 py-2.5 rounded-full text-white font-poppins text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all whitespace-nowrap ml-2"
          style={{ backgroundColor: BRAND_COLORS.PRIMARY }}
        >
          Find Support Worker
        </button>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col bg-white border-2 border-gray-200 rounded-2xl p-3 gap-2">
        {/* Keywords Input */}
        <div className="flex items-center bg-gray-50 rounded-xl px-3 py-2">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Service type, keywords, or name"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border-none outline-none px-3 py-2 font-poppins text-[15px] text-gray-900 bg-transparent placeholder:text-gray-400"
          />
        </div>

        {/* Location Input */}
        <div className="flex items-center bg-gray-50 rounded-xl px-3 py-2">
          <MapPinIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder='City, suburb, or postcode'
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border-none outline-none px-3 py-2 font-poppins text-[15px] text-gray-900 bg-transparent placeholder:text-gray-400"
          />
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="w-full py-3.5 rounded-xl text-white font-poppins text-[15px] font-medium hover:opacity-90 active:scale-[0.98] transition-all mt-1"
          style={{ backgroundColor: BRAND_COLORS.PRIMARY }}
        >
          Find Support Worker
        </button>
      </div>
    </div>
  )
}
