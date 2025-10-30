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
        if (data.genderIdentity) updateData.genderIdentity = data.genderIdentity;
        if (data.languages) updateData.languages = data.languages;
        if (data.hasVehicle) updateData.hasVehicle = data.hasVehicle;
        break;

      case 7: // ABN
        // TODO: Store ABN (might need separate table for sensitive data)
        break;

      case 8: // Emergency Contact
        // TODO: Store emergency contact (might need separate table)
        break;

      // Services Setup Steps (100+)
      case 101: // Services Offer
        if (data.services) updateData.services = data.services;
        if (data.supportWorkerCategories !== undefined) {
          updateData.supportWorkerCategories = data.supportWorkerCategories;
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
    }

    // Update worker profile
    if (Object.keys(updateData).length > 0) {
      await authPrisma.workerProfile.update({
        where: { userId: session.user.id },
        data: updateData,
      });
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

