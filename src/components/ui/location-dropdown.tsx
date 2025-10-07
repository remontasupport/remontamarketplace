"use client";

import * as React from "react";
import { Search, ChevronDown } from "lucide-react";
import { cn } from "@/utils/tailwindUtils"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface LocationOption {
  value: string;
  label: string;
  display: string;
}

interface LocationDropdownProps {
  options: LocationOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  onSearch?: (query: string) => LocationOption[];
}

export function LocationDropdown({
  options = [],
  value,
  onValueChange,
  placeholder = "Select location...",
  searchPlaceholder = "Search...",
  emptyMessage = "No locations found.",
  className,
  onSearch,
}: LocationDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filteredOptions, setFilteredOptions] = React.useState<LocationOption[]>(options);

  // Handle search
  React.useEffect(() => {
    if (onSearch) {
      const results = onSearch(searchQuery);
      setFilteredOptions(results);
    } else {
      // Default filtering
      const filtered = options.filter((option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.value.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [searchQuery, options, onSearch]);

  const selectedOption = React.useMemo(() => {
    console.log("Finding selected option for value:", value);
    if (onSearch && value) {
      // Extract the suburb name from the value to search for it
      // Value format is like "Altona, VIC 3018"
      const suburbName = value.split(',')[0].trim();
      console.log("Searching for suburb:", suburbName);
      const searchResults = onSearch(suburbName);
      console.log("Search results for suburb:", searchResults);
      const found = searchResults.find((option) => option.value === value);
      console.log("Found selected option:", found);
      return found;
    }
    const found = options.find((option) => option.value === value);
    console.log("Found selected option from options:", found);
    return found;
  }, [value, options, onSearch]);

  const handleItemClick = (option: LocationOption, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log("Location clicked:", option);
    onValueChange?.(option.value);
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 opacity-50" />
            <span className="truncate">
              {selectedOption ? selectedOption.display : placeholder}
            </span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-full p-0 bg-white border border-gray-200 shadow-lg"
        style={{ width: "var(--radix-popover-trigger-width)" }}
      >
        <div className="bg-white">
          {/* Search Input */}
          <div className="flex items-center border-b border-gray-200 px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* Options List */}
          <div className="max-h-[300px] overflow-y-auto bg-white">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-gray-500 text-sm">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={`${option.value}-${index}`}
                  onClick={(event) => handleItemClick(option, event)}
                  className="cursor-pointer hover:bg-blue-50 hover:text-blue-900 text-gray-900 py-3 px-4 border-b border-gray-50 last:border-b-0 flex items-center"
                >
                  <span className="truncate text-base font-poppins">
                    {option.display}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}