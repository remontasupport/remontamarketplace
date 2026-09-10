'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { COMMON_LANGUAGES } from '@/constants/languages';

interface LanguageSelectProps {
  value: string[];
  onChange: (languages: string[]) => void;
  error?: string;
}

export function LanguageSelect({ value = [], onChange, error }: LanguageSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customLanguage, setCustomLanguage] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setShowCustomInput(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter languages based on search
  const filteredLanguages = COMMON_LANGUAGES.filter(lang =>
    lang.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleLanguage = (language: string) => {
    if (value.includes(language)) {
      onChange(value.filter(l => l !== language));
    } else {
      onChange([...value, language]);
    }
  };

  const removeLanguage = (language: string) => {
    onChange(value.filter(l => l !== language));
  };

  const addCustomLanguage = () => {
    if (customLanguage.trim() && !value.includes(customLanguage.trim())) {
      onChange([...value, customLanguage.trim()]);
      setCustomLanguage('');
      setShowCustomInput(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative" ref={dropdownRef}>
        {/* Selected Languages Tags */}
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((language) => (
            <div
              key={language}
              className="bg-[#0C1628] text-white px-3 py-1 rounded-full flex items-center gap-2 font-poppins text-sm"
            >
              {language}
              <button
                type="button"
                onClick={() => removeLanguage(language)}
                className="hover:bg-white/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Dropdown Trigger */}
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between text-left font-poppins"
        >
          <span className="text-gray-500">
            {value.length === 0 ? 'Select languages...' : `${value.length} language(s) selected`}
          </span>
          <ChevronDown className="w-4 h-4" />
        </Button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search languages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 font-poppins"
                />
              </div>
            </div>

            {/* Language List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredLanguages.map((language) => (
                <button
                  key={language}
                  type="button"
                  onClick={() => toggleLanguage(language)}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors font-poppins ${
                    value.includes(language) ? 'bg-blue-50 text-blue-700 font-semibold' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{language}</span>
                    {value.includes(language) && (
                      <span className="text-blue-600">✓</span>
                    )}
                  </div>
                </button>
              ))}
              {filteredLanguages.length === 0 && !showCustomInput && (
                <div className="px-4 py-3 text-gray-500 text-center font-poppins">
                  No languages found
                </div>
              )}
            </div>

            {/* Custom Language Input */}
            {!showCustomInput ? (
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                className="w-full text-left px-4 py-3 border-t border-gray-200 hover:bg-gray-50 text-[#0C1628] font-semibold font-poppins"
              >
                + Add other language
              </button>
            ) : (
              <div className="p-3 border-t border-gray-200 space-y-2">
                <Input
                  type="text"
                  placeholder="Enter language name..."
                  value={customLanguage}
                  onChange={(e) => setCustomLanguage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomLanguage();
                    }
                  }}
                  className="font-poppins"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={addCustomLanguage}
                    className="flex-1 bg-[#0C1628] hover:bg-[#1a2740] text-white font-poppins"
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomLanguage('');
                    }}
                    variant="outline"
                    className="flex-1 font-poppins"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-sm font-poppins">{error}</p>
      )}
    </div>
  );
}
