/**
 * Worker Requirements API
 * Fetches required documents based on worker's services from the database
 *
 * GET /api/worker/requirements - Fetch requirements for worker's services
 * GET /api/worker/requirements?services=service1,service2 - Fetch requirements for specific services
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

    // 3. Get worker profile to access their services
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, services: true },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });
    }

    // 4. Determine which services to fetch requirements for
    let servicesToFetch: string[] = [];

    if (servicesParam) {
      // Use services from parameter
      servicesToFetch = servicesParam.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      // Use worker's own services
      servicesToFetch = workerProfile.services || [];
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
          all: [],
        },
      });
    }

    // Parse services to separate category and subcategory
    // Format: "Category Name" or "Category Name:Subcategory Name"
    const parsedServices = servicesToFetch.map(service => {
      const [categoryName, subcategoryName] = service.split(':').map(s => s.trim());
      return {
        categoryName,
        subcategoryName: subcategoryName || null,
        categoryId: categoryName.toLowerCase().replace(/\s+/g, '-'),
        subcategoryId: subcategoryName ? subcategoryName.toLowerCase().replace(/\s+/g, '-') : null,
      };
    });

    console.log("📋 Parsed services:", parsedServices);

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
      // Find if this category has a specific subcategory requested
      const requestedService = parsedServices.find(
        s => s.categoryId === category.id || s.categoryName === category.name
      );

      // Add category-level documents (always include these)
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
      // If a specific subcategory was requested, only include that one
      // Otherwise, include all subcategories
      const subcategoriesToInclude = requestedService?.subcategoryId
        ? category.subcategories.filter(
            sub => sub.id === requestedService.subcategoryId || sub.name === requestedService.subcategoryName
          )
        : category.subcategories;

      console.log(`📂 Category: ${category.name}, Subcategories to include:`, subcategoriesToInclude.map(s => s.name));

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

    // 7. Group requirements by type
    const baseCompliance = allRequirements.filter(
      req => req.category === 'IDENTITY' ||
             req.category === 'BUSINESS' ||
             req.category === 'COMPLIANCE'
    );

    const trainings = allRequirements.filter(
      req => req.category === 'TRAINING'
    );

    const qualifications = allRequirements.filter(
      req => req.category === 'QUALIFICATION' ||
             req.category === 'REGISTRATION'
    );

    const insurance = allRequirements.filter(
      req => req.category === 'INSURANCE'
    );

    const transport = allRequirements.filter(
      req => req.category === 'TRANSPORT'
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
        all: allRequirements,
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
