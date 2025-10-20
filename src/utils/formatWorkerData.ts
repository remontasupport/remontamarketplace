import { ContractorFormData } from "@/schema/contractorFormSchema";
import { SUPPORT_WORKER_CATEGORIES } from "@/constants";

interface ServiceWithCategories {
  serviceType: string;
  hasSubCategories: boolean;
  categories: Array<{
    categoryId: string;
    categoryTitle: string;
  }>;
}

interface FormattedWorkerData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  age: string;
  gender: string;
  genderIdentity: string;
  languages: string[];
  location: string;

  // Services - Structured for easy filtering
  services: ServiceWithCategories[];

  // Professional Information
  experience: string;
  introduction: string;
  qualifications: string;
  hasVehicle: string;

  // Personal Touch
  personalTouch: {
    funFact: string;
    hobbies: string;
    uniqueService: string;
    whyEnjoyWork: string;
  };

  // Photos and Consents
  photos: string[]; // URLs after upload
  consents: {
    profileShare: boolean;
    marketing: boolean;
  };

  // Metadata
  createdAt: string;
  updatedAt: string;
  status: string;
}

/**
 * Transforms form data into a structured format optimized for database storage and querying
 * @param formData - Raw form data from react-hook-form
 * @param supportWorkerCategoryIds - Array of selected support worker category IDs
 * @returns Formatted data ready for database insertion
 */
export function formatWorkerDataForDatabase(
  formData: ContractorFormData,
  supportWorkerCategoryIds: string[] = []
): FormattedWorkerData {
  // Process services with proper structure
  const servicesWithDetails: ServiceWithCategories[] = formData.services.map((serviceTitle) => {
    const isSupportWorker = serviceTitle === "Support Worker";

    if (isSupportWorker && supportWorkerCategoryIds.length > 0) {
      // Map category IDs to full details
      const categories = supportWorkerCategoryIds.map((categoryId) => {
        const category = SUPPORT_WORKER_CATEGORIES.find((cat) => cat.id === categoryId);
        return {
          categoryId,
          categoryTitle: category?.title || categoryId,
        };
      });

      return {
        serviceType: serviceTitle,
        hasSubCategories: true,
        categories,
      };
    }

    return {
      serviceType: serviceTitle,
      hasSubCategories: false,
      categories: [],
    };
  });

  const now = new Date().toISOString();

  return {
    // Personal Information
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    mobile: formData.mobile,
    age: formData.age,
    gender: formData.gender,
    genderIdentity: formData.genderIdentity,
    languages: formData.languages,
    location: formData.location,

    // Services
    services: servicesWithDetails,

    // Professional Information
    experience: formData.experience,
    introduction: formData.introduction,
    qualifications: formData.qualifications,
    hasVehicle: formData.hasVehicle,

    // Personal Touch
    personalTouch: {
      funFact: formData.funFact,
      hobbies: formData.hobbies,
      uniqueService: formData.uniqueService,
      whyEnjoyWork: formData.whyEnjoyWork,
    },

    // Photos - In production, these would be URLs after uploading to storage
    // For now, using placeholder. You'd upload files and get back URLs
    photos: formData.photos.map((_, index) => `placeholder_photo_${index + 1}.jpg`),

    // Consents
    consents: {
      profileShare: formData.consentProfileShare,
      marketing: formData.consentMarketing || false,
    },

    // Metadata
    createdAt: now,
    updatedAt: now,
    status: "pending_verification",
  };
}

/**
 * Example of how to save to different database types
 */
export const databaseExamples = {
  // MongoDB example
  saveToMongoDB: async (formattedData: FormattedWorkerData) => {
    // const result = await db.collection('workers').insertOne(formattedData);
    // return result.insertedId;
    console.log("MongoDB Data:", JSON.stringify(formattedData, null, 2));
  },

  // PostgreSQL example (with separate tables)
  saveToPostgreSQL: async (formattedData: FormattedWorkerData) => {
    // INSERT INTO workers (first_name, last_name, ...) VALUES (...)
    // Then for each service:
    //   INSERT INTO worker_services (worker_id, service_type, has_sub_categories)
    // For support worker categories:
    //   INSERT INTO worker_support_categories (worker_id, category_id, category_title)
    console.log("PostgreSQL Data:", JSON.stringify(formattedData, null, 2));
  },

  // Prisma example
  saveToPrisma: async (formattedData: FormattedWorkerData) => {
    // await prisma.worker.create({
    //   data: {
    //     ...formattedData,
    //     services: {
    //       create: formattedData.services.map(service => ({
    //         serviceType: service.serviceType,
    //         categories: service.categories
    //       }))
    //     }
    //   }
    // });
    console.log("Prisma Data:", JSON.stringify(formattedData, null, 2));
  },
};
