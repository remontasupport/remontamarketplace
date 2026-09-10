/**
 * Step 5: Address
 * Location and address details with Australian address autocomplete
 * Street address is optional and will be concatenated when saving to database
 */

import { useState, useEffect, useRef } from "react";
import { TextField } from "@/components/forms/fields";
import { MapPinIcon } from "@heroicons/react/24/outline";
import StepContentWrapper from "../shared/StepContentWrapper";

interface Step5AddressProps {
  data: {
    streetAddress: string;
    city: string;
    state: string;
    postalCode: string;
  };
  onChange: (field: string, value: string) => void;
  errors?: {
    streetAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    location?: string;
  };
}

interface Suburb {
  name: string;
  postcode: number;
  state: {
    abbreviation: string;
  };
}

export default function Step5Address({ data, onChange, errors }: Step5AddressProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suburbs, setSuburbs] = useState<Suburb[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const isSelectedRef = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);
  const userHasEditedRef = useRef(false); // Track if user has actively edited the field

  // Combine city, state, postalCode into one display value
  // Format: "City, State PostalCode"
  const buildLocationValue = () => {
    const parts = [];

    if (data.city) {
      parts.push(data.city);
    }

    // Combine state and postal code with a space (not a comma)
    const statePostal = [data.state, data.postalCode].filter(Boolean).join(' ');
    if (statePostal) {
      parts.push(statePostal);
    }

    return parts.join(', ');
  };

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

  // Initialize search query from database data when it arrives
  useEffect(() => {
    // Only initialize once when data becomes available
    if (!hasInitializedRef.current && (data.city || data.state || data.postalCode)) {
      const initialValue = buildLocationValue();
      setSearchQuery(initialValue);
      hasInitializedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.city, data.state, data.postalCode]); // Update when data changes

  // Fetch suburbs from API
  useEffect(() => {
    const fetchSuburbs = async () => {
      // Don't fetch if user just selected an item
      if (isSelectedRef.current) {
        isSelectedRef.current = false;
        return;
      }

      // Only fetch if user has actively edited the field
      if (!userHasEditedRef.current) {
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

  // Handle location input change - parse and update individual fields
  const handleLocationChange = (value: string) => {
    // Mark that user has actively edited the field
    userHasEditedRef.current = true;

    // Update search query for autocomplete
    setSearchQuery(value);

    // Expected format: "City, State PostalCode" or "City, State"
    // Examples:
    // - "Sydney, NSW 2000"
    // - "Melbourne, VIC"
    // - "Brisbane"

    const parts = value.split(',').map(p => p.trim());

    if (parts.length >= 2) {
      // Has comma: first part is city, second part is state and postal
      const city = parts[0];
      const statePostal = parts[1].split(/\s+/);
      const state = statePostal[0] || '';
      const postalCode = statePostal[1] || '';

      onChange('city', city);
      onChange('state', state);
      onChange('postalCode', postalCode);
    } else if (parts.length === 1) {
      // No comma: try to parse state and postal code from the end
      const words = value.trim().split(/\s+/);

      if (words.length >= 3) {
        // Last word might be postal code, second last might be state
        const possiblePostal = words[words.length - 1];
        const possibleState = words[words.length - 2];

        // Check if last word is 3-4 digits (postal code)
        if (/^\d{3,4}$/.test(possiblePostal) && possibleState.length <= 3) {
          const postalCode = possiblePostal;
          const state = possibleState;
          const city = words.slice(0, -2).join(' ');

          onChange('city', city);
          onChange('state', state);
          onChange('postalCode', postalCode);
        } else {
          // Just treat as city
          onChange('city', value);
          onChange('state', '');
          onChange('postalCode', '');
        }
      } else {
        // Short input, treat as city
        onChange('city', value);
        onChange('state', '');
        onChange('postalCode', '');
      }
    }
  };

  // Handle suburb selection from dropdown
  const handleSuburbSelect = (suburb: Suburb) => {
    const selectedValue = `${suburb.name}, ${suburb.state.abbreviation} ${suburb.postcode}`;

    // Set ref flag synchronously BEFORE updating search query
    isSelectedRef.current = true;
    setShowDropdown(false);
    setSuburbs([]);
    setSearchQuery(selectedValue);

    // Update individual fields
    onChange('city', suburb.name);
    onChange('state', suburb.state.abbreviation);
    onChange('postalCode', String(suburb.postcode));
  };

  return (
    <StepContentWrapper>
      <div className="form-page-content">
      <div className="form-column">
        <div className="account-form">
          {/* Street Address (Optional) */}
          <TextField
            label="Street Address"
            name="streetAddress"
            value={data.streetAddress}
            onChange={(e) => onChange("streetAddress", e.target.value)}
            placeholder="123 Main Street"
            isOptional
            error={errors?.streetAddress}
          />

          {/* Location (City, State, Postal Code in one line) with Autocomplete */}
          <div className="form-group">
            <label htmlFor="location" className="form-label">
              Suburb/Postcode
            </label>
            <div className="relative" ref={dropdownRef}>
              <input
                type="text"
                id="location"
                name="location"
                value={searchQuery}
                onChange={(e) => handleLocationChange(e.target.value)}
                onFocus={() => {
                  if (suburbs.length > 0) setShowDropdown(true);
                }}
                placeholder="Sydney, NSW 2000"
                className={`form-input ${(errors?.location || errors?.city || errors?.state || errors?.postalCode) ? "form-input-error" : ""}`}
                aria-invalid={(errors?.location || errors?.city || errors?.state || errors?.postalCode) ? "true" : "false"}
              />

              {/* Loading Spinner */}
              {isLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-indigo-600 border-r-transparent"></div>
                </div>
              )}

              {/* Autocomplete Dropdown */}
              {showDropdown && suburbs.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {suburbs.map((suburb, index) => (
                    <button
                      key={`${suburb.name}-${suburb.postcode}-${index}`}
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors border-b last:border-b-0"
                      onClick={() => handleSuburbSelect(suburb)}
                    >
                      <span className="text-gray-900 font-medium">
                        {suburb.name}, {suburb.state.abbreviation} {suburb.postcode}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Error Message */}
            {(errors?.location || errors?.city || errors?.state || errors?.postalCode) && (
              <p className="field-error-text">
                {errors?.location || errors?.city || errors?.state || errors?.postalCode}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="info-column">
        <div className="info-box">
          <div className="info-box-header">
            <div className="info-box-icon">
              <MapPinIcon className="icon-location" />
            </div>
            <h3 className="info-box-title">Your Location</h3>
          </div>
          <p className="info-box-text">
            Street address is optional. Start typing your suburb or postcode to see suggestions.
          </p>
          <p className="info-box-note">
            <strong>Note:</strong> Your street address and exact location are never shared with clients. Only your suburb/city is visible on your profile.
          </p>
        </div>
      </div>
      </div>
    </StepContentWrapper>
  );
}
