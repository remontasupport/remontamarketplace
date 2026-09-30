'use client';

import { useState, useEffect, useRef } from "react";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2 } from "lucide-react";

interface Step1LocationProps {
  control: any;
  errors: any;
}

interface Suburb {
  name: string;
  postcode: number;
  state: {
    abbreviation: string;
  };
}

export function Step1Location({ control, errors }: Step1LocationProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suburbs, setSuburbs] = useState<Suburb[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const isSelectedRef = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 font-poppins mb-6">
          Where are you located?
        </h2>

        <div>
          <Label className="text-lg font-poppins font-medium">
            Postcode/Suburb<span className="text-red-500">*</span>
          </Label>
          <div className="relative mt-2" ref={dropdownRef}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 animate-spin z-10" />
            )}
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <>
                  <Input
                    placeholder="Search"
                    className="text-lg font-poppins pl-10 pr-10"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                    }}
                    onFocus={() => {
                      if (suburbs.length > 0) setShowDropdown(true);
                    }}
                  />

                  {/* Dropdown */}
                  {showDropdown && suburbs.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {suburbs.map((suburb, index) => (
                        <button
                          key={`${suburb.name}-${suburb.postcode}-${index}`}
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors border-b last:border-b-0 font-poppins"
                          onClick={() => {
                            const selectedValue = `${suburb.name}, ${suburb.state.abbreviation} ${suburb.postcode}`;
                            // Set ref flag synchronously BEFORE updating search query
                            isSelectedRef.current = true;
                            setShowDropdown(false);
                            setSuburbs([]);
                            field.onChange(selectedValue);
                            setSearchQuery(selectedValue);
                          }}
                        >
                          <span className="text-gray-900 font-medium">
                            {suburb.name}, {suburb.state.abbreviation} {suburb.postcode}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            />
          </div>
          {errors.location && (
            <p className="text-red-500 text-sm font-poppins mt-1">
              {errors.location.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
