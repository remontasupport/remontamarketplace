"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LocationDropdown } from "@/components/ui/location-dropdown";
import { searchAustralianLocations, type AustralianLocation } from "@/lib/data/australianPostcodes";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Validation schema using Zod
const formSchema = z.object({
  // Step 1 - Required fields
  location: z.string().min(1, "Location is required"),
  services: z.array(z.string()).min(1, "Please select at least one service"),
  experience: z.string().optional(), // Optional field

  // Step 2 - Optional fields
  availability: z.string().optional(),
  startDate: z.string().optional(),

  // Step 3 - Required fields
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
  mobile: z.string()
    .min(1, "Mobile number is required")
    .refine((mobile) => {
      const cleanMobile = mobile.replace(/\D/g, '');
      return (
        (cleanMobile.length === 10 && cleanMobile.startsWith('04')) ||
        (cleanMobile.length === 11 && cleanMobile.startsWith('614')) ||
        (mobile.startsWith('+61') && cleanMobile.length === 11 && cleanMobile.startsWith('614'))
      );
    }, "Please enter a valid Australian mobile number (e.g., 04XX XXX XXX)"),

  // New profile questions
  funFact: z.string().min(1, "Fun fact is required"),
  hobbies: z.string().min(1, "Hobbies and interests are required"),
  uniqueService: z.string().min(1, "Please tell us what makes your service unique"),
  whyEnjoyWork: z.string().min(1, "Please tell us why you enjoy your work"),
  additionalInfo: z.string().optional(),
  qualifications: z.string().min(1, "Qualifications and certificates are required"),
  hasVehicle: z.string().min(1, "Please indicate if you have vehicle access"),
  photos: z.array(z.any()).min(1, "Please upload at least one photo"),
  consentProfileShare: z.boolean().refine((val) => val === true, "Profile sharing consent is required"),
  consentMarketing: z.boolean().optional(), // Optional consent
});

type FormData = z.infer<typeof formSchema>;

