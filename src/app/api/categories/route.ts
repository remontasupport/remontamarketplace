import { NextResponse } from 'next/server';
import { authPrisma } from '@/lib/auth-prisma';
import { getOrFetch, CACHE_KEYS, CACHE_TTL } from '@/lib/redis';

// Define the preferred order of categories
const CATEGORY_ORDER = [
  'Support Worker',
  'Support Worker (High Intensity)',
  'Cleaning Services',
  'Home and Yard Maintenance',
  'Therapeutic Supports',
  'Nursing Services',
];

export async function GET() {
  try {
    const sortedCategories = await getOrFetch(
      CACHE_KEYS.categories(),
      async () => {
        const categories = await authPrisma.category.findMany({
          include: {
            documents: { include: { document: true } },
            subcategories: {
              include: { additionalDocuments: { include: { document: true } } },
              orderBy: { name: 'asc' },
            },
          },
        })

        return categories
          .map((category) => {
            const documentsByType = category.documents.reduce(
              (acc, cd) => {
                const docData = {
                  id: cd.document.id,
                  name: cd.document.name,
                  category: cd.document.category,
                  description: cd.document.description,
                  hasExpiration: cd.document.hasExpiration,
                }
                if (cd.documentType === 'CONDITIONAL') {
                  acc.conditional.push({ document: docData, condition: cd.conditionKey, requiredIf: cd.requiredIfTrue })
                  return acc
                }
                ;(cd.documentType === 'REQUIRED' ? acc.required : acc.optional).push(docData)
                return acc
              },
              { required: [] as any[], optional: [] as any[], conditional: [] as any[] }
            )

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
            }
          })
          .sort((a, b) => {
            const indexA = CATEGORY_ORDER.indexOf(a.name)
            const indexB = CATEGORY_ORDER.indexOf(b.name)
            if (indexA !== -1 && indexB !== -1) return indexA - indexB
            if (indexA !== -1) return -1
            if (indexB !== -1) return 1
            return a.name.localeCompare(b.name)
          })
      },
      CACHE_TTL.CATEGORIES
    )

    return NextResponse.json(sortedCategories, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
