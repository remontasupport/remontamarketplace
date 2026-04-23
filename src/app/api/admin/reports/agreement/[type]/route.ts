import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { UserRole } from '@/types/auth'
import { getContractContent } from '@/config/contractContent'
import jsPDF from 'jspdf'

/**
 * GET /api/admin/reports/agreement/abn
 * GET /api/admin/reports/agreement/tfn
 * Generate a blank template PDF of the contractor or casual employment agreement
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    await requireRole(UserRole.ADMIN)

    const { type } = await params

    if (type !== 'abn' && type !== 'tfn') {
      return NextResponse.json({ success: false, error: 'Invalid agreement type' }, { status: 400 })
    }

    const contract = getContractContent(type)
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - margin * 2
    let yPosition = margin

    const addText = (text: string, fontSize: number, isBold = false, indent = 0) => {
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', isBold ? 'bold' : 'normal')
      const lines = doc.splitTextToSize(text, contentWidth - indent)
      const lineHeight = fontSize * 0.5
      if (yPosition + lines.length * lineHeight > pageHeight - margin) {
        doc.addPage()
        yPosition = margin
      }
      doc.text(lines, margin + indent, yPosition)
      yPosition += lines.length * lineHeight + 2
    }

    const addSpacing = (space: number) => {
      yPosition += space
      if (yPosition > pageHeight - margin) {
        doc.addPage()
        yPosition = margin
      }
    }

    // Title
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(contract.title, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 8

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(contract.subtitle, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 15

    // Preamble (blank template)
    addText(`This ${contract.title} ("Agreement") is made and entered into on _______________`, 10)
    addSpacing(5)
    addText('by and between:', 10)
    addSpacing(3)
    addText('Remonta Group Pty Ltd (trading as Remonta) ("Company")', 10, true)
    addText('Located at: 3 Montrose Place, St Andrews, NSW 2566', 10)
    addSpacing(5)
    addText('and', 10)
    addSpacing(3)
    addText(`${type === 'abn' ? 'Contractor' : 'Employee'} Name: _______________`, 10, true)
    addText(`${type === 'abn' ? 'ABN' : 'TFN'}: _______________`, 10)
    addText('Located at: _______________', 10)
    addSpacing(10)

    // Sections
    contract.sections.forEach((section) => {
      addText(section.title, 11, true)
      addSpacing(2)
      section.content.forEach((paragraph) => {
        const indent = paragraph.startsWith('•') || paragraph.startsWith('-') ? 10 : 0
        addText(paragraph, 9, false, indent)
      })
      addSpacing(5)
    })

    // Closing statement
    addSpacing(5)
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 5
    addText(contract.closingStatement, 9)
    addSpacing(10)

    // Signature section
    addText('SIGNED:', 10, true)
    addSpacing(5)
    addText(`${type === 'abn' ? 'Contractor' : 'Employee'} Signature: _______________`, 10)
    addSpacing(5)
    addText('Name: _______________', 10)
    addText('Date: _______________', 10)

    const filename = `${contract.title.replace(/\s+/g, '_')}_Template.pdf`
    const buffer = Buffer.from(doc.output('arraybuffer'))

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: 'Failed to generate agreement PDF', message: errorMsg },
      { status: 500 }
    )
  }
}
