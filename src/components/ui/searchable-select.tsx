"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SearchableSelectOption {
  value: string;
  label: string;
  display?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  onSearch?: (query: string) => SearchableSelectOption[];
}

export function SearchableSelect({
  options = [],
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found.",
  className,
  onSearch,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filteredOptions, setFilteredOptions] = React.useState<SearchableSelectOption[]>(options);

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

  const selectedOption = options.find((option) => option.value === value);

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
              {selectedOption ? (selectedOption.display || selectedOption.label) : placeholder}
            </span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-white border border-gray-200 shadow-lg" style={{ width: "var(--radix-popover-trigger-width)" }}>
        <Command shouldFilter={false} className="bg-white">
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="h-9 border-b border-gray-200"
          />
          <CommandList className="max-h-[300px] overflow-y-auto bg-white">
            <CommandEmpty className="py-4 text-center text-gray-500">{emptyMessage}</CommandEmpty>
            <CommandGroup className="bg-white">
              {filteredOptions.map((option, index) => (
                <CommandItem
                  key={`${option.value}-${index}`}
                  value={option.display || option.label}
                  onSelect={(selectedValue) => {
                   
                    setOpen(false);
                    setSearchQuery("");
                  }}
                  className="cursor-pointer hover:bg-blue-50 hover:text-blue-900 text-gray-900 py-3 px-4 border-b border-gray-50 last:border-b-0"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate text-base font-poppins">{option.display || option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}