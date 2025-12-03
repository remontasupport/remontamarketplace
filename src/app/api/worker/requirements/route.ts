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

    // 3. Get worker profile and their services
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        services: true,
        supportWorkerCategories: true,
        workerServices: {
          select: {
            categoryId: true,
            categoryName: true,
            subcategoryId: true,
            subcategoryName: true,
          },
        },
      },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });
    }

    console.log("👤 Worker profile:", {
      hasWorkerServices: workerProfile.workerServices.length > 0,
      workerServicesCount: workerProfile.workerServices.length,
      legacyServices: workerProfile.services,
      legacySubcategories: workerProfile.supportWorkerCategories,
    });

    // 4. Determine which services to fetch requirements for
    let servicesToFetch: string[] = [];

    if (serviceNameParam) {
      // Use specific serviceName parameter - filter for this service and its subcategories
      console.log("🎯 Filtering for specific service:", serviceNameParam);

      if (workerProfile.workerServices.length > 0) {
        // Filter WorkerService entries for this specific service
        servicesToFetch = workerProfile.workerServices
          .filter(ws => ws.categoryName === serviceNameParam)
          .map(ws => {
            if (ws.subcategoryName) {
              return `${ws.categoryName}:${ws.subcategoryName}`;
            } else {
              return ws.categoryName;
            }
          });
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
            // Add service:subcategory combinations
            for (const subcategory of subcategories) {
              if (subcategory && subcategory.trim()) {
                servicesToFetch.push(`${serviceNameParam}:${subcategory}`);
              }
            }
          } else {
            // Just add the service
            servicesToFetch.push(serviceNameParam);
          }
        }
      }
    } else if (servicesParam) {
      // Use services from parameter
      servicesToFetch = servicesParam.split(',').map(s => s.trim()).filter(Boolean);
    } else if (workerProfile.workerServices.length > 0) {
      // NEW APPROACH: Use WorkerService table (normalized data)
      console.log("✅ Using new WorkerService table");

      servicesToFetch = workerProfile.workerServices.map(ws => {
        if (ws.subcategoryName) {
          return `${ws.categoryName}:${ws.subcategoryName}`;
        } else {
          return ws.categoryName;
        }
      });
    } else {
      // FALLBACK: Use old services/supportWorkerCategories arrays
      console.log("⚠️  Falling back to legacy services arrays");

      const services = workerProfile.services || [];
      const subcategories = workerProfile.supportWorkerCategories || [];

      servicesToFetch = [];

      // Handle each service
      for (const service of services) {
        // Check if this service has subcategories
        if (subcategories && subcategories.length > 0) {
          // If the service is "Therapeutic Supports" or similar, combine with each subcategory
          // Otherwise, just use the service name
          const needsSubcategories = service === "Therapeutic Supports" ||
                                     service === "Support Worker (High Intensity)";

          if (needsSubcategories) {
            // Add service:subcategory for each subcategory
            for (const subcategory of subcategories) {
              if (subcategory && subcategory.trim()) {
                servicesToFetch.push(`${service}:${subcategory}`);
              }
            }
          } else {
            // Just add the service without subcategory
            servicesToFetch.push(service);
          }
        } else {
          // No subcategories, just add the service
          servicesToFetch.push(service);
        }
      }
    }

    console.log("🎯 Combined services to fetch:", servicesToFetch);

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
    console.log("🔍 Raw services to fetch:", servicesToFetch);

    const parsedServices = servicesToFetch.map(service => {
      const [categoryName, subcategoryName] = service.split(':').map(s => s.trim());
      return {
        categoryName,
        subcategoryName: subcategoryName || null,
        categoryId: categoryName.toLowerCase().replace(/\s+/g, '-'),
        subcategoryId: subcategoryName ? subcategoryName.toLowerCase().replace(/\s+/g, '-') : null,
      };
    });

    console.log("📋 Parsed services:", JSON.stringify(parsedServices, null, 2));

    // 5. Fetch categories and their required documents from main database
    const categoryIds = parsedServices.map(s => s.categoryId);
    const categoryNames = parsedServices.map(s => s.categoryName);

    console.log("🔍 Searching for category IDs:", categoryIds);

    const categories = await prisma.category.findMany({
      where: {
        OR: [
          {
            id: {
              in: categoryIds,
            },
          },
          {
            name: {
              in: categoryNames,
            },
          },
        ],
      },
      include: {
        documents: {
          include: {
            document: true,
          },
        },
        subcategories: {
          include: {
            additionalDocuments: {
              include: {
                document: true,
              },
            },
          },
        },
      },
    });

    console.log("📦 Found categories:", categories.length);
    console.log("📋 Category names found:", categories.map(c => c.name));

    // 6. Process and categorize requirements
    const allRequirements: any[] = [];

    for (const category of categories) {
      // Find ALL services requested for this category (not just the first one!)
      const requestedServicesForCategory = parsedServices.filter(
        s => s.categoryId === category.id || s.categoryName === category.name
      );

      // Add category-level documents (always include these, only once per category)
      for (const catDoc of category.documents) {
        allRequirements.push({
          id: catDoc.document.id,
          name: catDoc.document.name,
          category: catDoc.document.category,
          description: catDoc.document.description,
          hasExpiration: catDoc.document.hasExpiration,
          documentType: catDoc.documentType, // REQUIRED, OPTIONAL, CONDITIONAL
          serviceCategory: category.name,
          conditionKey: catDoc.conditionKey,
          requiredIfTrue: catDoc.requiredIfTrue,
        });
      }

      // Add subcategory-level documents
      console.log(`\n🔍 Processing category: ${category.name}`);
      console.log(`   Requested services for this category:`, requestedServicesForCategory);

      // Collect all requested subcategory IDs
      const requestedSubcategoryIds = requestedServicesForCategory
        .filter(s => s.subcategoryId)
        .map(s => s.subcategoryId);

      const requestedSubcategoryNames = requestedServicesForCategory
        .filter(s => s.subcategoryName)
        .map(s => s.subcategoryName);

      console.log(`   Requested subcategory IDs:`, requestedSubcategoryIds);
      console.log(`   Available subcategories:`, category.subcategories.map(s => ({ id: s.id, name: s.name })));

      // If specific subcategories were requested, only include those
      // Otherwise, include all subcategories
      const subcategoriesToInclude = requestedSubcategoryIds.length > 0
        ? category.subcategories.filter(
            sub => requestedSubcategoryIds.includes(sub.id) || requestedSubcategoryNames.includes(sub.name)
          )
        : category.subcategories;

      console.log(`   ✅ Subcategories to include:`, subcategoriesToInclude.map(s => s.name));

      for (const subcategory of subcategoriesToInclude) {
        for (const subDoc of subcategory.additionalDocuments) {
          allRequirements.push({
            id: subDoc.document.id,
            name: subDoc.document.name,
            category: subDoc.document.category,
            description: subDoc.document.description,
            hasExpiration: subDoc.document.hasExpiration,
            documentType: 'REQUIRED', // Subcategory documents are typically required
            serviceCategory: category.name,
            subcategory: subcategory.name,
          });
        }
      }
    }

    // 7. Group requirements by type and DEDUPLICATE by document ID
    // Helper function to deduplicate requirements by ID
    const deduplicateById = (requirements: any[]) => {
      const seen = new Map();
      const unique: any[] = [];

      for (const req of requirements) {
        if (!seen.has(req.id)) {
          seen.set(req.id, true);
          unique.push(req);
        }
      }

      return unique;
    };

    const baseCompliance = deduplicateById(
      allRequirements.filter(
        req => req.category === 'IDENTITY' ||
               req.category === 'BUSINESS' ||
               req.category === 'COMPLIANCE'
      )
    );

    const trainings = deduplicateById(
      allRequirements.filter(
        req => req.category === 'TRAINING'
      )
    );

    const qualifications = deduplicateById(
      allRequirements.filter(
        req => req.category === 'QUALIFICATION' ||
               req.category === 'REGISTRATION'
      )
    );

    const insurance = deduplicateById(
      allRequirements.filter(
        req => req.category === 'INSURANCE'
      )
    );

    const transport = deduplicateById(
      allRequirements.filter(
        req => req.category === 'TRANSPORT'
      )
    );

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
    });
  } catch (error: any) {
    console.error("❌ Error fetching requirements:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch requirements",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
