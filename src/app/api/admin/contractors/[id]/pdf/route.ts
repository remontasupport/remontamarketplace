import { NextRequest, NextResponse } from 'next/server'
import { authPrisma as prisma } from '@/lib/auth-prisma'
import { renderToStream } from '@react-pdf/renderer'
import WorkerProfilePDF from '@/components/pdf/WorkerProfilePDF'
import React from 'react'
import { requireRole } from '@/lib/auth'
import { UserRole } from '@/types/auth'

/**
 * GET /api/admin/contractors/:id/pdf
 * Generate and download worker profile PDF
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require ADMIN role
    await requireRole(UserRole.ADMIN)

    const { id: workerId } = await params

    if (!workerId) {
      return NextResponse.json(
        { success: false, error: 'Worker ID is required' },
        { status: 400 }
      )
    }

    // Fetch worker profile
    const worker = await prisma.workerProfile.findUnique({
      where: { id: workerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        experience: true,
        introduction: true,
        qualifications: true,
        hasVehicle: true,
        hobbies: true,
        uniqueService: true,
        whyEnjoyWork: true,
        photos: true,
        location: true,
        age: true,
        languages: true,
        workerServices: {
          select: {
            categoryName: true,
          }
        },
      }
    })

    if (!worker) {
      return NextResponse.json(
        { success: false, error: 'Worker not found' },
        { status: 404 }
      )
    }

    // Transform workerServices to legacy services array format
    const uniqueCategories = new Set<string>();
    worker.workerServices.forEach(ws => uniqueCategories.add(ws.categoryName));
    const services = Array.from(uniqueCategories);

    const workerData = {
      ...worker,
      services,
      workerServices: undefined,
      photos: Array.isArray(worker.photos) ? worker.photos as string[] : undefined,
    };

    // Generate PDF stream
    const pdfStream = await renderToStream(
      React.createElement(WorkerProfilePDF, { worker: workerData }) as any
    )

    // Convert React stream to Node stream for Next.js
    const chunks: Uint8Array[] = []

    for await (const chunk of pdfStream as any) {
      chunks.push(chunk)
    }

    const buffer = Buffer.concat(chunks)

    // Return PDF as downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${worker.firstName}_${worker.lastName}_Profile.pdf"`,
        'Content-Length': buffer.length.toString(),
      },
    })

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate PDF',
        message: errorMsg,
      },
      { status: 500 }
    )
  }
}
