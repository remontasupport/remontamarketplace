import { NextRequest, NextResponse } from 'next/server'
import { authPrisma as prisma } from '@/lib/auth-prisma'

/**
 * GET /api/admin/filters
 * Get all available filter options from the database (dynamic, not hardcoded)
 * Ultra-fast query using efficient aggregation
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch all unique document categories and statuses in parallel for maximum speed
    const [
      documentCategories,
      documentStatuses,
      requirementTypes,
      workerStats
    ] = await Promise.all([
      // Get unique document categories (non-null values only)
      prisma.verificationRequirement.findMany({
        where: {
          documentCategory: { not: null }
        },
        select: {
          documentCategory: true
        },
        distinct: ['documentCategory'],
      }),

      // Get unique document statuses
      prisma.verificationRequirement.findMany({
        select: {
          status: true
        },
        distinct: ['status'],
      }),

      // Get requirement types from Document table (master list of all possible documents)
      // Exclude identity documents and contractor documents (those are handled separately)
      prisma.document.findMany({
        where: {
          id: {
            notIn: [
              'identity-points-100',
              'identity-passport',
              'identity-birth-certificate',
              'identity-drivers-license',
              'identity-medicare-card',
              'identity-utility-bill',
              'identity-bank-statement',
              'business-abn',
              'abn',
              'abn-contractor'
            ]
          }
        },
        select: {
          id: true,
          name: true,
          category: true
        },
        orderBy: {
          name: 'asc'
        }
      }),

      // Get worker profile statistics for document submission counts
      prisma.$queryRaw<Array<{
        totalProfiles: bigint
        profilesWithDocuments: bigint
        profilesWithAllApproved: bigint
        profilesWithAnyRejected: bigint
        profilesWithPending: bigint
      }>>`
        SELECT
          COUNT(DISTINCT wp.id) as "totalProfiles",
          COUNT(DISTINCT CASE WHEN vr.id IS NOT NULL THEN wp.id END) as "profilesWithDocuments",
          COUNT(DISTINCT CASE WHEN vr.status = 'APPROVED' THEN wp.id END) as "profilesWithAllApproved",
          COUNT(DISTINCT CASE WHEN vr.status = 'REJECTED' THEN wp.id END) as "profilesWithAnyRejected",
          COUNT(DISTINCT CASE WHEN vr.status IN ('PENDING', 'SUBMITTED') THEN wp.id END) as "profilesWithPending"
        FROM "worker_profiles" wp
        LEFT JOIN "verification_requirements" vr ON wp.id = vr."workerProfileId"
      `
    ])

    // Convert BigInt to Number for JSON serialization
    const stats = workerStats[0] ? {
      totalProfiles: Number(workerStats[0].totalProfiles),
      profilesWithDocuments: Number(workerStats[0].profilesWithDocuments),
      profilesWithAllApproved: Number(workerStats[0].profilesWithAllApproved),
      profilesWithAnyRejected: Number(workerStats[0].profilesWithAnyRejected),
      profilesWithPending: Number(workerStats[0].profilesWithPending),
    } : {
      totalProfiles: 0,
      profilesWithDocuments: 0,
      profilesWithAllApproved: 0,
      profilesWithAnyRejected: 0,
      profilesWithPending: 0,
    }

    // Format the response with clean data
    const filters = {
      // Document Categories (from database enum)
      documentCategories: documentCategories
        .map(d => d.documentCategory)
        .filter((cat): cat is NonNullable<typeof cat> => cat !== null)
        .map(cat => ({
          value: cat,
          label: cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Format: WORKING_RIGHTS -> Working Rights
        })),

      // Document Statuses
      documentStatuses: documentStatuses
        .map(d => d.status)
        .map(status => ({
          value: status,
          label: status.charAt(0) + status.slice(1).toLowerCase(), // Format: APPROVED -> Approved
        })),

      // Requirement Types (from Document table - master list)
      // value = Document.id (used for querying requirementType)
      // label = Document.name (shown in the dropdown)
      requirementTypes: requirementTypes
        .map(doc => ({
          value: doc.id,        // e.g., "driver-license-vehicle"
          label: doc.name,      // e.g., "Driver's License"
          category: doc.category
        })),

      // Document Submission Filters (dynamic counts)
      documentSubmissionFilters: [
        {
          value: 'has_documents',
          label: `Has Documents (${stats.profilesWithDocuments})`,
          count: stats.profilesWithDocuments,
        },
        {
          value: 'no_documents',
          label: `No Documents (${stats.totalProfiles - stats.profilesWithDocuments})`,
          count: stats.totalProfiles - stats.profilesWithDocuments,
        },
        {
          value: 'all_approved',
          label: `All Approved (${stats.profilesWithAllApproved})`,
          count: stats.profilesWithAllApproved,
        },
        {
          value: 'any_rejected',
          label: `Has Rejected (${stats.profilesWithAnyRejected})`,
          count: stats.profilesWithAnyRejected,
        },
        {
          value: 'pending_review',
          label: `Pending Review (${stats.profilesWithPending})`,
          count: stats.profilesWithPending,
        },
      ],

      // Statistics
      stats,
    }

    return NextResponse.json({
      success: true,
      data: filters,
    })

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'


    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch filter options',
        message: errorMsg,
      },
      { status: 500 }
    )
  }
}
