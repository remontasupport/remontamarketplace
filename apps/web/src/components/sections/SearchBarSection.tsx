'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BRAND_COLORS } from '@/lib/constants'

const SUPPORT_TYPE_SLUGS: Record<string, string> = {
  'Support Worker': 'support-worker',
  'Support Worker (High Intensity)': 'support-worker-high-intensity',
  'Cleaning Services': 'cleaning-services',
  'Home and Yard Maintenance': 'home-and-yard-maintenance',
  'Therapeutic Supports': 'therapeutic-supports',
  'Nursing Services': 'nursing-services',
}

interface Props {
  currentLocation?: string
}

export default function SearchBarSection({ currentLocation }: Props) {
  const router = useRouter()
  const [location, setLocation] = useState('')
  const [supportType, setSupportType] = useState('All')
  const [within, setWithin] = useState('20')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loadingSuburbs, setLoadingSuburbs] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const handleLocationChange = (value: string) => {
    setLocation(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      setLoadingSuburbs(false)
      return
    }
    setLoadingSuburbs(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suburbs?q=${encodeURIComponent(value)}`)
        const data = await res.json()
        const raw: { name: string; postcode: number; state: { abbreviation: string } }[] = Array.isArray(data) ? data : []
        const results = raw.map((item) => `${item.name}, ${item.state.abbreviation} ${item.postcode}`)
        setSuggestions(results)
        setShowSuggestions(results.length > 0)
      } catch {
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        setLoadingSuburbs(false)
      }
    }, 300)
  }

  const handleSelectSuggestion = (value: string) => {
    setLocation(value)
    setSuggestions([])
    setShowSuggestions(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (location.trim()) params.set('location', location.trim())
    const slug = SUPPORT_TYPE_SLUGS[supportType]
    if (slug) params.set('typeOfSupport', slug)
    params.set('within', within)
    router.push(`/search?${params}`)
  }

  const title = currentLocation
    ? `Not in ${currentLocation}? Search for support workers in a different area`
    : 'Search for support workers in a different area'

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: BRAND_COLORS.PRIMARY }}>
      <div className="max-w-4xl mx-auto text-center">

        <h2 className="font-cooper text-3xl sm:text-4xl font-normal text-white mb-10">
          {title}
        </h2>

        <form
          onSubmit={handleSearch}
          className="inline-flex flex-col md:flex-row items-stretch bg-white rounded-2xl border-2 shadow-sm"
          style={{ borderColor: BRAND_COLORS.PRIMARY }}
        >
          {/* Suburb or postcode */}
          <div ref={wrapperRef} className="relative flex flex-col justify-center px-5 py-4 text-left border-b md:border-b-0 md:border-r border-gray-200 w-full md:w-56">
            <label className="text-xs font-bold text-[#0C1628] mb-1">Suburb or postcode</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={location}
                onChange={(e) => handleLocationChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="e.g. Sydney NSW 2000"
                className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none flex-1 min-w-0"
                autoComplete="off"
              />
              {loadingSuburbs && (
                <svg className="animate-spin h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
            </div>
            {showSuggestions && (
              <ul className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-60 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <li
                    key={i}
                    onMouseDown={() => handleSelectSuggestion(s)}
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Type of Support */}
          <div className="flex flex-col justify-center px-5 py-4 text-left border-b md:border-b-0 md:border-r border-gray-200 w-auto">
            <label className="text-xs font-bold text-[#0C1628] mb-1">Type of Support</label>
            <select
              value={supportType}
              onChange={(e) => setSupportType(e.target.value)}
              className="bg-transparent text-sm text-gray-700 outline-none cursor-pointer"
            >
              <option value="All">All</option>
              <option value="Support Worker">Support Worker</option>
              <option value="Support Worker (High Intensity)">Support Worker (High Intensity)</option>
              <option value="Cleaning Services">Cleaning Services</option>
              <option value="Home and Yard Maintenance">Home and Yard Maintenance</option>
              <option value="Therapeutic Supports">Therapeutic Supports</option>
              <option value="Nursing Services">Nursing Services</option>
            </select>
          </div>

          {/* Within */}
          <div className="flex flex-col justify-center px-5 py-4 text-left border-b md:border-b-0 md:border-r border-gray-200">
            <label className="text-xs font-bold text-[#0C1628] mb-1">Within</label>
            <select
              value={within}
              onChange={(e) => setWithin(e.target.value)}
              className="bg-transparent text-sm text-gray-700 outline-none cursor-pointer"
            >
              <option value="5">5km</option>
              <option value="10">10km</option>
              <option value="20">20km</option>
              <option value="50">50km</option>
              <option value="100">100km</option>
            </select>
          </div>

          {/* Search button */}
          <div className="flex items-center justify-center px-3 py-3">
            <button
              type="submit"
              className="px-10 py-4 text-white font-semibold text-base rounded-xl transition-opacity duration-200 hover:opacity-90"
              style={{ backgroundColor: BRAND_COLORS.PRIMARY }}
            >
              Search
            </button>
          </div>
        </form>

      </div>
    </section>
  )
}
