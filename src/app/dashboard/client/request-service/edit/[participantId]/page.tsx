"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Check,
  ArrowLeft,
  Search,
  Loader2,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import ClientDashboardLayout from "@/components/dashboard/client/ClientDashboardLayout";

// Types
interface Category {
  id: string;
  name: string;
  subcategories: { id: string; name: string }[];
}

interface DaySchedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface PreferredDays {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface Suburb {
  name: string;
  postcode: number;
  state: {
    abbreviation: string;
  };
}

interface ServiceRequestData {
  id: string;
  services: Record<string, { categoryName: string; subCategories: { id: string; name: string }[] }>;
  location: string;
  details: {
    title?: string;
    description?: string;
    schedulingPrefs?: {
      preferredDays?: (string | { day: string; startTime?: string; endTime?: string })[];
      frequency?: string;
      sessionsPerWeek?: number;
      hoursPerWeek?: number;
      scheduling?: string;
      startPreference?: string;
      startDate?: string;
    };
    preferredWorkerGender?: string;
    specialRequirements?: string;
  };
  participant: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// Constants
const STEPS = [
  { id: "services", label: "Services" },
  { id: "location", label: "Location" },
  { id: "when", label: "Schedule" },
  { id: "preferences", label: "Worker Preferences" },
];

const frequencyOptions = [
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
  { value: "one-time", label: "One-time" },
  { value: "as-needed", label: "As needed" },
];

const daysOfWeek = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
] as const;

const genderOptions = [
  { value: "", label: "No preference" },
  { value: "male", label: "Male workers only" },
  { value: "female", label: "Female workers only" },
  { value: "non-binary", label: "Non-binary workers only" },
];

const defaultDaySchedule: DaySchedule = {
  enabled: false,
  startTime: "",
  endTime: "",
};

export default function EditServiceRequestPage({
  params,
}: {
  params: Promise<{ participantId: string }>;
}) {
  const { participantId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [serviceRequest, setServiceRequest] = useState<ServiceRequestData | null>(null);

  // Form state - Services
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);

  // Form state - Location
  const [location, setLocation] = useState("");
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [suburbs, setSuburbs] = useState<Suburb[]>([]);
  const [isLoadingSuburbs, setIsLoadingSuburbs] = useState(false);
  const [showSuburbDropdown, setShowSuburbDropdown] = useState(false);
  const isSuburbSelectedRef = useRef(false);
  const suburbDropdownRef = useRef<HTMLDivElement>(null);

  // Form state - When
  const [frequency, setFrequency] = useState("weekly");
  const [sessionsPerWeek, setSessionsPerWeek] = useState(1);
  const [hoursPerWeek, setHoursPerWeek] = useState(2.5);
  const [startPreference, setStartPreference] = useState("");
  const [specificDate, setSpecificDate] = useState("");
  const [scheduling, setScheduling] = useState("");
  const [preferredDays, setPreferredDays] = useState<PreferredDays>({
    monday: { ...defaultDaySchedule },
    tuesday: { ...defaultDaySchedule },
    wednesday: { ...defaultDaySchedule },
    thursday: { ...defaultDaySchedule },
    friday: { ...defaultDaySchedule },
    saturday: { ...defaultDaySchedule },
    sunday: { ...defaultDaySchedule },
  });
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Form state - Preferences
  const [preferredGender, setPreferredGender] = useState("");
  const [preferredQualities, setPreferredQualities] = useState("");

  // Dropdown states
  const [isFrequencyOpen, setIsFrequencyOpen] = useState(false);
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [isExamplesOpen, setIsExamplesOpen] = useState(false);

  // Time validation errors
  const [timeErrors, setTimeErrors] = useState<Record<string, string>>({});

  const displayName = session?.user?.email?.split("@")[0] || "User";

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [categoriesRes, participantRes] = await Promise.all([
          fetch("/api/categories"),
          fetch(`/api/client/participants/${participantId}`),
        ]);

        if (!categoriesRes.ok) throw new Error("Failed to fetch categories");
        if (!participantRes.ok) throw new Error("Failed to fetch participant data");

        const categoriesData = await categoriesRes.json();
        const participantData = await participantRes.json();

        setCategories(categoriesData);

        const sr = participantData.data?.serviceRequest;
        if (sr) {
          setServiceRequest({
            id: sr.id,
            services: sr.services || {},
            location: sr.location || "",
            details: sr.details || {},
            participant: participantData.data,
          });

          // Pre-populate Services
          const services = sr.services || {};
          const categoryIds = Object.keys(services);
          setSelectedCategories(categoryIds);

          const subIds: string[] = [];
          Object.values(services).forEach((cat: any) => {
            if (cat.subCategories) {
              cat.subCategories.forEach((sub: any) => {
                if (sub.id && !sub.id.startsWith("other-")) {
                  subIds.push(sub.id);
                }
              });
            }
          });
          setSelectedSubcategories(subIds);

          // Pre-populate Location
          setLocation(sr.location || "");

          // Pre-populate When
          const details = sr.details || {};
          const schedulingPrefs = details.schedulingPrefs || {};
          if (schedulingPrefs.frequency) setFrequency(schedulingPrefs.frequency);
          if (schedulingPrefs.sessionsPerWeek) setSessionsPerWeek(schedulingPrefs.sessionsPerWeek);
          if (schedulingPrefs.hoursPerWeek) setHoursPerWeek(schedulingPrefs.hoursPerWeek);
          if (schedulingPrefs.scheduling) {
            setScheduling(schedulingPrefs.scheduling);
          }
          if (schedulingPrefs.startPreference) {
            setStartPreference(schedulingPrefs.startPreference);
          }
          if (schedulingPrefs.startDate) {
            setSpecificDate(schedulingPrefs.startDate);
          }
          if (schedulingPrefs.preferredDays && schedulingPrefs.preferredDays.length > 0) {
            setScheduling("preferred");
            const updatedDays = { ...preferredDays };
            schedulingPrefs.preferredDays.forEach((dayData: string | { day: string; startTime?: string; endTime?: string }) => {
              // Handle both old format (string) and new format (object with times)
              if (typeof dayData === "string") {
                const dayKey = dayData.toLowerCase() as keyof PreferredDays;
                if (updatedDays[dayKey]) {
                  updatedDays[dayKey] = { ...updatedDays[dayKey], enabled: true };
                }
              } else {
                const dayKey = dayData.day.toLowerCase() as keyof PreferredDays;
                if (updatedDays[dayKey]) {
                  updatedDays[dayKey] = {
                    enabled: true,
                    startTime: dayData.startTime || "",
                    endTime: dayData.endTime || "",
                  };
                }
              }
            });
            setPreferredDays(updatedDays);
          }
          if (details.description) setAdditionalNotes(details.description);

          // Pre-populate Preferences
          if (details.preferredWorkerGender) setPreferredGender(details.preferredWorkerGender);
          if (details.specialRequirements) setPreferredQualities(details.specialRequirements);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [participantId]);

  // Sync locationSearchQuery with location when data loads
  useEffect(() => {
    if (location && location !== locationSearchQuery) {
      isSuburbSelectedRef.current = true; // Prevent auto-fetch when pre-populating
      setLocationSearchQuery(location);
    }
  }, [location]);

  // Close suburb dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suburbDropdownRef.current && !suburbDropdownRef.current.contains(event.target as Node)) {
        setShowSuburbDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suburbs from API with debounce
  useEffect(() => {
    const fetchSuburbs = async () => {
      // Don't fetch if user just selected an item
      if (isSuburbSelectedRef.current) {
        isSuburbSelectedRef.current = false;
        return;
      }

      if (locationSearchQuery.length < 2) {
        setSuburbs([]);
        setShowSuburbDropdown(false);
        return;
      }

      setIsLoadingSuburbs(true);
      try {
        const response = await fetch(`/api/suburbs?q=${encodeURIComponent(locationSearchQuery)}`);
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          setSuburbs(data);
          setShowSuburbDropdown(true);
        } else {
          setSuburbs([]);
          setShowSuburbDropdown(false);
        }
      } catch (error) {
        setSuburbs([]);
        setShowSuburbDropdown(false);
      } finally {
        setIsLoadingSuburbs(false);
      }
    };

    const timeoutId = setTimeout(fetchSuburbs, 300);
    return () => clearTimeout(timeoutId);
  }, [locationSearchQuery]);

