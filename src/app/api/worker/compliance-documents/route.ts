/**
 * Generic Compliance Documents API
 *
 * Handles compliance document uploads to Vercel Blob storage
 * Stores in verification_requirements table
 * Supports expiry dates for documents that expire
 *
 * POST /api/worker/compliance-documents - Upload document
 * GET /api/worker/compliance-documents?documentType={type} - Get document
 * DELETE /api/worker/compliance-documents?id={id} - Delete document
 */

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

/**
 * GET - Fetch all compliance documents by type
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentType = searchParams.get("documentType");

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
      },
      orderBy: {
        documentUploadedAt: 'desc',
      },
    });

    return NextResponse.json({
      documents: documents.map(doc => ({
        id: doc.id,
        documentType: doc.requirementType,
        documentUrl: doc.documentUrl,
        uploadedAt: doc.documentUploadedAt,
        expiryDate: doc.expiresAt, // Map expiresAt to expiryDate for frontend
      })),
    });
  } catch (error: any) {
    console.error("Error fetching compliance documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

/**
 * POST - Upload compliance document
 */
export async function POST(request: Request) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const documentType = formData.get("documentType") as string;
    const requirementName = formData.get("requirementName") as string | null;
    const expiryDate = formData.get("expiryDate") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!documentType) {
      return NextResponse.json({ error: "Document type is required" }, { status: 400 });
    }

    // 3. Validate file
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF, JPG, and PNG are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // 4. Get worker profile
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });
    }

    // 5. Upload to Vercel Blob
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const blobPath = `compliance-documents/${session.user.id}/${documentType}-${timestamp}-${sanitizedFileName}`;

    const blob = await put(blobPath, buffer, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });

    console.log(`✅ Compliance document uploaded to blob:`, blob.url);

    // 6. Always create a new document (support multiple documents per type)
    console.log(`📝 Creating new document: ${documentType}`);
    const verificationReq = await authPrisma.verificationRequirement.create({
      data: {
        workerProfileId: workerProfile.id,
        requirementType: documentType,
        requirementName: requirementName || documentType,
        documentUrl: blob.url,
        documentUploadedAt: new Date(),
        expiresAt: expiryDate ? new Date(expiryDate) : null,
        status: "SUBMITTED",
        submittedAt: new Date(),
        updatedAt: new Date(),
        isRequired: false, // Generic documents are typically optional
      },
    });

    console.log(`✅ Document saved successfully`);

    // 7. Update worker's verificationStatus to PENDING_REVIEW
    await authPrisma.workerProfile.update({
      where: { id: workerProfile.id },
      data: {
        verificationStatus: 'PENDING_REVIEW',
      },
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      id: verificationReq.id,
    });
  } catch (error: any) {
    console.error("❌ Compliance document upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload document",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete compliance document
 */
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get document ID from query params
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("id");

    if (!documentId) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    // Get worker profile
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });
    }

    // Verify document belongs to this worker
    const document = await authPrisma.verificationRequirement.findFirst({
      where: {
        id: documentId,
        workerProfileId: workerProfile.id,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete the document from database
    await authPrisma.verificationRequirement.delete({
      where: { id: documentId },
    });

    // TODO: Delete from Vercel Blob storage
    // import { del } from '@vercel/blob';
    // await del(document.documentUrl);

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting compliance document:", error);
    return NextResponse.json(
      {
        error: "Failed to delete document",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
