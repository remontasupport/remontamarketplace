import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Create Prisma client connected to AUTH_DATABASE_URL for categories
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
});

export async function GET() {
  try {
    // Fetch all categories with their documents and subcategories
    const categories = await prisma.category.findMany({
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
          orderBy: {
            name: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // OPTIMIZED: Single-pass transformation using reduce instead of 3 separate filter+map operations
    const formattedCategories = categories.map((category) => {
      // Group documents by type in a single pass (O(n) instead of O(3n))
      const documentsByType = category.documents.reduce(
        (acc, cd) => {
          const docData = {
            id: cd.document.id,
            name: cd.document.name,
            category: cd.document.category,
            description: cd.document.description,
            hasExpiration: cd.document.hasExpiration,
          };

          if (cd.documentType === 'REQUIRED') {
            acc.required.push(docData);
          } else if (cd.documentType === 'OPTIONAL') {
            acc.optional.push(docData);
          } else if (cd.documentType === 'CONDITIONAL') {
            acc.conditional.push({
              document: docData,
              condition: cd.conditionKey,
              requiredIf: cd.requiredIfTrue,
            });
          }
          return acc;
        },
        { required: [] as any[], optional: [] as any[], conditional: [] as any[] }
      );

      return {
        id: category.id,
        name: category.name,
        requiresQualification: category.requiresQualification,
        documents: documentsByType,
        subcategories: category.subcategories.map((subcat) => ({
          id: subcat.id,
          name: subcat.name,
          requiresRegistration: subcat.requiresRegistration,
          additionalDocuments: subcat.additionalDocuments.map((sd) => ({
            id: sd.document.id,
            name: sd.document.name,
            category: sd.document.category,
            description: sd.document.description,
            hasExpiration: sd.document.hasExpiration,
          })),
        })),
      };
    });

    // OPTIMIZED: Add HTTP caching headers for faster subsequent loads
    return NextResponse.json(formattedCategories, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
