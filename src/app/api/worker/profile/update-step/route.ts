import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";
import { getQualificationsForServices } from "@/config/serviceQualificationRequirements";

/**
 * POST /api/worker/profile/update-step
 * Save a specific step of the account setup
 * Validates and saves data for the current step
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { step, data } = body;

    console.log(`📥 Received step ${step} update request`);
    console.log(`📦 Data received:`, JSON.stringify(data, null, 2));

    // Prepare update data based on step
    const updateData: any = {};

    switch (step) {
      case 1: // Name
        updateData.firstName = data.firstName.trim();
        if (data.middleName && data.middleName.trim()) {
          updateData.middleName = data.middleName.trim();
        }
        updateData.lastName = data.lastName.trim();
        break;

      case 2: // Photo
        if (data.photo) {
          // Photo URL is already uploaded to blob storage
          // Store it in the photos array (first photo is profile photo)
          updateData.photos = [data.photo];
        }
        break;

      case 3: // Bio
        if (data.bio) updateData.introduction = data.bio.trim();
        break;

      case 4: // Address
        // Build location string from city, state, and postal code
        // Format: "City, State PostalCode" or "StreetAddress, City, State PostalCode" if street address exists
        if (data.city && data.state && data.postalCode) {
          const cityStatePostal = `${data.city.trim()}, ${data.state.trim()} ${data.postalCode.trim()}`;
          const fullLocation = data.streetAddress
            ? `${data.streetAddress.trim()}, ${cityStatePostal}`
            : cityStatePostal;
          updateData.location = fullLocation;
        }
        if (data.city) updateData.city = data.city;
        if (data.state) updateData.state = data.state;
        if (data.postalCode) updateData.postalCode = data.postalCode;
        break;

      case 5: // Proof of Identity
        // This step handles its own uploads via /api/upload/identity-documents
        // No profile updates needed here
        break;

      case 6: // Personal Info
        if (data.age) updateData.age = data.age;
        if (data.gender) updateData.gender = data.gender.toLowerCase();
        if (data.languages) updateData.languages = data.languages;
        if (data.hasVehicle) updateData.hasVehicle = data.hasVehicle;
        break;

      case 7: // Emergency Contact
        if (data.emergencyContactName) updateData.emergencyContactName = data.emergencyContactName.trim();
        if (data.emergencyContactPhone) updateData.emergencyContactPhone = data.emergencyContactPhone.trim();
        if (data.emergencyContactRelationship) updateData.emergencyContactRelationship = data.emergencyContactRelationship.trim();
        break;

      // Services Setup Steps (100+)
      case 101: // Services Offer
        // DO NOT save to arrays anymore - use WorkerService table only
        // Legacy arrays are kept for backward compatibility (read-only)

        // Save to WorkerService table (normalized approach)
        if (data.services) {
          const workerProfile = await authPrisma.workerProfile.findUnique({
            where: { userId: session.user.id },
            select: { id: true },
          });

          if (!workerProfile) {
            throw new Error("Worker profile not found");
          }

          // Get all categories from database to map subcategories to their parent categories
          const categories = await authPrisma.category.findMany({
            include: {
              subcategories: true,
            },
          });

          // Build a map: subcategoryId -> categoryId
          const subcategoryToCategory = new Map();
          categories.forEach(category => {
            category.subcategories.forEach((sub: any) => {
              subcategoryToCategory.set(sub.id, category);
            });
          });

          // Delete existing WorkerService records
          await authPrisma.workerService.deleteMany({
            where: { workerProfileId: workerProfile.id },
          });

          // Create new WorkerService records
          const workerServiceRecords = [];
          const subcategoryIds = data.supportWorkerCategories || [];

          for (const serviceName of data.services) {
            // Find category by name
            const category = categories.find(c => c.name === serviceName);
            if (!category) continue;

            const categoryId = category.id;

            // Find subcategories that belong to this category
            const relevantSubcategoryIds = subcategoryIds.filter((subId: string) => {
              const parentCategory = subcategoryToCategory.get(subId);
              return parentCategory?.id === categoryId;
            });

            if (relevantSubcategoryIds.length > 0) {
              // Service has subcategories - create one record per subcategory
              for (const subcategoryId of relevantSubcategoryIds) {
                const subcategory = category.subcategories.find((sub: any) => sub.id === subcategoryId);
                if (subcategory) {
                  workerServiceRecords.push({
                    workerProfileId: workerProfile.id,
                    categoryId,
                    categoryName: serviceName,
                    subcategoryId,
                    subcategoryName: subcategory.name,
                  });
                }
              }
            } else {
              // Service has no subcategories - create one record without subcategory
              workerServiceRecords.push({
                workerProfileId: workerProfile.id,
                categoryId,
                categoryName: serviceName,
                subcategoryId: null,
                subcategoryName: null,
              });
            }
          }

          if (workerServiceRecords.length > 0) {
            await authPrisma.workerService.createMany({
              data: workerServiceRecords,
              skipDuplicates: true,
            });
            console.log(`✅ Created ${workerServiceRecords.length} WorkerService records`);
          }
        }
        break;

      case 102: // Additional Training / Qualifications
        // Handle selectedQualifications
        // Create VerificationRequirement records for each selected qualification
        if (data.selectedQualifications && Array.isArray(data.selectedQualifications)) {
          // Get worker profile to access workerProfileId
          const workerProfile = await authPrisma.workerProfile.findUnique({
            where: { userId: session.user.id },
            select: { id: true, services: true },
          });

          if (!workerProfile) {
            throw new Error("Worker profile not found");
          }

          // Get all available qualifications for worker's services
          const availableQualifications = getQualificationsForServices(workerProfile.services || []);
          const availableQualificationTypes = availableQualifications.map(q => q.type);

          // Get existing requirements for this worker
          const existingRequirements = await authPrisma.verificationRequirement.findMany({
            where: {
              workerProfileId: workerProfile.id,
              requirementType: {
                in: availableQualificationTypes,
              },
            },
          });

          // Map existing requirements by type
          const existingRequirementsByType = new Map(
            existingRequirements.map(req => [req.requirementType, req])
          );

          // Delete only requirements that are NO LONGER selected
          const requirementsToDelete = existingRequirements
            .filter(req => !data.selectedQualifications.includes(req.requirementType))
            .map(req => req.id);

          if (requirementsToDelete.length > 0) {
            await authPrisma.verificationRequirement.deleteMany({
              where: {
                id: {
                  in: requirementsToDelete,
                },
              },
            });
            console.log(`🗑️ Deleted ${requirementsToDelete.length} deselected requirements`);
          }

          // Create new requirements ONLY for qualifications that don't exist yet
          const requirementsToCreate = data.selectedQualifications
            .filter((qualificationType: string) => !existingRequirementsByType.has(qualificationType))
            .map((qualificationType: string) => {
              const qualification = availableQualifications.find(q => q.type === qualificationType);
              if (!qualification) return null;

              return {
                workerProfileId: workerProfile.id,
                requirementType: qualificationType,
                requirementName: qualification.name,
                isRequired: false, // Worker-selected, not mandatory
                status: "PENDING" as const,
              };
            })
            .filter(Boolean);

          if (requirementsToCreate.length > 0) {
            await authPrisma.verificationRequirement.createMany({
              data: requirementsToCreate as any[],
            });
            console.log(`✅ Created ${requirementsToCreate.length} new verification requirements`);
          }

          console.log(`📋 Preserved ${existingRequirements.length - requirementsToDelete.length} existing requirements with their documentUrls`);
        }
        break;

      default:
        // Handle any other steps
        break;
    }

    // Handle ABN from ANY step (Compliance section or Services Setup)
    // This runs for all steps to ensure ABN is saved
    // WARNING: Only save ABN if it's explicitly provided with a value
    // Do NOT save empty ABN from unrelated steps (prevents accidental data loss)
    if (data.abn !== undefined) {
      const trimmedAbn = data.abn.trim();

      // Only save if ABN has a value OR if we're explicitly on an ABN step
      // This prevents accidental deletion of ABN from other steps
      if (trimmedAbn) {
        updateData.abn = trimmedAbn;
        console.log(`💼 ABN field detected with value. Saving: "${updateData.abn}"`);
      } else if (step >= 100 && (step === 103 || data.abn === "")) {
        // Only allow clearing ABN if we're on Services Setup ABN step (103)
        // or if ABN is explicitly sent as empty string
        updateData.abn = null;
        console.log(`💼 ABN field cleared (step ${step}). Saving as: null`);
      } else {
        console.log(`⚠️ SAFEGUARD: Ignoring empty ABN from step ${step} to prevent accidental data loss`);
      }
    }

    // Update worker profile
    console.log(`💾 Update data to be saved:`, JSON.stringify(updateData, null, 2));

    if (Object.keys(updateData).length > 0) {
      const result = await authPrisma.workerProfile.update({
        where: { userId: session.user.id },
        data: updateData,
      });
      console.log(`✅ Worker profile updated successfully. ABN value:`, result.abn);
    } else {
      console.log(`⚠️ No data to update - updateData is empty`);
    }

    return NextResponse.json({
      success: true,
      message: `Step ${step} saved successfully`,
    });
  } catch (error: any) {
    console.error("Error updating step:", error);
    return NextResponse.json(
      {
        error: "Failed to save step",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

