/**
 * Service Document Upload API
 *
 * Handles service training/qualification document uploads to Vercel Blob storage
 * Stores in verification_requirements table with documentCategory = "SERVICE_QUALIFICATION"
 * Accepts PDFs and images for certificates and qualifications
 *
 * POST /api/upload/service-documents
 */

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";
import { QUALIFICATION_TYPE_TO_NAME } from "@/utils/qualificationMapping";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

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
    const serviceName = formData.get("serviceName") as string;
    const subcategoryId = formData.get("subcategoryId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!documentType || !serviceName) {
      return NextResponse.json({ error: "Document type and service name are required" }, { status: 400 });
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
    const sanitizedService = serviceName.toLowerCase().replace(/\s+/g, "-");
    const blobPath = `service-documents/${session.user.id}/${sanitizedService}/${documentType}-${timestamp}-${sanitizedFileName}`;

    const blob = await put(blobPath, buffer, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });

    // 6. Create unique identifier for this document (service + subcategory + documentType)
    const uniqueRequirementType = subcategoryId
      ? `${serviceName}:${subcategoryId}:${documentType}`
      : `${serviceName}:${documentType}`;

    // Check if document already exists for this service/subcategory
    const existingDoc = await authPrisma.verificationRequirement.findFirst({
      where: {
        workerProfileId: workerProfile.id,
        requirementType: uniqueRequirementType,
      },
    });

    let verificationReq;

    if (existingDoc) {
      // Update existing document
      // Also fix the name if it was incorrect
      const displayName = QUALIFICATION_TYPE_TO_NAME[documentType] ||
        documentType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

      verificationReq = await authPrisma.verificationRequirement.update({
        where: { id: existingDoc.id },
        data: {
          requirementName: displayName, // Fix name if it was wrong
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
      // Create new document
      // Get proper display name from mapping instead of just capitalizing slug
      const displayName = QUALIFICATION_TYPE_TO_NAME[documentType] ||
        documentType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

      verificationReq = await authPrisma.verificationRequirement.create({
        data: {
          workerProfileId: workerProfile.id,
          requirementType: uniqueRequirementType,
          requirementName: displayName,
          documentCategory: "SERVICE_QUALIFICATION",
          isRequired: false, // Will be determined by service requirements
          documentUrl: blob.url,
          documentUploadedAt: new Date(),
          status: "SUBMITTED",
          submittedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

 

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
  
    return NextResponse.json(
      {
        error: "Failed to upload service document",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
