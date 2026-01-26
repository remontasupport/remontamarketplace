"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";

interface Suburb {
  name: string;
  postcode: number;
  state: {
    abbreviation: string;
  };
}

interface WhereSectionProps {
  selectedLocation: string;
  onLocationChange: (location: string) => void;
}

export default function WhereSection({
  selectedLocation,
  onLocationChange,
}: WhereSectionProps) {
  const [searchQuery, setSearchQuery] = useState(selectedLocation);
  const [suburbs, setSuburbs] = useState<Suburb[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const isSelectedRef = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync searchQuery with selectedLocation when it changes externally
  useEffect(() => {
    if (selectedLocation && selectedLocation !== searchQuery) {
      setSearchQuery(selectedLocation);
    }
  }, [selectedLocation]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suburbs from API
  useEffect(() => {
    const fetchSuburbs = async () => {
      // Don't fetch if user just selected an item
      if (isSelectedRef.current) {
        isSelectedRef.current = false;
        return;
      }

      if (searchQuery.length < 2) {
        setSuburbs([]);
        setShowDropdown(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/suburbs?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          setSuburbs(data);
          setShowDropdown(true);
        } else {
          setSuburbs([]);
          setShowDropdown(false);
        }
      } catch (error) {
        setSuburbs([]);
        setShowDropdown(false);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuburbs, 300); // Debounce for 300ms
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelectSuburb = (suburb: Suburb) => {
    const selectedValue = `${suburb.name}, ${suburb.state.abbreviation} ${suburb.postcode}`;
    isSelectedRef.current = true;
    setShowDropdown(false);
    setSuburbs([]);
    setSearchQuery(selectedValue);
    onLocationChange(selectedValue);
  };

  return (
    <div className="section-card">
      <h2 className="section-title">Where do you need the service?</h2>
      <p className="text-gray-600 font-poppins mt-2 mb-6">
        The starting suburb where support will take place. Start typing the suburb or postcode and select from the list.
      </p>

      {/* Location Search Input */}
      <div className="relative" ref={dropdownRef}>
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 animate-spin z-10" />
        )}
        <input
          type="text"
          placeholder="Search suburb or postcode..."
          className="w-full pl-12 pr-12 py-4 text-lg font-poppins border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (suburbs.length > 0) setShowDropdown(true);
          }}
        />

        {/* Dropdown */}
        {showDropdown && suburbs.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
            {suburbs.map((suburb, index) => (
              <button
                key={`${suburb.name}-${suburb.postcode}-${index}`}
                type="button"
                className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors border-b last:border-b-0 font-poppins"
                onClick={() => handleSelectSuburb(suburb)}
              >
                <span className="text-gray-900 font-medium">
                  {suburb.name}, {suburb.state.abbreviation} {suburb.postcode}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Location Display */}
      {selectedLocation && (
        <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
          <p className="text-sm text-gray-600">Selected location:</p>
          <p className="text-lg font-medium text-indigo-900 font-poppins">
            {selectedLocation}
          </p>
        </div>
      )}
    </div>
  );
}
