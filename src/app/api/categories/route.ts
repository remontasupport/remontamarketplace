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
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transform the data to match the expected format
    const formattedCategories = categories.map((category) => ({
      id: category.id,
      name: category.name,
      requiresQualification: category.requiresQualification,
      documents: {
        required: category.documents
          .filter((cd) => cd.documentType === 'REQUIRED')
          .map((cd) => ({
            id: cd.document.id,
            name: cd.document.name,
            category: cd.document.category,
            description: cd.document.description,
            hasExpiration: cd.document.hasExpiration,
          })),
        optional: category.documents
          .filter((cd) => cd.documentType === 'OPTIONAL')
          .map((cd) => ({
            id: cd.document.id,
            name: cd.document.name,
            category: cd.document.category,
            description: cd.document.description,
            hasExpiration: cd.document.hasExpiration,
          })),
        conditional: category.documents
          .filter((cd) => cd.documentType === 'CONDITIONAL')
          .map((cd) => ({
            document: {
              id: cd.document.id,
              name: cd.document.name,
              category: cd.document.category,
              description: cd.document.description,
              hasExpiration: cd.document.hasExpiration,
            },
            condition: cd.conditionKey,
            requiredIf: cd.requiredIfTrue,
          })),
      },
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
    }));

    return NextResponse.json(formattedCategories);
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
