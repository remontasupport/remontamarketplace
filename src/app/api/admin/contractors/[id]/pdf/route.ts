import { NextRequest, NextResponse } from 'next/server'
import { authPrisma as prisma } from '@/lib/auth-prisma'
import { renderToStream } from '@react-pdf/renderer'
import WorkerProfilePDF from '@/components/pdf/WorkerProfilePDF'
import React from 'react'

/**
 * GET /api/admin/contractors/:id/pdf
 * Generate and download worker profile PDF
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
        services: true,
      }
    })

    if (!worker) {
      return NextResponse.json(
        { success: false, error: 'Worker not found' },
        { status: 404 }
      )
    }

    // Generate PDF stream
    const pdfStream = await renderToStream(
      React.createElement(WorkerProfilePDF, { worker })
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
    console.error('[PDF Generation API] Error:', errorMsg)

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