  // Handle suburb selection
  const handleSelectSuburb = (suburb: Suburb) => {
    const selectedValue = `${suburb.name}, ${suburb.state.abbreviation} ${suburb.postcode}`;
    isSuburbSelectedRef.current = true;
    setShowSuburbDropdown(false);
    setSuburbs([]);
    setLocationSearchQuery(selectedValue);
    setLocation(selectedValue);
  };

  // Navigation
  const goToNextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Services handlers
  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId));
      const category = categories.find((c) => c.id === categoryId);
      if (category) {
        const subIds = category.subcategories.map((s) => s.id);
        setSelectedSubcategories(selectedSubcategories.filter((id) => !subIds.includes(id)));
      }
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const toggleSubcategory = (subcategoryId: string) => {
    if (selectedSubcategories.includes(subcategoryId)) {
      setSelectedSubcategories(selectedSubcategories.filter((id) => id !== subcategoryId));
    } else {
      setSelectedSubcategories([...selectedSubcategories, subcategoryId]);
    }
  };

  // When handlers
  const toggleDay = (day: keyof PreferredDays) => {
    setPreferredDays({
      ...preferredDays,
      [day]: { ...preferredDays[day], enabled: !preferredDays[day].enabled },
    });
  };

  const updateDayTime = (day: keyof PreferredDays, field: "startTime" | "endTime", value: string) => {
    const updatedDay = { ...preferredDays[day], [field]: value };

    // Validate: end time should not be earlier than start time
    if (updatedDay.startTime && updatedDay.endTime) {
      if (updatedDay.endTime <= updatedDay.startTime) {
        setTimeErrors((prev) => ({
          ...prev,
          [day]: "End time must be later than start time",
        }));
      } else {
        setTimeErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[day];
          return newErrors;
        });
      }
    } else {
      // Clear error if one of the times is empty
      setTimeErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[day];
        return newErrors;
      });
    }

    setPreferredDays({
      ...preferredDays,
      [day]: updatedDay,
    });
  };

  // Save handler
  const handleSave = async () => {
    if (!serviceRequest) return;

    if (selectedCategories.length === 0) {
      setError("Please select at least one service");
      setCurrentStep(0);
      return;
    }
    if (!location.trim()) {
      setError("Please enter a location");
      setCurrentStep(1);
      return;
    }
    if (Object.keys(timeErrors).length > 0) {
      setError("Please fix the time validation errors before saving");
      setCurrentStep(2);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const services: Record<string, { categoryName: string; subCategories: { id: string; name: string }[] }> = {};
      selectedCategories.forEach((categoryId) => {
        const category = categories.find((c) => c.id === categoryId);
        if (category) {
          const selectedSubs = category.subcategories
            .filter((sub) => selectedSubcategories.includes(sub.id))
            .map((sub) => ({ id: sub.id, name: sub.name }));
          services[categoryId] = {
            categoryName: category.name,
            subCategories: selectedSubs.length > 0 ? selectedSubs : category.subcategories.map((s) => ({ id: s.id, name: s.name })),
          };
        }
      });

      const response = await fetch(`/api/client/service-request/${serviceRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          services,
          location,
          details: {
            title: `Support needed: ${Object.values(services).map(s => s.categoryName).join(", ")}`,
            description: additionalNotes || undefined,
            schedulingPrefs: {
              preferredDays: scheduling === "preferred"
                ? Object.entries(preferredDays)
                    .filter(([_, schedule]) => schedule.enabled)
                    .map(([day, schedule]) => ({
                      day: day.charAt(0).toUpperCase() + day.slice(1),
                      startTime: schedule.startTime || undefined,
                      endTime: schedule.endTime || undefined,
                    }))
                : undefined,
              frequency,
              sessionsPerWeek,
              hoursPerWeek,
              scheduling: scheduling || undefined,
              startPreference: startPreference || undefined,
              startDate: startPreference === "specific-date" ? specificDate : undefined,
            },
            preferredWorkerGender: preferredGender || undefined,
            specialRequirements: preferredQualities || undefined,
          },
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to update request");

      router.push("/dashboard/client/participants");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case "services":
        return (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 font-poppins mb-2">
              Services Requested
            </h2>
            <p className="text-gray-600 font-poppins text-sm mb-6">
              Select the support services needed. You can select multiple services.
            </p>
            <div className="space-y-4">
              {categories.map((category) => {
                const isSelected = selectedCategories.includes(category.id);
                return (
                  <div key={category.id}>
                    <div
                      onClick={() => toggleCategory(category.id)}
                      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected ? "border-indigo-500 bg-indigo-50/50" : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected ? "bg-indigo-600 border-indigo-600" : "border-gray-300 bg-white"
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <h3 className="font-medium text-gray-900 font-poppins">{category.name}</h3>
                      </div>
                    </div>
                    {isSelected && category.subcategories.length > 0 && (
                      <div className="mt-2 ml-8 pl-4 border-l-2 border-indigo-200">
                        <p className="text-sm text-gray-600 mb-2 font-poppins">Select specific services:</p>
                        <div className="flex flex-wrap justify-start gap-1.5 sm:gap-2">
                          {category.subcategories.map((sub) => {
                            const isSubSelected = selectedSubcategories.includes(sub.id);
                            return (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() => toggleSubcategory(sub.id)}
                                className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border text-xs sm:text-sm font-poppins transition-all ${
                                  isSubSelected ? "bg-indigo-100 border-indigo-300 text-indigo-900" : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                                }`}
                              >
                                {isSubSelected && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                                {sub.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "location":
        return (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 font-poppins mb-2">Location</h2>
            <p className="text-gray-600 font-poppins text-sm mb-6">
              The starting suburb where support will take place. Start typing the suburb or postcode and select from the list.
            </p>
            <div className="relative" ref={suburbDropdownRef}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
              {isLoadingSuburbs && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin z-10" />
              )}
              <input
                type="text"
                value={locationSearchQuery}
                onChange={(e) => setLocationSearchQuery(e.target.value)}
                onFocus={() => {
                  if (suburbs.length > 0) setShowSuburbDropdown(true);
                }}
                className="w-full pl-12 pr-12 py-4 text-lg font-poppins border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
                placeholder="Search suburb or postcode..."
              />

              {/* Dropdown */}
              {showSuburbDropdown && suburbs.length > 0 && (
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
            {location && (
              <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <p className="text-sm text-gray-600 font-poppins">Selected location:</p>
                <p className="text-lg font-medium text-indigo-900 font-poppins">
                  {location}
                </p>
              </div>
            )}
          </div>
        );

      case "when":
        return (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 font-poppins mb-6">Frequency, dates and times</h2>
            <div className="space-y-8">
              {/* Frequency */}
              <div>
                <label className="block text-gray-900 font-medium font-poppins mb-2">How often do you need the support?</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsFrequencyOpen(!isFrequencyOpen)}
                    className="w-full md:w-96 flex items-center justify-between px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-left font-poppins focus:border-indigo-500 focus:outline-none"
                  >
                    <span className="text-gray-900">{frequencyOptions.find(o => o.value === frequency)?.label}</span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isFrequencyOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isFrequencyOpen && (
                    <div className="absolute z-10 w-full md:w-96 mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg">
                      {frequencyOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => { setFrequency(option.value); setIsFrequencyOpen(false); }}
                          className={`w-full text-left px-4 py-3 font-poppins hover:bg-indigo-50 transition-colors ${frequency === option.value ? "bg-indigo-50 text-indigo-900" : "text-gray-900"}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sessions per week */}
              <div>
                <label className="block text-gray-900 font-medium font-poppins mb-2">How many support sessions per week?</label>
                <div className="flex items-center w-28 border-2 border-gray-200 rounded-lg overflow-hidden">
                  <button type="button" onClick={() => sessionsPerWeek > 1 && setSessionsPerWeek(sessionsPerWeek - 1)} className="px-2 py-2 text-gray-500 hover:bg-gray-100">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={sessionsPerWeek}
                    onChange={(e) => setSessionsPerWeek(Math.max(1, Math.min(14, parseInt(e.target.value) || 1)))}
                    className="flex-1 text-center py-2 font-poppins text-gray-900 focus:outline-none w-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button type="button" onClick={() => sessionsPerWeek < 14 && setSessionsPerWeek(sessionsPerWeek + 1)} className="px-2 py-2 text-gray-500 hover:bg-gray-100">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Hours per week */}
              <div>
                <label className="block text-gray-900 font-medium font-poppins mb-2">Estimated total hours per week?</label>
                <div className="flex items-center w-28 border-2 border-gray-200 rounded-lg overflow-hidden">
                  <button type="button" onClick={() => hoursPerWeek > 0.5 && setHoursPerWeek(hoursPerWeek - 0.5)} className="px-2 py-2 text-gray-500 hover:bg-gray-100">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(Math.max(0.5, Math.min(168, parseFloat(e.target.value) || 0.5)))}
                    className="flex-1 text-center py-2 font-poppins text-gray-900 focus:outline-none w-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    step="0.5"
                  />
                  <button type="button" onClick={() => hoursPerWeek < 168 && setHoursPerWeek(hoursPerWeek + 0.5)} className="px-2 py-2 text-gray-500 hover:bg-gray-100">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Start preference */}
              <div>
                <label className="block text-gray-900 font-medium font-poppins mb-3">When would you like the support to start?</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" value="asap" checked={startPreference === "asap"} onChange={() => setStartPreference("asap")} className="w-5 h-5 text-indigo-600" />
                    <span className="font-poppins text-gray-700">As soon as possible</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" value="specific-date" checked={startPreference === "specific-date"} onChange={() => setStartPreference("specific-date")} className="w-5 h-5 text-indigo-600" />
                    <span className="font-poppins text-gray-700">From a specific date</span>
                  </label>
                  {startPreference === "specific-date" && (
                    <div className="ml-8 mt-2">
                      <input type="date" value={specificDate} onChange={(e) => setSpecificDate(e.target.value)} className="px-4 py-3 border-2 border-gray-200 rounded-lg font-poppins focus:border-indigo-500 focus:outline-none" min={new Date().toISOString().split("T")[0]} />
                    </div>
                  )}
                </div>
              </div>

              {/* Scheduling */}
              <div>
                <label className="block text-gray-900 font-medium font-poppins mb-3">Scheduling</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" value="flexible" checked={scheduling === "flexible"} onChange={() => setScheduling("flexible")} className="w-5 h-5 text-indigo-600" />
                    <span className="font-poppins text-gray-700">I'm flexible</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" value="preferred" checked={scheduling === "preferred"} onChange={() => setScheduling("preferred")} className="w-5 h-5 text-indigo-600" />
                    <span className="font-poppins text-gray-700">I have preferred days and times</span>
                  </label>
                  {scheduling === "preferred" && (
                    <div className="mt-6 space-y-4">
                      <p className="text-gray-600 text-sm font-poppins">Set your start and end time for each day you're available.</p>
                      {daysOfWeek.map(({ key, label }) => {
                        const daySchedule = preferredDays[key];
                        return (
                          <div key={key} className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <div onClick={() => toggleDay(key)} className={`w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${daySchedule.enabled ? "bg-indigo-600 border-indigo-600" : "border-gray-300 bg-white"}`}>
                                {daySchedule.enabled && <Check className="w-4 h-4 text-white" />}
                              </div>
                              <span className="font-poppins font-medium text-gray-900">{label}</span>
                            </label>
                            {daySchedule.enabled && (
                              <div className="ml-9">
                                <div className="flex flex-wrap gap-4">
                                  <div>
                                    <label className="block text-sm text-gray-600 font-poppins mb-1">Start time</label>
                                    <input type="time" value={daySchedule.startTime} onChange={(e) => updateDayTime(key, "startTime", e.target.value)} className={`w-40 px-4 py-2.5 border-2 rounded-lg font-poppins focus:outline-none ${timeErrors[key] ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-indigo-500"}`} />
                                  </div>
                                  <div>
                                    <label className="block text-sm text-gray-600 font-poppins mb-1">End time</label>
                                    <input type="time" value={daySchedule.endTime} onChange={(e) => updateDayTime(key, "endTime", e.target.value)} className={`w-40 px-4 py-2.5 border-2 rounded-lg font-poppins focus:outline-none ${timeErrors[key] ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-indigo-500"}`} />
                                  </div>
                                </div>
                                {timeErrors[key] && (
                                  <p className="text-red-600 text-sm font-poppins mt-1">{timeErrors[key]}</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Additional notes */}
              <div>
                <label className="block text-gray-900 font-medium font-poppins mb-2">Anything else? (optional)</label>
                <p className="text-gray-500 text-sm font-poppins mb-2">Add detail about how flexible your days and times are and your preferences.</p>
                <textarea value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} rows={4} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-poppins focus:border-indigo-500 focus:outline-none resize-y" placeholder="Enter any additional details..." />
              </div>
            </div>
          </div>
        );

      case "preferences":
        return (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 font-poppins mb-6">Preferences</h2>
            <div className="space-y-8">
              {/* Preferred gender */}
              <div>
                <label className="block text-gray-900 font-medium font-poppins mb-1">Preferred worker gender (optional)</label>
                <p className="text-gray-500 text-sm font-poppins mb-3">We'll only match you with workers who meet your gender preferences.</p>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsGenderOpen(!isGenderOpen)}
                    className="w-full md:w-96 flex items-center justify-between px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-left font-poppins focus:border-indigo-500 focus:outline-none"
                  >
                    <span className={preferredGender ? "text-gray-900" : "text-gray-500"}>{genderOptions.find(o => o.value === preferredGender)?.label || "No preference"}</span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isGenderOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isGenderOpen && (
                    <div className="absolute z-10 w-full md:w-96 mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg">
                      {genderOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => { setPreferredGender(option.value); setIsGenderOpen(false); }}
                          className={`w-full text-left px-4 py-3 font-poppins hover:bg-indigo-50 transition-colors ${preferredGender === option.value ? "bg-indigo-50 text-indigo-900" : "text-gray-900"}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Preferred qualities */}
              <div>
                <label className="block text-gray-900 font-medium font-poppins mb-1">What preferred qualities do you seek in a support worker? (optional)</label>
                <p className="text-gray-500 text-sm font-poppins mb-3">May include personality, skills, experience, age, language etc.</p>
                <textarea
                  value={preferredQualities}
                  onChange={(e) => e.target.value.length <= 1500 && setPreferredQualities(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-poppins focus:border-indigo-500 focus:outline-none resize-y"
                  placeholder="Someone who..."
                />
                <div className="flex justify-end mt-2 text-sm font-poppins text-gray-500">
                  {preferredQualities.length}/1500
                </div>
              </div>

              {/* Examples */}
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsExamplesOpen(!isExamplesOpen)}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <Info className="w-5 h-5 text-indigo-600" />
                  <span className="text-indigo-600 font-medium font-poppins">Examples</span>
                  {isExamplesOpen ? <ChevronUp className="w-5 h-5 text-gray-400 ml-auto" /> : <ChevronDown className="w-5 h-5 text-gray-400 ml-auto" />}
                </button>
                {isExamplesOpen && (
                  <div className="px-4 py-4 bg-white space-y-4">
                    <div>
                      <p className="font-medium text-gray-900 font-poppins mb-2">Example 1</p>
                      <ul className="list-disc ml-5 text-gray-600 font-poppins text-sm space-y-1">
                        <li>"Someone who is young, energetic and friendly.</li>
                        <li>Prefer someone who has experience with Autism.</li>
                        <li>Prefer someone who shares an interest in board games."</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 font-poppins mb-2">Example 2</p>
                      <ul className="list-disc ml-5 text-gray-600 font-poppins text-sm space-y-1">
                        <li>"Someone who is reliable.</li>
                        <li>Must speak Italian."</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <ClientDashboardLayout profileData={{ firstName: displayName, photo: null }}>
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout profileData={{ firstName: displayName, photo: null }}>
      <div className="p-6 md:p-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-poppins mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Participants
          </button>
          <h1 className="text-xl md:text-2xl font-semibold font-poppins text-gray-900">
            Modify Service Request
          </h1>
          {serviceRequest?.participant && (
            <p className="text-gray-600 font-poppins mt-1">
              For {serviceRequest.participant.firstName} {serviceRequest.participant.lastName}
            </p>
          )}
        </div>

        {/* Step Indicator - Hidden on mobile */}
        <div className="hidden md:block mb-6">
          <div className="flex items-center gap-2">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(index)}
                  className={`px-4 py-2 rounded-lg font-poppins text-sm font-medium transition-colors ${
                    index === currentStep
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {step.label}
                </button>
                {index < STEPS.length - 1 && <div className="w-4 h-px bg-gray-300 mx-1" />}
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-poppins">{error}</p>
          </div>
        )}

        {/* Step Content */}
        {renderStepContent()}

        {/* Navigation Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mt-6">
          <button
            type="button"
            onClick={currentStep === 0 ? () => router.back() : goToPreviousStep}
            disabled={isSaving}
            className="w-full sm:w-auto px-5 py-2.5 text-gray-700 font-medium font-poppins border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {currentStep === 0 ? "Cancel" : "Previous"}
          </button>
          <button
            type="button"
            onClick={currentStep === STEPS.length - 1 ? handleSave : goToNextStep}
            disabled={isSaving}
            className="w-full sm:w-auto px-5 py-2.5 text-white font-medium font-poppins rounded-lg transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#0C1628" }}
          >
            {isSaving ? "Saving..." : currentStep === STEPS.length - 1 ? "Save Changes" : "Next"}
          </button>
        </div>
      </div>
    </ClientDashboardLayout>
  );
}
