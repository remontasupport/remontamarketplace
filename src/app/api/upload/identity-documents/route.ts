/**
 * Identity Document Upload API
 *
 * Handles identity document uploads to Vercel Blob storage
 * Stores in verification_requirements table with documentCategory
 * Accepts PDFs and images for proof of identity
 *
 * POST /api/upload/identity-documents
 */

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

// Map document types to their categories and names
const DOCUMENT_CONFIG: Record<string, { category: "PRIMARY" | "SECONDARY" | "WORKING_RIGHTS", name: string }> = {
  "identity-passport": { category: "PRIMARY", name: "Passport" },
  "identity-birth-certificate": { category: "PRIMARY", name: "Birth Certificate" },
  "identity-drivers-license": { category: "SECONDARY", name: "Driver's License" },
  "identity-medicare-card": { category: "SECONDARY", name: "Medicare Card" },
  "identity-utility-bill": { category: "SECONDARY", name: "Utility Bill" },
  "identity-bank-statement": { category: "SECONDARY", name: "Bank Statement" },
  "identity-working-rights": { category: "WORKING_RIGHTS", name: "Proof of Working Rights" },
};

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

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!documentType) {
      return NextResponse.json({ error: "Document type is required" }, { status: 400 });
    }

    // Get document configuration
    const docConfig = DOCUMENT_CONFIG[documentType];
    if (!docConfig) {
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
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
    // Convert File to Buffer (required for Vercel Blob)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const blobPath = `identity-documents/${session.user.id}/${documentType}-${timestamp}-${sanitizedFileName}`;

    const blob = await put(blobPath, buffer, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });

    console.log(`✅ Identity document uploaded to blob:`, blob.url);

    // 6. Replace any existing document in the same category
    // This ensures users can only have ONE primary doc and ONE secondary doc at a time
    // Example: Switching from Passport to Birth Certificate will delete Passport and create Birth Certificate

    // First, find any existing document in the same category (PRIMARY, SECONDARY, or WORKING_RIGHTS)
    const existingDocInCategory = await authPrisma.verificationRequirement.findFirst({
      where: {
        workerProfileId: workerProfile.id,
        documentCategory: docConfig.category,
        requirementType: {
          startsWith: "identity-", // Only identity documents
        },
      },
    });

    let verificationReq;

    if (existingDocInCategory) {
      // Check if it's the same document type (re-uploading same doc) or different (switching docs)
      if (existingDocInCategory.requirementType === documentType) {
        // Same document type - just update the URL
        console.log(`🔄 Updating existing ${docConfig.category} document: ${documentType}`);
        verificationReq = await authPrisma.verificationRequirement.update({
          where: { id: existingDocInCategory.id },
          data: {
            documentUrl: blob.url,
            documentUploadedAt: new Date(),
            status: "SUBMITTED",
            submittedAt: new Date(),
            updatedAt: new Date(),
            // Reset review fields when re-uploading
            reviewedAt: null,
            reviewedBy: null,
            approvedAt: null,
            rejectedAt: null,
            rejectionReason: null,
          },
        });
      } else {
        // Different document type - delete old and create new
        console.log(`🔄 Replacing ${docConfig.category} document: ${existingDocInCategory.requirementType} → ${documentType}`);

        // Delete the old document
        await authPrisma.verificationRequirement.delete({
          where: { id: existingDocInCategory.id },
        });

        // Create new document
        verificationReq = await authPrisma.verificationRequirement.create({
          data: {
            workerProfileId: workerProfile.id,
            requirementType: documentType,
            requirementName: docConfig.name,
            documentCategory: docConfig.category,
            isRequired: true, // Identity documents are mandatory
            documentUrl: blob.url,
            documentUploadedAt: new Date(),
            status: "SUBMITTED",
            submittedAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    } else {
      // No existing document in this category - create new
      console.log(`📝 Creating new ${docConfig.category} document: ${documentType}`);
      verificationReq = await authPrisma.verificationRequirement.create({
        data: {
          workerProfileId: workerProfile.id,
          requirementType: documentType,
          requirementName: docConfig.name,
          documentCategory: docConfig.category,
          isRequired: true, // Identity documents are mandatory
          documentUrl: blob.url,
          documentUploadedAt: new Date(),
          status: "SUBMITTED",
          submittedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    console.log(`✅ VerificationRequirement record saved successfully`);

    return NextResponse.json({
      success: true,
      url: blob.url,
      id: verificationReq.id,
    });
  } catch (error: any) {
    console.error("❌ Identity document upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload identity document",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
