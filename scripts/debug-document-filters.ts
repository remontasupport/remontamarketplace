/**
 * Debug Script: Document Filters
 *
 * This script helps diagnose issues with document filtering.
 * Run with: npx tsx scripts/debug-document-filters.ts
 */

import { authPrisma as prisma } from '../src/lib/auth-prisma'

async function debugDocumentFilters() {
  console.log('🔍 Starting Document Filter Debug...\n')

  try {
    // 1. Get all unique requirementNames from VerificationRequirement table
    console.log('1️⃣ Fetching all unique requirementNames from database...')
    const uniqueRequirementNames = await prisma.verificationRequirement.findMany({
      select: {
        requirementName: true
      },
      distinct: ['requirementName'],
      orderBy: {
        requirementName: 'asc'
      }
    })

    console.log(`   Found ${uniqueRequirementNames.length} unique document types:`)
    uniqueRequirementNames.forEach((item, index) => {
      console.log(`   ${index + 1}. "${item.requirementName}"`)
    })
    console.log('')

    // 2. Count workers per document type
    console.log('2️⃣ Counting workers per document type...')
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
      console.log(`   "${item.requirementName}": ${count} workers`)
    }
    console.log('')

    // 3. Get sample worker data
    console.log('3️⃣ Sample worker with documents...')
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
      console.log(`   Worker: ${sampleWorker.firstName} ${sampleWorker.lastName} (${sampleWorker.id})`)
      console.log(`   Documents:`)
      sampleWorker.verificationRequirements.forEach(doc => {
        console.log(`     - Type: "${doc.requirementType}" | Name: "${doc.requirementName}" | Status: ${doc.status}`)
      })
    }
    console.log('')

    // 4. Test a sample query
    console.log('4️⃣ Testing sample filter query...')
    if (uniqueRequirementNames.length > 0) {
      const testDocName = uniqueRequirementNames[0].requirementName
      console.log(`   Testing filter for: "${testDocName}"`)

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

      console.log(`   Found ${workers.length} workers with "${testDocName}":`)
      workers.forEach(w => {
        console.log(`     - ${w.firstName} ${w.lastName} (${w.id})`)
      })
    }
    console.log('')

    // 5. Check for data inconsistencies
    console.log('5️⃣ Checking for data inconsistencies...')
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
      console.log(`   ⚠️  Found ${inconsistencies.length} documents with kebab-case names:`)
      const uniqueInconsistent = [...new Set(inconsistencies.map(d => d.requirementName))]
      uniqueInconsistent.slice(0, 10).forEach(name => {
        console.log(`     - "${name}"`)
      })
    } else {
      console.log('   ✅ No inconsistencies found')
    }
    console.log('')

    console.log('✅ Debug complete!')

  } catch (error) {
    console.error('❌ Error during debug:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the debug function
debugDocumentFilters()
