/**
 * Infection Control Training Upload API
 *
 * Handles Infection Control Training certificate uploads to Vercel Blob storage
 * Stores in verification_requirements table
 * Accepts PDFs and images for proof of completion
 *
 * POST /api/upload/infection-control
 */

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";

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

    if (!file) {

      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (documentType !== "infection-control") {
    
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
 
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const blobPath = `infection-control/${session.user.id}/${timestamp}-${sanitizedFileName}`;

   

    const blob = await put(blobPath, buffer, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });



    // 6. Check if infection control document already exists
    
    const existingDoc = await authPrisma.verificationRequirement.findFirst({
      where: {
        workerProfileId: workerProfile.id,
        requirementType: "infection-control",
      },
    });


    let verificationReq;

    if (existingDoc) {
      // Update existing document

      verificationReq = await authPrisma.verificationRequirement.update({
        where: { id: existingDoc.id },
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
      // Create new document - IMPORTANT: Include updatedAt field

      verificationReq = await authPrisma.verificationRequirement.create({
        data: {
          workerProfileId: workerProfile.id,
          requirementType: "infection-control",
          requirementName: "Infection Prevention and Control Training",
          isRequired: true,
          documentUrl: blob.url,
          documentUploadedAt: new Date(),
          status: "SUBMITTED",
          submittedAt: new Date(),
          updatedAt: new Date(),
        },
      });
     
    }


    return NextResponse.json({
      success: true,
      id: verificationReq.id,
      url: blob.url,
      message: "Infection control training uploaded successfully",
    });

  } catch (error: any) {

    return NextResponse.json(
      {
        error: "Upload failed",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