export default function ContractorOnboarding() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      location: "",
      services: [],
      experience: "",
      availability: "",
      startDate: "",
      firstName: "",
      lastName: "",
      email: "",
      mobile: "",
      funFact: "",
      hobbies: "",
      uniqueService: "",
      whyEnjoyWork: "",
      additionalInfo: "",
      qualifications: "",
      hasVehicle: "",
      photos: [],
      consentProfileShare: false,
      consentMarketing: false,
    },
  });

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  // Get form values for easier access
  const watchedValues = form.watch();

  // Validate required fields for current step using React Hook Form
  const validateCurrentStep = async (step: number) => {
    const fieldsToValidate: (keyof FormData)[] = [];

    if (step === 1) {
      fieldsToValidate.push("location", "services");
    } else if (step === 3) {
      fieldsToValidate.push("firstName", "lastName", "email", "mobile", "funFact", "hobbies", "uniqueService", "whyEnjoyWork");
    } else if (step === 4) {
      fieldsToValidate.push(
        "qualifications", "hasVehicle", "photos", "consentProfileShare"
      );
    }

    // Step 2 has no required fields, always valid
    if (step === 2) return true;

    // Trigger validation for specific fields
    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const serviceOptions = [
    "Support Worker",
    "Home Modifications",
    "Cleaning Services",
    "Home and Yard Maintenance",
    "Therapeutic Supports",
    "Fitness and Rehabilitation",
    "Nursing"
  ];

  const handleServiceToggle = (service: string) => {
    const currentServices = form.getValues("services");
    const updatedServices = currentServices.includes(service)
      ? currentServices.filter(s => s !== service)
      : [...currentServices, service];
    form.setValue("services", updatedServices);
    form.trigger("services"); // Validate immediately
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });

    const currentPhotos = form.getValues("photos");
    const newPhotos = [...currentPhotos, ...validFiles].slice(0, 5);
    form.setValue("photos", newPhotos);
    form.trigger("photos"); // Validate immediately
  };

  const removePhoto = (index: number) => {
    const currentPhotos = form.getValues("photos");
    const updatedPhotos = currentPhotos.filter((_, i) => i !== index);
    form.setValue("photos", updatedPhotos);
    form.trigger("photos"); // Validate immediately
  };

  const sendVerificationCode = () => {
    // Simulate sending verification code
    setIsCodeSent(true);
  };

  const nextStep = async () => {
    if (currentStep < totalSteps) {
      // Validate required fields for current step before proceeding
      const isValid = await validateCurrentStep(currentStep);
      if (isValid) {
        setCurrentStep(currentStep + 1);
      } else {
        // The Radix form components will automatically show error messages
        console.log("Validation failed for step", currentStep);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      console.log("🚀 FORM SUBMISSION - Starting Zoho CRM Integration");

      // Show loading state
      const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting to CRM...';
      }

      // Prepare form data for Zoho CRM API
      const formData = new FormData();

      // Add all form fields
      formData.append('firstName', data.firstName);
      formData.append('lastName', data.lastName);
      formData.append('email', data.email);
      formData.append('mobile', data.mobile);
      formData.append('location', data.location);
      formData.append('services', JSON.stringify(data.services));
      formData.append('experience', data.experience || '');
      formData.append('availability', data.availability || '');
      formData.append('startDate', data.startDate || '');
      formData.append('funFact', data.funFact || '');
      formData.append('hobbies', data.hobbies || '');
      formData.append('uniqueService', data.uniqueService || '');
      formData.append('whyEnjoyWork', data.whyEnjoyWork || '');
      formData.append('additionalInfo', data.additionalInfo || '');
      formData.append('qualifications', data.qualifications);
      formData.append('hasVehicle', data.hasVehicle);
      formData.append('consentProfileShare', data.consentProfileShare.toString());
      formData.append('consentMarketing', (data.consentMarketing || false).toString());

      // Add photos
      data.photos.forEach((photo, index) => {
        formData.append(`photo_${index}`, photo);
      });

      console.log("📤 Submitting to Zoho CRM...");

      // Submit to Zoho CRM via our API
      const response = await fetch('/api/zoho/submit-contractor', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        console.log("✅ Successfully submitted to Zoho CRM:", result);
        alert(`✅ Registration completed successfully!\n\nYour application has been submitted to our CRM system.\nRecord ID: ${result.data.crmRecordId}\nPhotos uploaded: ${result.data.attachmentsUploaded}`);

        // Redirect to success page or dashboard
        window.location.href = "/registration/contractor/success";
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }

    } catch (error) {
      console.error("❌ Error submitting to Zoho CRM:", error);

      // Show error message to user
      alert(`❌ Submission failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or contact support.`);

      // Re-enable submit button
      const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Complete Signup';
      }
    }
  });

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-xl font-poppins font-medium">Where are you located? <span className="text-red-500">*</span></Label>
              <div className="mt-2">
                <LocationDropdown
                  value={watchedValues.location}
                  onValueChange={(value) => {
                    console.log("Form updating with value:", value);
                    form.setValue("location", value);
                    form.trigger("location");
                  }}
                  placeholder="Search postcode or suburb..."
                  searchPlaceholder="Type to search..."
                  emptyMessage="No locations found."
                  onSearch={(query) => {
                    const results = searchAustralianLocations(query);
                    return results.map(location => ({
                      value: location.display,
                      label: location.display,
                      display: location.display
                    }));
                  }}
                  options={[]}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <Label className="text-xl font-poppins font-medium">Services you want to offer <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {serviceOptions.map((service) => (
                  <div key={service} className="flex items-center space-x-2">
                    <Checkbox
                      id={service}
                      checked={watchedValues.services.includes(service)}
                      onCheckedChange={() => handleServiceToggle(service)}
                    />
                    <Label htmlFor={service} className="text-xl font-poppins font-normal">
                      {service}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xl font-cooper font-normal">Years of Experience</Label>
              <div className="mt-2">
                <Input
                  type="number"
                  min="0"
                  max="99"
                  value={watchedValues.experience}
                  onChange={(e) => {
                    form.setValue("experience", e.target.value);
                  }}
                  placeholder="Enter years of experience"
                  className="w-full text-xl font-poppins"
                />
              </div>
            </div>


            {showGuidelines && (
              <Card className="bg-blue-50">
                <CardContent className="pt-4">
                  <p className="text-sm text-blue-800">
                    Service rates vary by location and complexity. Typical ranges:
                    <br />• Support Worker: $25-35/hour
                    <br />• Home Maintenance: $30-50/hour
                    <br />• Cleaning Services: $25-40/hour
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-xl font-poppins font-medium">How many hours per week are you available?</Label>
              <RadioGroup
                value={watchedValues.availability}
                onValueChange={(value) => {
                  form.setValue("availability", value);
                }}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1-2-hrs" id="1-2-hrs" />
                  <Label htmlFor="1-2-hrs" className="text-xl font-poppins">1-2 hrs</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3-4-hrs" id="3-4-hrs" />
                  <Label htmlFor="3-4-hrs" className="text-xl font-poppins">3-4 hrs</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="more-than-5-hrs" id="more-than-5-hrs" />
                  <Label htmlFor="more-than-5-hrs" className="text-xl font-poppins">More than 4 hrs</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="startDate" className="text-xl font-poppins font-medium">When can you start?</Label>
              <Select onValueChange={(value) => {
                form.setValue("startDate", value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select start date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediately">Immediately</SelectItem>
                  <SelectItem value="within-week">Within a week</SelectItem>
                  <SelectItem value="within-month">Within a month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-xl font-poppins font-medium">First Name <span className="text-red-500">*</span></Label>
                <Input
                  id="firstName"
                  value={watchedValues.firstName}
                  onChange={(e) => {
                    form.setValue("firstName", e.target.value);
                    form.trigger("firstName");
                  }}
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-xl font-poppins font-medium">Last Name <span className="text-red-500">*</span></Label>
                <Input
                  id="lastName"
                  value={watchedValues.lastName}
                  onChange={(e) => {
                    form.setValue("lastName", e.target.value);
                    form.trigger("lastName");
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xl font-poppins font-medium">
                      Email Address <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm font-poppins" />
                  </FormItem>
                )}
              />

              {/* Mobile Field */}
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xl font-poppins font-medium">
                      Mobile Number <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="04XX XXX XXX" {...field} />
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm font-poppins" />
                  </FormItem>
                )}
              />
            </div>

            {/* New Profile Questions */}
            <FormField
              control={form.control}
              name="funFact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xl font-cooper font-normal">
                    A Fun Fact About Yourself <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share something interesting or fun about yourself..."
                      rows={3}
                      className="text-xl font-poppins"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm font-poppins" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hobbies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xl font-cooper font-normal">
                    Hobbies and/or Interests <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about your hobbies and interests..."
                      rows={3}
                      className="text-xl font-poppins"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm font-poppins" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="uniqueService"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xl font-cooper font-normal">
                    What Makes Your Service Unique? <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What sets you apart from other service providers..."
                      rows={3}
                      className="text-xl font-poppins"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm font-poppins" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whyEnjoyWork"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xl font-cooper font-normal">
                    Why Do You Enjoy Your Work? <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share what motivates and fulfills you in this work..."
                      rows={3}
                      className="text-xl font-poppins"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm font-poppins" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="additionalInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xl font-cooper font-normal">Additional Information</FormLabel>
                  <p className="text-sm font-poppins text-gray-600 mt-1 mb-2">
                    Anything else you'd like to include about yourself or your services.
                  </p>
                  <FormControl>
                    <Textarea
                      placeholder="Share any additional information you'd like clients to know..."
                      rows={4}
                      className="text-xl font-poppins"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm font-poppins" />
                </FormItem>
              )}
            />

            {/* <div>
              <Label htmlFor="password" className="text-xl font-poppins font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => updateFormData("password", e.target.value)}
              />
            </div> */}

          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="qualifications" className="text-xl font-cooper font-normal">Qualifications and Certificates <span className="text-red-500">*</span></Label>
              <Textarea
                id="qualifications"
                placeholder="Tell us about your relevant qualifications and certificates..."
                value={watchedValues.qualifications}
                onChange={(e) => {
                  form.setValue("qualifications", e.target.value);
                  form.trigger("qualifications");
                }}
                rows={4}
                className="mt-2 text-xl font-poppins"
              />
            </div>

            <div>
              <Label className="text-xl font-cooper font-normal">Do you drive and have access to a vehicle? <span className="text-red-500">*</span></Label>
              <RadioGroup
                value={watchedValues.hasVehicle}
                onValueChange={(value) => {
                  form.setValue("hasVehicle", value);
                  form.trigger("hasVehicle");
                }}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="yes" />
                  <Label htmlFor="yes" className="text-xl font-poppins">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no" className="text-xl font-poppins">No</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-xl font-cooper font-normal">Photo Submission <span className="text-red-500">*</span></Label>
              <p className="text-lg font-poppins text-gray-600 mt-2 mb-4">
                Please attach 3-5 high-quality photos of yourself. Ensure the photo is:
              </p>
              <div className="space-y-2 mb-4 text-sm font-poppins text-gray-700">
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Taken in a well-lit area</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Clear and in focus</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Candid, friendly, and genuine (avoid heavy filters or overly posed shots)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Show a bit of your personality – a smile, a laugh, or a natural moment works great</span>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <span className="text-lg font-poppins text-gray-700">Choose File(s)</span>
                  <span className="text-sm font-poppins text-gray-500">Upload up to 5 photos (Max 10MB each)</span>
                </label>
              </div>

              {watchedValues.photos.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-poppins text-gray-600 mb-2">Uploaded photos:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {watchedValues.photos.map((file: File, index: number) => (
                      <div key={index} className="relative bg-gray-100 rounded-lg p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-poppins truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label className="text-xl font-cooper font-normal">Consent to Share Profile with Clients <span className="text-red-500">*</span></Label>
              <Card className="mt-2 p-4 border border-gray-200">
                <p className="text-sm font-poppins text-gray-700 mb-3">
                  By ticking this box, I consent to Remonta sharing my submitted profile information and photo(s) with potential clients.
                </p>
                <p className="text-sm font-poppins text-gray-700 mb-3">
                  As part of working with <strong>Remonta</strong>, I understand and agree that my submitted profile information and photo(s) will be shared with potential clients to help them choose the right worker for their needs.
                </p>
                <p className="text-sm font-poppins text-gray-700 mb-4">
                  This is a necessary requirement to be considered for work opportunities.
                </p>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="consent-profile"
                    checked={watchedValues.consentProfileShare}
                    onCheckedChange={(checked) => {
                      const isChecked = !!checked;
                      form.setValue("consentProfileShare", isChecked);
                      form.trigger("consentProfileShare");
                    }}
                  />
                  <Label htmlFor="consent-profile" className="text-sm font-poppins">
                    I acknowledge and consent to my profile and photo will be shared with clients for matching purposes.
                  </Label>
                </div>
              </Card>
            </div>

            <div>
              <Label className="text-xl font-cooper font-normal">Consent for Marketing and Social Media (Optional but Recommended)</Label>
              <Card className="mt-2 p-4 border border-gray-200">
                <p className="text-sm font-poppins text-gray-700 mb-3">
                  By ticking this box, I consent to <strong>Remonta</strong> using my submitted profile information and photo(s) for promotional purposes, including but not limited to the company website, social media channels, and marketing materials.
                </p>
                <p className="text-sm font-poppins text-gray-700 mb-3">
                  This helps promote my services to a wider audience and may result in more opportunities.
                </p>
                <p className="text-sm font-poppins text-gray-700 mb-4">
                  I understand that my image and information may be <strong>publicly visible</strong> to promote Remonta's services and my own.
                </p>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="consent-marketing"
                    checked={watchedValues.consentMarketing}
                    onCheckedChange={(checked) => {
                      form.setValue("consentMarketing", !!checked);
                      form.trigger("consentMarketing");
                    }}
                  />
                  <Label htmlFor="consent-marketing" className="text-sm font-poppins">
                    I consent to the use of my profile and photo for marketing and social media purposes.
                  </Label>
                </div>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Show welcome message first
  if (showWelcome) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardContent className="p-12 text-center space-y-6">
              <div className="space-y-6">
                <h1 className="text-4xl text-gray-900 font-cooper">
                  Welcome to LocalAid
                </h1>
                <div className="bg-[#EDEFF3] rounded-lg p-6 text-left max-w-lg mx-auto">
                  <p className="text-lg text-[#0C1628] font-poppins font-medium mb-4">
                    There are thousands of people on LocalAid looking for support workers just like you. Create your account today:
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-800 font-poppins">Receive paid training</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-800 font-poppins">Hireup handles your tax, super and benefits</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-800 font-poppins">No experience necessary</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={() => setShowWelcome(false)}
                  className="bg-[#0C1628] hover:bg-[#A3DEDE] text-white px-8 py-3 text-lg font-poppins font-medium rounded-lg transition-colors duration-200 border-0"
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show registration form
  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardHeader>
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderStep()}

              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                {currentStep === totalSteps ? (
                  <Button type="submit" className="flex items-center gap-2">
                    Complete Signup
                  </Button>
                ) : (
                  <Button type="button" onClick={nextStep} className="flex items-center gap-2">
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </Form>
  );
}