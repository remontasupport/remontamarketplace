/**
 * Generic Compliance Documents API
 *
 * GET /api/worker/compliance-documents?documentType={type} - Get document
 * PATCH /api/worker/compliance-documents - The Right to Work citizenship answer (only; C1)
 *
 * NOTE: POST and DELETE have been migrated to server actions:
 * - uploadComplianceDocument() in @/services/worker/compliance.service
 * - deleteComplianceDocument() in @/services/worker/compliance.service
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";
import { checkServerActionRateLimit, dbWriteRateLimit } from "@/lib/ratelimit";

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

    const limit = await checkServerActionRateLimit(session.user.id, dbWriteRateLimit);
    if (!limit.success) {
      return NextResponse.json({ error: limit.error }, { status: 429 });
    }

    // C1 (api-review 2026-10-15): this answer is the Right to Work "I am an Australian citizen" question and
    // nothing else. Any other document type -- a police check, a screening -- was accepted, with `isCitizen: true`
    // marking it SUBMITTED with no file, and completion counted it.
    const body = await request.json().catch(() => null);
    const documentType = body?.documentType;
    const isCitizen = body?.metadata?.isCitizen;
    if (documentType !== "right-to-work" || typeof isCitizen !== "boolean" || Object.keys(body?.metadata ?? {}).length !== 1) {
      return NextResponse.json({ error: "Only the Right to Work citizenship answer can be saved here" }, { status: 400 });
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
      // The answer joins the row's metadata (an upload's own keys stay). A citizen is SUBMITTED; a "no" leaves an
      // uploaded document's status alone, and takes back a citizen claim that has no file.
      const previous = existingRecord.metadata && typeof existingRecord.metadata === "object" && !Array.isArray(existingRecord.metadata) ? existingRecord.metadata : {};
      await authPrisma.verificationRequirement.update({
        where: { id: existingRecord.id },
        data: {
          metadata: { ...(previous as Record<string, unknown>), isCitizen },
          status: isCitizen ? "SUBMITTED" : existingRecord.documentUrl ? existingRecord.status : "PENDING",
          submittedAt: isCitizen ? (existingRecord.submittedAt ?? new Date()) : existingRecord.documentUrl ? existingRecord.submittedAt : null,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new record
      await authPrisma.verificationRequirement.create({
        data: {
          workerProfileId: workerProfile.id,
          requirementType: documentType,
          requirementName: "Right to Work Documents",
          isRequired: true,
          status: isCitizen ? "SUBMITTED" : "PENDING",
          submittedAt: isCitizen ? new Date() : null,
          metadata: { isCitizen },
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: isCitizen
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
