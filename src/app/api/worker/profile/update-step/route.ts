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

    // NOTE: Steps 1-5 have been migrated to server actions in src/services/worker/profile.service.ts
    // This API route now only handles steps that haven't been refactored yet
    switch (step) {
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

          // OPTIMIZED: Build subcategoryId -> category map using flatMap (single pass)
          const subcategoryToCategory = new Map(
            categories.flatMap(category =>
              category.subcategories.map((sub: any) => [sub.id, category] as const)
            )
          );

          // Delete existing WorkerService records
          await authPrisma.workerService.deleteMany({
            where: { workerProfileId: workerProfile.id },
          });

          // OPTIMIZED: Create new WorkerService records using flatMap (eliminate nested loops)
          const subcategoryIds = data.supportWorkerCategories || [];

          const workerServiceRecords = data.services.flatMap((serviceName: string) => {
            // Find category by name
            const category = categories.find(c => c.name === serviceName);
            if (!category) return [];

            const categoryId = category.id;

            // Find subcategories that belong to this category
            const relevantSubcategoryIds = subcategoryIds.filter((subId: string) => {
              const parentCategory = subcategoryToCategory.get(subId);
              return parentCategory?.id === categoryId;
            });

            if (relevantSubcategoryIds.length > 0) {
              // Service has subcategories - create one record per subcategory using map
              return relevantSubcategoryIds.map((subcategoryId: string) => {
                const subcategory = category.subcategories.find((sub: any) => sub.id === subcategoryId);
                if (!subcategory) return null;

                return {
                  workerProfileId: workerProfile.id,
                  categoryId,
                  categoryName: serviceName,
                  subcategoryId,
                  subcategoryName: subcategory.name,
                };
              }).filter(Boolean);
            } else {
              // Service has no subcategories - create one record without subcategory
              return [{
                workerProfileId: workerProfile.id,
                categoryId,
                categoryName: serviceName,
                subcategoryId: null,
                subcategoryName: null,
              }];
            }
          });

          if (workerServiceRecords.length > 0) {
            await authPrisma.workerService.createMany({
              data: workerServiceRecords,
              skipDuplicates: true,
            });
           
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
            select: {
              id: true,
              workerServices: {
                select: {
                  categoryName: true
                }
              }
            },
          });

          if (!workerProfile) {
            throw new Error("Worker profile not found");
          }

          // Get all available qualifications for worker's services from WorkerService table
          const services = workerProfile.workerServices.map(ws => ws.categoryName);
          const availableQualifications = getQualificationsForServices(services);
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
            
          }

          
        }
        break;

      default:
        // Handle any other steps
        break;
    }

    // ABN field has been removed from schema

   

    if (Object.keys(updateData).length > 0) {
      const result = await authPrisma.workerProfile.update({
        where: { userId: session.user.id },
        data: updateData,
      });
   
    } else {
     
    }

    return NextResponse.json({
      success: true,
      message: `Step ${step} saved successfully`,
    });
  } catch (error: any) {
   
    return NextResponse.json(
      {
        error: "Failed to save step",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

