// The profile preview from the api's read (U5c): the shape the preview components were written against.
import { describe, expect, it } from "vitest";
import { placeOf, previewOf } from "./preview";

const profile = {
  id: "wp1",
  names: { firstName: "Sam", middleName: null, lastName: "Lee" },
  photos: { main: "https://img/x.jpg" },
  bio: "Hello",
  personalInfo: { dateOfBirth: null, age: null, gender: null, hasVehicle: "Yes", languages: [] },
  serviceArea: { localityId: 1, label: "Parramatta, NSW 2150", travelRadiusKm: 20, precision: "SUBURB" },
  completion: { accountDetails: true, compliance: false, trainings: true, services: false, profileCompleted: false, percent: 50 },
  services: [
    { categoryId: "support-worker", categoryName: "Support Worker", subcategoryIds: ["personal-care"], subcategoryNames: ["Personal care"] },
    { categoryId: "cleaning-services", categoryName: "Cleaning Services", subcategoryIds: [], subcategoryNames: [] },
  ],
  sections: {
    availability: [{ day: "Monday", startMinute: 540, endMinute: 1020 }],
    experience: [{ domain: "DISABILITY", isProfessional: true, isPersonal: false, specificAreas: ["Autism"], otherAreas: [], description: null }],
    jobHistory: [{ id: "j1", jobTitle: "Carer", company: "Acme", startMonth: "May", startYear: 2020, endMonth: null, endYear: null, currentlyWorking: true }],
    education: [],
    additionalInfo: { languages: ["English"], culturalBackground: [], religion: [], interests: ["Reading"], workPreferences: [], lgbtqiaSupport: null, nonSmoker: true, petFriendly: null, personality: null, uniqueService: [], funFact: "x" },
    bankAccount: { accountName: "S Lee", bankName: "B", bsbLast3: "123", accountNumberLast3: "456" },
  },
} as never;

describe("previewOf", () => {
  it("the card, the services by name, the completion flags", () => {
    const v = previewOf(profile);
    expect(v.profile).toEqual({ firstName: "Sam", lastName: "Lee", photos: "https://img/x.jpg", introduction: "Hello", city: "Parramatta", state: "NSW", postalCode: "2150", hasVehicle: "Yes" });
    expect(v.services.map((s) => s.categoryName)).toEqual(["Cleaning Services", "Support Worker"]);
    expect(v.services[1]!.subcategories).toEqual([{ subcategoryId: "personal-care", subcategoryName: "Personal care" }]);
    expect(v.setupProgress).toEqual({ accountDetails: true, compliance: false, trainings: true, services: false });
  });

  it("the promoted lists as the old read keyed them; no bank account", () => {
    const a = previewOf(profile).additionalInfo;
    expect(a.availability).toEqual({ Monday: [{ startTime: "09:00", endTime: "17:00" }] });
    expect(Object.keys(a.experience)).toHaveLength(1);
    expect(Object.values(a.experience)[0]).toEqual({ isProfessional: true, isPersonal: false, specificAreas: ["Autism"], description: "", otherAreas: [] });
    expect(a.jobHistory).toEqual([{ jobTitle: "Carer", company: "Acme", startMonth: "May", startYear: "2020", endMonth: "", endYear: "", currentlyWorking: true }]);
    expect(a).not.toHaveProperty("bankAccount");
  });

  it("a service-area label in three parts; anything else stays whole", () => {
    expect(placeOf("Mount Druitt, NSW 2770")).toEqual({ city: "Mount Druitt", state: "NSW", postalCode: "2770" });
    expect(placeOf("Somewhere")).toEqual({ city: "Somewhere", state: null, postalCode: null });
    expect(placeOf(null)).toEqual({ city: null, state: null, postalCode: null });
  });
});
