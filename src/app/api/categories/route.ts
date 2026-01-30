import { NextResponse } from 'next/server';
import { authPrisma } from '@/lib/auth-prisma';

// Define the preferred order of categories
const CATEGORY_ORDER = [
  'Support Worker',
  'Support Worker (High Intensity)',
  'Therapeutic Supports',
  'Nursing Services',
  'Cleaning Services',
  'Home and Yard Maintenance',
];

export async function GET() {
  try {
    // Fetch all categories with their documents and subcategories
    const categories = await authPrisma.category.findMany({
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

    // Sort categories by the preferred order
    const sortedCategories = formattedCategories.sort((a, b) => {
      const indexA = CATEGORY_ORDER.indexOf(a.name);
      const indexB = CATEGORY_ORDER.indexOf(b.name);

      // If both are in the order list, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // If only a is in the list, it comes first
      if (indexA !== -1) return -1;
      // If only b is in the list, it comes first
      if (indexB !== -1) return 1;
      // If neither is in the list, sort alphabetically
      return a.name.localeCompare(b.name);
    });

    // OPTIMIZED: Add HTTP caching headers for faster subsequent loads
    return NextResponse.json(sortedCategories, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
