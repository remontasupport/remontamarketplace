import { PrismaClient } from '@prisma/client';


// Use AUTH_DATABASE_URL for seeding categories on authentication branch
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
});

// Helper function to expand $ref: references
function expandDocumentRefs(docs: string[], documentSets: any): string[] {
  const expanded: string[] = [];

  for (const doc of docs) {
    if (typeof doc === 'string' && doc.startsWith('$ref:')) {
      const refKey = doc.replace('$ref:', '');
      const refDocs = documentSets[refKey];
      if (refDocs) {
        // Recursively expand in case there are nested refs
        expanded.push(...expandDocumentRefs(refDocs, documentSets));
      }
    } else {
      expanded.push(doc);
    }
  }

  return expanded;
}

async function main() {


  // Clear existing data (in reverse order of dependencies)
  
  await prisma.subcategoryDocument.deleteMany();
  await prisma.categoryDocument.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.document.deleteMany();

  // 1. Seed Documents

  const documents = Object.values(categoriesData.documents);
  for (const doc of documents) {
    await prisma.document.create({
      data: {
        id: doc.id,
        name: doc.name,
        category: doc.category,
        description: doc.description,
        hasExpiration: doc.hasExpiration,
      },
    });
  }
  console.log(`✅ Created ${documents.length} documents`);

  // 2. Seed Categories with Documents
  console.log('📂 Seeding categories...');
  for (const category of categoriesData.categories) {
    // Create the category
    await prisma.category.create({
      data: {
        id: category.id,
        name: category.name,
        requiresQualification: category.requiresQualification,
      },
    });

    // Handle documents for categories (not Therapeutic Supports)
    if (category.documents) {
      const { required = [], optional = [], conditional = [] } = category.documents;

      // Add required documents
      const requiredDocs = expandDocumentRefs(required, categoriesData.documentSets);
      for (const docId of requiredDocs) {
        await prisma.categoryDocument.create({
          data: {
            categoryId: category.id,
            documentId: docId,
            documentType: 'REQUIRED',
          },
        });
      }

      // Add optional documents
      const optionalDocs = expandDocumentRefs(optional, categoriesData.documentSets);
      for (const docId of optionalDocs) {
        await prisma.categoryDocument.create({
          data: {
            categoryId: category.id,
            documentId: docId,
            documentType: 'OPTIONAL',
          },
        });
      }

      // Add conditional documents
      for (const cond of conditional) {
        const condDocs = expandDocumentRefs(
          typeof cond.documents === 'string' ? [cond.documents] : cond.documents,
          categoriesData.documentSets
        );
        for (const docId of condDocs) {
          await prisma.categoryDocument.create({
            data: {
              categoryId: category.id,
              documentId: docId,
              documentType: 'CONDITIONAL',
              conditionKey: cond.condition,
              requiredIfTrue: cond.requiredIf,
            },
          });
        }
      }
    }

    // Handle sharedDocuments for Therapeutic Supports
    if (category.sharedDocuments) {
      const { required = [] } = category.sharedDocuments;
      const sharedDocs = expandDocumentRefs(required, categoriesData.documentSets);

      for (const docId of sharedDocs) {
        await prisma.categoryDocument.create({
          data: {
            categoryId: category.id,
            documentId: docId,
            documentType: 'REQUIRED',
          },
        });
      }
    }

    // 3. Seed Subcategories
    if (category.subcategories && category.subcategories.length > 0) {
      

      for (const subcat of category.subcategories) {
        await prisma.subcategory.create({
          data: {
            id: subcat.id,
            categoryId: category.id,
            name: subcat.name,
            requiresRegistration: subcat.requiresRegistration,
          },
        });

        // Add additional documents for subcategory
        if (subcat.additionalDocuments?.required) {
          for (const docId of subcat.additionalDocuments.required) {
            await prisma.subcategoryDocument.create({
              data: {
                subcategoryId: subcat.id,
                documentId: docId,
              },
            });
          }
        }
      }
    }
  }


}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
