import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";
import { getQualificationsForServices } from "@/config/serviceQualificationRequirements";
import { invalidateCache, CACHE_KEYS } from "@/lib/redis";
import { workerServicesCacheTag } from "@/app/api/worker/services/route";

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
      case 101: { // Services Offer
        if (!data.services) break;

        const workerProfile = await authPrisma.workerProfile.findUnique({
          where: { userId: session.user.id },
          select: { id: true },
        });

        if (!workerProfile) throw new Error("Worker profile not found");

        // Fetch categories and existing services in parallel
        const [categories, existingServices] = await Promise.all([
          authPrisma.category.findMany({ include: { subcategories: true } }),
          authPrisma.workerService.findMany({
            where: { workerProfileId: workerProfile.id },
            select: { categoryId: true, metadata: true },
          }),
        ]);

        // O(1) lookup maps
        const categoryByName = new Map(categories.map(c => [c.name, c]));
        const subcategoryToCategory = new Map(
          categories.flatMap(c => c.subcategories.map((sub: any) => [sub.id, c] as const))
        );

        // Preserve first non-null metadata per category
        const metadataByCategory = existingServices.reduce<Map<string, any>>((acc, { categoryId, metadata }) => {
          if (!acc.has(categoryId) && metadata !== null) acc.set(categoryId, metadata);
          return acc;
        }, new Map());

        const subcategoryIds: string[] = data.supportWorkerCategories || [];

        const workerServiceRecords = (data.services as string[])
          .map((serviceName) => {
            const category = categoryByName.get(serviceName);
            if (!category) return null;

            const subcategoryNameMap = new Map(category.subcategories.map((sub: any) => [sub.id, sub.name]));
            const validSubIds = subcategoryIds.filter(
              subId => subcategoryToCategory.get(subId)?.id === category.id && subcategoryNameMap.has(subId)
            );

            return {
              workerProfileId: workerProfile.id,
              categoryId: category.id,
              categoryName: serviceName,
              subcategoryIds: validSubIds,
              subcategoryNames: validSubIds.map(id => subcategoryNameMap.get(id)!),
              metadata: metadataByCategory.get(category.id) ?? undefined,
            };
          })
          .filter(Boolean);

        // Delete + create in a single transaction
        await authPrisma.$transaction([
          authPrisma.workerService.deleteMany({ where: { workerProfileId: workerProfile.id } }),
          ...workerServiceRecords.map((record) => authPrisma.workerService.create({ data: record })),
        ]);

        await invalidateCache(
          CACHE_KEYS.workerProfile(session.user.id),
          CACHE_KEYS.completionStatus(session.user.id)
        );

        // Invalidate the Next.js server cache for this worker's services
        revalidateTag(workerServicesCacheTag(workerProfile.id));
        break;
      }

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

          // Auto-fix existing requirements that have incorrect names (slugs instead of display names)
          
          for (const existing of existingRequirements) {
            const qualification = availableQualifications.find(q => q.type === existing.requirementType);
            if (qualification && qualification.name) {
              // If the existing name is wrong (is a slug or doesn't match), update it
              const correctName = qualification.name;
              const needsUpdate = !existing.requirementName ||
                                 existing.requirementName.includes('-') ||
                                 existing.requirementName !== correctName;

              if (needsUpdate) {
                await authPrisma.verificationRequirement.update({
                  where: { id: existing.id },
                  data: { requirementName: correctName },
                });
               
              }
            }
          }

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
              if (!qualification) {
              
                return null;
              }

              // Ensure we're saving the proper display name, not the type
              const displayName = qualification.name;
            

              if (!displayName || displayName.includes('-')) {
              
                return null;
              }

              return {
                workerProfileId: workerProfile.id,
                requirementType: qualificationType,
                requirementName: displayName,
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

