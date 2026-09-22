/**
 * Generic Compliance Documents API
 *
 * GET /api/worker/compliance-documents?documentType={type} - Get document
 * PATCH /api/worker/compliance-documents - Update document metadata
 *
 * NOTE: POST and DELETE have been migrated to server actions:
 * - uploadComplianceDocument() in @/services/worker/compliance.service
 * - deleteComplianceDocument() in @/services/worker/compliance.service
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";

/**
 * GET - Fetch compliance documents by type
 * Supports both single document and multiple documents format
 *
 * Query params:
 * - documentType: The type of document to fetch (required)
 * - format: "single" or "multiple" (default: "multiple")
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentType = searchParams.get("documentType");
    const format = searchParams.get("format"); // "single" or "multiple"

    if (!documentType) {
      return NextResponse.json({ error: "Document type is required" }, { status: 400 });
    }

    // Get worker profile
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });
    }

    // SINGLE DOCUMENT FORMAT (for backward compatibility with old endpoints)
    if (format === "single") {
      const document = await authPrisma.verificationRequirement.findFirst({
        where: {
          workerProfileId: workerProfile.id,
          requirementType: documentType,
        },
        select: {
          id: true,
          documentUrl: true,
          documentUploadedAt: true,
          status: true,
        },
      });

      if (!document || !document.documentUrl) {
        return NextResponse.json({ document: null });
      }

      return NextResponse.json({
        document: {
          id: document.id,
          documentType: documentType,
          documentUrl: document.documentUrl,
          uploadedAt: document.documentUploadedAt?.toISOString() || new Date().toISOString(),
        },
      });
    }

    // MULTIPLE DOCUMENTS FORMAT (default - existing behavior)
    // Find ALL documents of this type
    const documents = await authPrisma.verificationRequirement.findMany({
      where: {
        workerProfileId: workerProfile.id,
        requirementType: documentType,
      },
      select: {
        id: true,
        requirementType: true,
        documentUrl: true,
        documentUploadedAt: true,
        expiresAt: true,
        metadata: true,
      },
      orderBy: {
        documentUploadedAt: 'desc',
      },
    });

    // Parse metadata if exists
    let metadata = null;
    if (documents.length > 0 && documents[0].metadata) {
      metadata = typeof documents[0].metadata === 'string'
        ? JSON.parse(documents[0].metadata)
        : documents[0].metadata;
    }

    return NextResponse.json({
      documents: documents.map(doc => ({
        id: doc.id,
        documentType: doc.requirementType,
        documentUrl: doc.documentUrl,
        uploadedAt: doc.documentUploadedAt,
        expiryDate: doc.expiresAt, // Map expiresAt to expiryDate for frontend
      })),
      metadata, // Include metadata for Right to Work citizenship status
    });
  } catch (error: any) {
  
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update document metadata (e.g., citizenship status for Right to Work)
 */
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { documentType, metadata } = body;

    if (!documentType) {
      return NextResponse.json({ error: "Document type is required" }, { status: 400 });
    }

    if (!metadata) {
      return NextResponse.json({ error: "Metadata is required" }, { status: 400 });
    }

    // Get worker profile
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });
    }

    // Find existing record or create new one
    const existingRecord = await authPrisma.verificationRequirement.findFirst({
      where: {
        workerProfileId: workerProfile.id,
        requirementType: documentType,
      },
    });

    if (existingRecord) {
      // Update existing record
      await authPrisma.verificationRequirement.update({
        where: { id: existingRecord.id },
        data: {
          metadata,
          // If Australian citizen, mark as submitted
          status: metadata.isCitizen ? "SUBMITTED" : existingRecord.status,
          submittedAt: metadata.isCitizen && !existingRecord.submittedAt ? new Date() : existingRecord.submittedAt,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new record
      await authPrisma.verificationRequirement.create({
        data: {
          workerProfileId: workerProfile.id,
          requirementType: documentType,
          requirementName: documentType === "right-to-work" ? "Right to Work Documents" : documentType,
          isRequired: true,
          status: metadata.isCitizen ? "SUBMITTED" : "PENDING",
          submittedAt: metadata.isCitizen ? new Date() : null,
          metadata,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: metadata.isCitizen
        ? "Australian citizenship confirmed"
        : "Citizenship status saved",
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to update metadata",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
