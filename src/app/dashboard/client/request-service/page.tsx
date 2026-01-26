"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import ClientDashboardLayout from "@/components/dashboard/client/ClientDashboardLayout";
import RequestServiceLayout from "@/components/dashboard/client/request-service/RequestServiceLayout";
import WhatSection from "@/components/dashboard/client/request-service/sections/WhatSection";
import WhereSection from "@/components/dashboard/client/request-service/sections/WhereSection";
import WhenSection from "@/components/dashboard/client/request-service/sections/WhenSection";
import DetailsSection from "@/components/dashboard/client/request-service/sections/DetailsSection";
import DiagnosesSection from "@/components/dashboard/client/request-service/sections/DiagnosesSection";
import PreferencesSection from "@/components/dashboard/client/request-service/sections/PreferencesSection";
import SupportDetailsSection from "@/components/dashboard/client/request-service/sections/SupportDetailsSection";
import PreviewSection from "@/components/dashboard/client/request-service/sections/PreviewSection";

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

interface WhenData {
  frequency: string;
  sessionsPerWeek: number;
  hoursPerWeek: number;
  startPreference: string;
  specificDate: string;
  scheduling: string;
  preferredDays: PreferredDays;
  additionalNotes: string;
}

const defaultDaySchedule: DaySchedule = {
  enabled: false,
  startTime: "",
  endTime: "",
};

interface DetailsData {
  fullName: string;
  preferredName: string;
  gender: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
}

interface PreferencesData {
  preferredGender: string;
  preferredQualities: string;
}

interface SupportDetailsData {
  jobTitle: string;
}

interface OtherServices {
  [categoryId: string]: {
    selected: boolean;
    text: string;
  };
}

function RequestServiceContent() {
  const searchParams = useSearchParams();
  const section = searchParams.get("section") || "what";
  const { data: session } = useSession();

  const displayName = session?.user?.email?.split('@')[0] || 'User';

  // State for service request form
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [otherServices, setOtherServices] = useState<OtherServices>({});
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [whenData, setWhenData] = useState<WhenData>({
    frequency: "weekly",
    sessionsPerWeek: 1,
    hoursPerWeek: 2.5,
    startPreference: "",
    specificDate: "",
    scheduling: "",
    preferredDays: {
      monday: { ...defaultDaySchedule },
      tuesday: { ...defaultDaySchedule },
      wednesday: { ...defaultDaySchedule },
      thursday: { ...defaultDaySchedule },
      friday: { ...defaultDaySchedule },
      saturday: { ...defaultDaySchedule },
      sunday: { ...defaultDaySchedule },
    },
    additionalNotes: "",
  });
  const [detailsData, setDetailsData] = useState<DetailsData>({
    fullName: "",
    preferredName: "",
    gender: "",
    dobDay: "",
    dobMonth: "",
    dobYear: "",
  });
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [preferencesData, setPreferencesData] = useState<PreferencesData>({
    preferredGender: "",
    preferredQualities: "",
  });
  const [supportDetailsData, setSupportDetailsData] = useState<SupportDetailsData>({
    jobTitle: "",
  });

  // Render the appropriate section based on URL parameter
  const renderSection = () => {
    switch (section) {
      case "what":
        return (
          <WhatSection
            selectedCategories={selectedCategories}
            selectedSubcategories={selectedSubcategories}
            otherServices={otherServices}
            onCategoryChange={setSelectedCategories}
            onSubcategoryChange={setSelectedSubcategories}
            onOtherServicesChange={setOtherServices}
          />
        );
      case "where":
        return (
          <WhereSection
            selectedLocation={selectedLocation}
            onLocationChange={setSelectedLocation}
          />
        );
      case "when":
        return (
          <WhenSection
            whenData={whenData}
            onWhenDataChange={setWhenData}
          />
        );
      case "support-details":
        return (
          <SupportDetailsSection
            supportDetailsData={supportDetailsData}
            onSupportDetailsDataChange={setSupportDetailsData}
            selectedCategories={selectedCategories}
            selectedSubcategories={selectedSubcategories}
          />
        );
      case "details":
        return (
          <DetailsSection
            detailsData={detailsData}
            onDetailsDataChange={setDetailsData}
          />
        );
      case "diagnoses":
        return (
          <DiagnosesSection
            selectedConditions={selectedConditions}
            onConditionsChange={setSelectedConditions}
          />
        );
      case "preferences":
        return (
          <PreferencesSection
            preferencesData={preferencesData}
            onPreferencesDataChange={setPreferencesData}
          />
        );
      case "preview":
        return (
          <PreviewSection
            selectedCategories={selectedCategories}
            selectedSubcategories={selectedSubcategories}
            selectedLocation={selectedLocation}
            whenData={whenData}
            detailsData={detailsData}
            selectedConditions={selectedConditions}
            preferencesData={preferencesData}
            supportDetailsData={supportDetailsData}
          />
        );
      default:
        return (
          <WhatSection
            selectedCategories={selectedCategories}
            selectedSubcategories={selectedSubcategories}
            otherServices={otherServices}
            onCategoryChange={setSelectedCategories}
            onSubcategoryChange={setSelectedSubcategories}
            onOtherServicesChange={setOtherServices}
          />
        );
    }
  };

  return (
    <ClientDashboardLayout
      profileData={{
        firstName: displayName,
        photo: null,
      }}
    >
      <RequestServiceLayout currentSection={section}>
        {renderSection()}
      </RequestServiceLayout>
    </ClientDashboardLayout>
  );
}

export default function RequestServicePage() {
  return (
    <Suspense fallback={
      <ClientDashboardLayout
        profileData={{
          firstName: 'User',
          photo: null,
        }}
      >
        <div className="profile-edit-container" style={{ opacity: 0.6 }}>
          <div className="profile-edit-grid">
            <div className="profile-edit-sidebar">
              <div className="additional-details-menu">
                <div style={{ width: '100%', height: '200px', background: '#f9fafb', borderRadius: '0.75rem' }}></div>
              </div>
            </div>
            <div className="profile-edit-main">
              <div style={{ width: '100%', height: '300px', background: '#f9fafb', borderRadius: '8px' }}></div>
            </div>
          </div>
        </div>
      </ClientDashboardLayout>
    }>
      <RequestServiceContent />
    </Suspense>
  );
}
