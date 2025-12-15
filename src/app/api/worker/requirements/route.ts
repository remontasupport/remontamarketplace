/**
 * Worker Requirements API
 * Fetches required documents based on worker's services from the database
 *
 * GET /api/worker/requirements - Fetch requirements for worker's services
 * GET /api/worker/requirements?services=service1,service2 - Fetch requirements for specific services
 * GET /api/worker/requirements?serviceName=ServiceName - Fetch requirements for a specific service with its subcategories
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get query parameters
    const { searchParams } = new URL(request.url);
    const servicesParam = searchParams.get("services");
    const serviceNameParam = searchParams.get("serviceName");

    // 3. Get worker profile (minimal data - optimized)
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        services: true,
        supportWorkerCategories: true,
      },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });
    }

    // 4. Determine which services to fetch requirements for
    // OPTIMIZED: Fetch workerServices directly with DB query instead of loading into memory
    let servicesToFetch: string[] = [];

    if (serviceNameParam) {
      // Use specific serviceName parameter - filter for this service and its subcategories
      // OPTIMIZED: Query DB directly with WHERE filter
      const workerServices = await authPrisma.workerService.findMany({
        where: {
          workerProfileId: workerProfile.id,
          categoryName: serviceNameParam,
        },
        select: {
          categoryName: true,
          subcategoryName: true,
        },
      });

      if (workerServices.length > 0) {
        // Build service strings from DB results
        servicesToFetch = workerServices.map(ws =>
          ws.subcategoryName ? `${ws.categoryName}:${ws.subcategoryName}` : ws.categoryName
        );
      } else {
        // Fallback: use legacy arrays, filter for this service
        const services = workerProfile.services || [];
        const subcategories = workerProfile.supportWorkerCategories || [];

        if (services.includes(serviceNameParam)) {
          // This service is selected
          const needsSubcategories = serviceNameParam === "Therapeutic Supports" ||
                                     serviceNameParam === "Support Worker (High Intensity)" ||
                                     serviceNameParam === "Support Worker";

          if (needsSubcategories && subcategories.length > 0) {
            servicesToFetch = subcategories
              .filter(sub => sub && sub.trim())
              .map(sub => `${serviceNameParam}:${sub}`);
          } else {
            servicesToFetch.push(serviceNameParam);
          }
        }
      }
    } else if (servicesParam) {
      // Use services from parameter
      servicesToFetch = servicesParam.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      // OPTIMIZED: Fetch from DB only what we need (categoryName, subcategoryName)
      const workerServices = await authPrisma.workerService.findMany({
        where: { workerProfileId: workerProfile.id },
        select: {
          categoryName: true,
          subcategoryName: true,
        },
      });

      if (workerServices.length > 0) {
        // Use WorkerService table data
        servicesToFetch = workerServices.map(ws =>
          ws.subcategoryName ? `${ws.categoryName}:${ws.subcategoryName}` : ws.categoryName
        );
      } else {
        // FALLBACK: Use old services/supportWorkerCategories arrays
        const services = workerProfile.services || [];
        const subcategories = workerProfile.supportWorkerCategories || [];

        if (services.length === 0) {
          servicesToFetch = [];
        } else {
          // Build service strings from legacy arrays
          for (const service of services) {
            const needsSubcategories = service === "Therapeutic Supports" ||
                                       service === "Support Worker (High Intensity)";

            if (needsSubcategories && subcategories.length > 0) {
              servicesToFetch.push(
                ...subcategories
                  .filter(sub => sub && sub.trim())
                  .map(sub => `${service}:${sub}`)
              );
            } else {
              servicesToFetch.push(service);
            }
          }
        }
      }
    }


    if (servicesToFetch.length === 0) {
      return NextResponse.json({
        success: true,
        services: [],
        requirements: {
          baseCompliance: [],
          trainings: [],
          qualifications: [],
          insurance: [],
          transport: [],
        },
      });
    }

    // Parse services to separate category and subcategory
    // Format: "Category Name" or "Category Name:Subcategory Name"
    // OPTIMIZED: Single pass to extract all needed data
    const parsedServices = servicesToFetch.map(service => {
      const [categoryName, subcategoryName] = service.split(':').map(s => s.trim());
      return {
        categoryName,
        subcategoryName: subcategoryName || null,
        categoryId: categoryName.toLowerCase().replace(/\s+/g, '-'),
        subcategoryId: subcategoryName ? subcategoryName.toLowerCase().replace(/\s+/g, '-') : null,
      };
    });

    // Extract unique values for queries
    const categoryIds = [...new Set(parsedServices.map(s => s.categoryId))];
    const categoryNames = [...new Set(parsedServices.map(s => s.categoryName))];
    const requestedSubcategoryIds = [...new Set(parsedServices
      .map(s => s.subcategoryId)
      .filter((id): id is string => id !== null))];
    const requestedSubcategoryNames = [...new Set(parsedServices
      .map(s => s.subcategoryName)
      .filter((name): name is string => name !== null))];

    // 5. Fetch categories and their required documents from main database
    // OPTIMIZED: Only fetch subcategories that were actually requested + SELECT only needed fields
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { id: { in: categoryIds } },
          { name: { in: categoryNames } },
        ],
      },
      select: {
        id: true,
        name: true,
        documents: {
          select: {
            documentType: true,
            conditionKey: true,
            requiredIfTrue: true,
            document: {
              select: {
                id: true,
                name: true,
                category: true,
                description: true,
                hasExpiration: true,
              },
            },
          },
        },
        subcategories: {
          // OPTIMIZED: Filter subcategories at DB level, not in application code
          where: requestedSubcategoryIds.length > 0 || requestedSubcategoryNames.length > 0
            ? {
                OR: [
                  { id: { in: requestedSubcategoryIds } },
                  { name: { in: requestedSubcategoryNames } },
                ],
              }
            : undefined,
          select: {
            id: true,
            name: true,
            additionalDocuments: {
              select: {
                document: {
                  select: {
                    id: true,
                    name: true,
                    category: true,
                    description: true,
                    hasExpiration: true,
                  },
                },
              },
            },
          },
        },
      },
    });



    // 6. Process and categorize requirements
    // OPTIMIZED: Use flatMap to eliminate nested loops - single pass through data
    const allRequirements: any[] = [
      // Category-level documents - flatten categories and their documents in one pass
      ...categories.flatMap(category =>
        category.documents.map(catDoc => ({
          id: catDoc.document.id,
          name: catDoc.document.name,
          category: catDoc.document.category,
          description: catDoc.document.description,
          hasExpiration: catDoc.document.hasExpiration,
          documentType: catDoc.documentType, // REQUIRED, OPTIONAL, CONDITIONAL
          serviceCategory: category.name,
          conditionKey: catDoc.conditionKey,
          requiredIfTrue: catDoc.requiredIfTrue,
        }))
      ),
      // Subcategory-level documents - flatten categories → subcategories → documents in one pass
      ...categories.flatMap(category =>
        category.subcategories.flatMap(subcategory =>
          subcategory.additionalDocuments.map(subDoc => ({
            id: subDoc.document.id,
            name: subDoc.document.name,
            category: subDoc.document.category,
            description: subDoc.document.description,
            hasExpiration: subDoc.document.hasExpiration,
            documentType: 'REQUIRED', // Subcategory documents are typically required
            serviceCategory: category.name,
            subcategory: subcategory.name,
          }))
        )
      )
    ];

    // 7. Group requirements by type and DEDUPLICATE by document ID
    // OPTIMIZED: Single-pass grouping using HashMap (O(n) instead of O(5n))
    const groupedRequirements = new Map<string, Map<string, any>>();

    // Map category to group name for O(1) lookup (instead of array.includes)
    const categoryToGroup = new Map<string, string>([
      ['IDENTITY', 'baseCompliance'],
      ['BUSINESS', 'baseCompliance'],
      ['COMPLIANCE', 'baseCompliance'],
      ['TRAINING', 'trainings'],
      ['QUALIFICATION', 'qualifications'],
      ['REGISTRATION', 'qualifications'],
      ['INSURANCE', 'insurance'],
      ['TRANSPORT', 'transport'],
    ]);

    // Single pass through all requirements (O(n))
    for (const req of allRequirements) {
      // O(1) lookup instead of O(n) array.includes()
      const groupName = categoryToGroup.get(req.category);

      if (groupName) {
        // Initialize group if needed
        if (!groupedRequirements.has(groupName)) {
          groupedRequirements.set(groupName, new Map());
        }

        const group = groupedRequirements.get(groupName)!;

        // Deduplicate by ID using Map (O(1) lookup)
        if (!group.has(req.id)) {
          group.set(req.id, req);
        }
      }
    }

    // Convert Maps to Arrays for response
    const baseCompliance = Array.from(groupedRequirements.get('baseCompliance')?.values() || []);
    const trainings = Array.from(groupedRequirements.get('trainings')?.values() || []);
    const qualifications = Array.from(groupedRequirements.get('qualifications')?.values() || []);
    const insurance = Array.from(groupedRequirements.get('insurance')?.values() || []);
    const transport = Array.from(groupedRequirements.get('transport')?.values() || []);

    // OPTIMIZED: Add aggressive HTTP caching for instant subsequent loads (like 100 Points ID)
    return NextResponse.json({
      success: true,
      services: servicesToFetch,
      workerServices: workerProfile.services,
      requirements: {
        baseCompliance,
        trainings,
        qualifications,
        insurance,
        transport,
      },
    }, {
      headers: {
        // Cache for 30 seconds, stale-while-revalidate for 1 minute
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error: any) {
  
    return NextResponse.json(
      {
        error: "Failed to fetch requirements",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
