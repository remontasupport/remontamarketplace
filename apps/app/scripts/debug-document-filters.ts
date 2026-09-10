/**
 * Debug Script: Document Filters
 *
 * This script helps diagnose issues with document filtering.
 * Run with: npx tsx scripts/debug-document-filters.ts
 */

import { authPrisma as prisma } from '../src/lib/auth-prisma'

async function debugDocumentFilters() {
  try {
    // 1. Get all unique requirementNames from VerificationRequirement table
  
    const uniqueRequirementNames = await prisma.verificationRequirement.findMany({
      select: {
        requirementName: true
      },
      distinct: ['requirementName'],
      orderBy: {
        requirementName: 'asc'
      }
    })

    uniqueRequirementNames.forEach((item, index) => {
    })

    // 2. Count workers per document type
   
    for (const item of uniqueRequirementNames.slice(0, 10)) { // Show first 10
      const count = await prisma.workerProfile.count({
        where: {
          verificationRequirements: {
            some: {
              requirementName: item.requirementName
            }
          }
        }
      })
      
    }
    

    // 3. Get sample worker data
  
    const sampleWorker = await prisma.workerProfile.findFirst({
      where: {
        verificationRequirements: {
          some: {}
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        verificationRequirements: {
          select: {
            requirementType: true,
            requirementName: true,
            status: true
          }
        }
      }
    })

    if (sampleWorker) {

      sampleWorker.verificationRequirements.forEach(doc => {
      
      })
    }

    if (uniqueRequirementNames.length > 0) {
      const testDocName = uniqueRequirementNames[0].requirementName
      

      const workers = await prisma.workerProfile.findMany({
        where: {
          verificationRequirements: {
            some: {
              requirementName: testDocName
            }
          }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true
        },
        take: 5
      })

     
      workers.forEach(w => {
        
      })
    }
   

    // 5. Check for data inconsistencies
   
    const allDocs = await prisma.verificationRequirement.findMany({
      select: {
        requirementName: true,
        requirementType: true
      }
    })

    const inconsistencies = allDocs.filter(doc => {
      // Check if requirementName uses kebab-case (should use Title Case)
      return doc.requirementName.includes('-') && doc.requirementName === doc.requirementName.toLowerCase()
    })

    if (inconsistencies.length > 0) {
     
      const uniqueInconsistent = [...new Set(inconsistencies.map(d => d.requirementName))]
      uniqueInconsistent.slice(0, 10).forEach(name => {
       
      })
    } else {
     
    }

  } catch (error) {
    
  } finally {
    await prisma.$disconnect()
  }
}

// Run the debug function
debugDocumentFilters()
