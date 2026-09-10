'use client'

import { useState, useEffect, useRef } from 'react'
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  XMarkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { BRAND_COLORS } from '@/constants'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Suburb {
  name: string
  postcode: string
  state: { abbreviation: string }
}

interface SearchHistoryItem {
  keywords: string
  location: string
}

interface WorkerSearchBarProps {
  onSearch?: (keywords: string, location: string) => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HISTORY_KEY = 'worker_search_history'
const MAX_HISTORY = 6

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readHistory(): SearchHistoryItem[] {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY)
    return raw ? (JSON.parse(raw) as SearchHistoryItem[]) : []
  } catch {
    return []
  }
}

function writeHistory(items: SearchHistoryItem[]) {
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(items))
  } catch {}
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorkerSearchBar({ onSearch }: WorkerSearchBarProps) {
  // ── Field state ─────────────────────────────────────────────────────────────
  const [keywords, setKeywords]             = useState('')
  const [suburbSearch, setSuburbSearch]     = useState('')
  const [location, setLocation]             = useState('')

  // ── Suburb autocomplete ──────────────────────────────────────────────────────
  const [suburbs, setSuburbs]               = useState<Suburb[]>([])
  const [isLoadingSuburbs, setIsLoadingSuburbs] = useState(false)
  const [showSuburbDropdown, setShowSuburbDropdown] = useState(false)

  // ── Search history ───────────────────────────────────────────────────────────
  const [searchHistory, setSearchHistory]   = useState<SearchHistoryItem[]>([])
  const [showHistory, setShowHistory]       = useState(false)

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const containerRef        = useRef<HTMLDivElement>(null)
  const isSuburbSelectedRef = useRef(false)

  // ── Load history from sessionStorage on mount ────────────────────────────────
  useEffect(() => {
    setSearchHistory(readHistory())
  }, [])

  // ── Suburb autocomplete — 300ms debounce ─────────────────────────────────────
  useEffect(() => {
    const fetchSuburbs = async () => {
      if (isSuburbSelectedRef.current) {
        isSuburbSelectedRef.current = false
        return
      }
      if (suburbSearch.length < 2) {
        setSuburbs([])
        setShowSuburbDropdown(false)
        return
      }
      setIsLoadingSuburbs(true)
      try {
        const res  = await fetch(`/api/suburbs?q=${encodeURIComponent(suburbSearch)}`)
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setSuburbs(data)
          setShowSuburbDropdown(true)
        } else {
          setSuburbs([])
          setShowSuburbDropdown(false)
        }
      } catch {
        setSuburbs([])
        setShowSuburbDropdown(false)
      } finally {
        setIsLoadingSuburbs(false)
      }
    }
    const id = setTimeout(fetchSuburbs, 300)
    return () => clearTimeout(id)
  }, [suburbSearch])

  // ── Close both dropdowns on outside click ────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuburbDropdown(false)
        setShowHistory(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── History helpers ──────────────────────────────────────────────────────────

  const saveToHistory = (kw: string, loc: string) => {
    if (!kw.trim()) return
    setSearchHistory(prev => {
      // Remove duplicate entry if the exact same search already exists
      const deduped  = prev.filter(h => !(h.keywords === kw && h.location === loc))
      const updated  = [{ keywords: kw, location: loc }, ...deduped].slice(0, MAX_HISTORY)
      writeHistory(updated)
      return updated
    })
  }

  const removeFromHistory = (index: number) => {
    setSearchHistory(prev => {
      const updated = prev.filter((_, i) => i !== index)
      writeHistory(updated)
      return updated
    })
  }

  const clearHistory = () => {
    setSearchHistory([])
    setShowHistory(false)
    try { sessionStorage.removeItem(HISTORY_KEY) } catch {}
  }

  // ── Search & clear ───────────────────────────────────────────────────────────

  const hasFilters = keywords.trim() !== '' || suburbSearch.trim() !== ''

  const handleSearch = () => {
    const finalLocation = suburbSearch.trim() || location
    saveToHistory(keywords.trim(), finalLocation)
    setShowHistory(false)
    setShowSuburbDropdown(false)
    if (onSearch) onSearch(keywords, finalLocation)
  }

  const handleClear = () => {
    setKeywords('')
    setSuburbSearch('')
    setLocation('')
    setSuburbs([])
    setShowSuburbDropdown(false)
    setShowHistory(false)
    if (onSearch) onSearch('', '')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
    if (e.key === 'Escape') { setShowHistory(false); setShowSuburbDropdown(false) }
  }

  // ── Keywords field handlers ──────────────────────────────────────────────────

  const handleKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setKeywords(val)
    // Show history only while the field is empty; hide it once the user starts typing
    setShowHistory(val.length === 0 && searchHistory.length > 0)
  }

  const handleKeywordsFocus = () => {
    if (keywords.length === 0 && searchHistory.length > 0) setShowHistory(true)
  }

  // ── Location field handlers ──────────────────────────────────────────────────

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSuburbSearch(e.target.value)
    setLocation(e.target.value)
  }

  // ── History item click ───────────────────────────────────────────────────────

  const handleHistorySelect = (item: SearchHistoryItem) => {
    setKeywords(item.keywords)
    setSuburbSearch(item.location)
    setLocation(item.location)
    setShowHistory(false)
    if (onSearch) onSearch(item.keywords, item.location)
  }

  // ── Suburb selection ─────────────────────────────────────────────────────────

  const selectSuburb = (suburb: Suburb) => {
    const value = `${suburb.name}, ${suburb.state.abbreviation} ${suburb.postcode}`
    isSuburbSelectedRef.current = true
    setSuburbSearch(value)
    setLocation(value)
    setShowSuburbDropdown(false)
    setSuburbs([])
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-[900px] mx-auto relative" ref={containerRef}>

      {/* ── Desktop layout ─────────────────────────────────────────────────── */}
      <div className="hidden md:flex items-center bg-white border-2 border-gray-200 rounded-full px-4 py-1 hover:border-gray-300 focus-within:border-[#0C1628] focus-within:shadow-[0_0_0_3px_rgba(12,22,40,0.1)] transition-all">

        {/* Keywords */}
        <div className="flex items-center flex-1 min-w-0">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Service type, hobbies, or name"
            value={keywords}
            onChange={handleKeywordsChange}
            onFocus={handleKeywordsFocus}
            onKeyDown={handleKeyDown}
            className="flex-1 border-none outline-none px-3 py-3 font-poppins text-[15px] text-gray-900 bg-transparent placeholder:text-gray-400 min-w-0"
          />
        </div>

        {/* Divider */}
        <div className="w-px h-7 bg-gray-200 flex-shrink-0 mx-2" />

        {/* Location */}
        <div className="flex items-center flex-1 min-w-0">
          <MapPinIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="City, suburb, or postcode"
            value={suburbSearch}
            onChange={handleLocationChange}
            onFocus={() => { if (suburbs.length > 0) setShowSuburbDropdown(true) }}
            onKeyDown={handleKeyDown}
            className="flex-1 border-none outline-none px-3 py-3 font-poppins text-[15px] text-gray-900 bg-transparent placeholder:text-gray-400 min-w-0"
          />
          {isLoadingSuburbs && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-gray-400 border-r-transparent flex-shrink-0" />
          )}
        </div>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={handleClear}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full font-poppins text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 active:scale-[0.98] transition-all whitespace-nowrap ml-1"
          >
            <XMarkIcon className="w-4 h-4" />
            Clear
          </button>
        )}

        {/* Search */}
        <button
          onClick={handleSearch}
          className="flex-shrink-0 px-4 py-1.5 rounded-full text-white font-poppins text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all whitespace-nowrap ml-2"
          style={{ backgroundColor: BRAND_COLORS.PRIMARY }}
        >
          Find Support Worker
        </button>
      </div>

      {/* ── Mobile layout ──────────────────────────────────────────────────── */}
      <div className="md:hidden flex flex-col bg-white border-2 border-gray-200 rounded-2xl p-3 gap-2">

        {/* Keywords */}
        <div className="flex items-center bg-gray-50 rounded-xl px-3 py-2">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Service type, hobbies, or name"
            value={keywords}
            onChange={handleKeywordsChange}
            onFocus={handleKeywordsFocus}
            onKeyDown={handleKeyDown}
            className="flex-1 border-none outline-none px-3 py-2 font-poppins text-[15px] text-gray-900 bg-transparent placeholder:text-gray-400"
          />
        </div>

        {/* Location */}
        <div className="flex items-center bg-gray-50 rounded-xl px-3 py-2">
          <MapPinIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="City, suburb, or postcode"
            value={suburbSearch}
            onChange={handleLocationChange}
            onFocus={() => { if (suburbs.length > 0) setShowSuburbDropdown(true) }}
            onKeyDown={handleKeyDown}
            className="flex-1 border-none outline-none px-3 py-2 font-poppins text-[15px] text-gray-900 bg-transparent placeholder:text-gray-400"
          />
          {isLoadingSuburbs && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-gray-400 border-r-transparent flex-shrink-0" />
          )}
        </div>

        {/* Buttons */}
        <div className={`grid gap-2 mt-1 ${hasFilters ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {hasFilters && (
            <button
              onClick={handleClear}
              className="flex items-center justify-center gap-1.5 py-3.5 rounded-xl font-poppins text-[15px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] transition-all"
            >
              <XMarkIcon className="w-4 h-4" />
              Clear
            </button>
          )}
          <button
            onClick={handleSearch}
            className="py-3.5 rounded-xl text-white font-poppins text-[15px] font-medium hover:opacity-90 active:scale-[0.98] transition-all"
            style={{ backgroundColor: BRAND_COLORS.PRIMARY }}
          >
            Find Support Worker
          </button>
        </div>
      </div>

      {/* ── Search history dropdown ─────────────────────────────────────────── */}
      {showHistory && searchHistory.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
            <span className="font-poppins text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Recent searches
            </span>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={clearHistory}
              className="font-poppins text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              Clear all
            </button>
          </div>

          {searchHistory.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 group"
            >
              {/* Clock icon + text — clickable to re-run the search */}
              <button
                className="flex items-center gap-3 flex-1 text-left min-w-0"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleHistorySelect(item)}
              >
                <ClockIcon className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-poppins text-sm text-gray-900 truncate">{item.keywords}</p>
                  {item.location && (
                    <p className="font-poppins text-xs text-gray-400 truncate">{item.location}</p>
                  )}
                </div>
              </button>

              {/* Remove single item */}
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => removeFromHistory(index)}
                className="flex-shrink-0 p-1 rounded-full text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Remove from history"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Suburb autocomplete dropdown ────────────────────────────────────── */}
      {showSuburbDropdown && suburbs.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {suburbs.map((suburb, index) => (
            <button
              key={`${suburb.name}-${suburb.postcode}-${index}`}
              type="button"
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 font-poppins text-sm"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectSuburb(suburb)}
            >
              <span className="text-gray-900 font-medium">
                {suburb.name}, {suburb.state.abbreviation} {suburb.postcode}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
