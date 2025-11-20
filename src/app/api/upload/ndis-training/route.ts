/**
 * NDIS Training Upload API
 *
 * Handles NDIS Training completion certificate uploads to Vercel Blob storage
 * Stores in verification_requirements table
 * Accepts PDFs and images for proof of completion
 *
 * POST /api/upload/ndis-training
 */

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

export async function POST(request: Request) {
  console.log("🎯 NDIS training upload API called");

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    console.log("👤 Session user ID:", session?.user?.id);

    if (!session?.user?.id) {
      console.error("❌ No session - unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const documentType = formData.get("documentType") as string;

    console.log("📦 Received file:", file?.name, file?.type, file?.size);
    console.log("📋 Document type:", documentType);

    if (!file) {
      console.error("❌ No file in request");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (documentType !== "ndis-training") {
      console.error("❌ Invalid document type:", documentType);
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
    }

    // 3. Validate file
    console.log("🔍 Validating file type and size...");

    if (!ALLOWED_TYPES.includes(file.type)) {
      console.error("❌ Invalid file type:", file.type);
      return NextResponse.json(
        { error: "Invalid file type. Only PDF, JPG, and PNG are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      console.error("❌ File too large:", file.size);
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    console.log("✅ File validation passed");

    // 4. Get worker profile
    console.log("🔍 Finding worker profile...");
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!workerProfile) {
      console.error("❌ Worker profile not found");
      return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });
    }

    console.log("✅ Worker profile found:", workerProfile.id);

    // 5. Upload to Vercel Blob
    console.log("☁️ Uploading to Vercel Blob...");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const blobPath = `ndis-training/${session.user.id}/${timestamp}-${sanitizedFileName}`;

    console.log("📤 Blob path:", blobPath);

    const blob = await put(blobPath, buffer, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });

    console.log(`✅ NDIS training uploaded to blob:`, blob.url);

    // 6. Check if NDIS training document already exists
    console.log("🔍 Checking for existing NDIS training document...");
    const existingDoc = await authPrisma.verificationRequirement.findFirst({
      where: {
        workerProfileId: workerProfile.id,
        requirementType: "ndis-training",
      },
    });

    console.log("📋 Existing document:", existingDoc ? `Found (ID: ${existingDoc.id})` : "Not found");

    let verificationReq;

    if (existingDoc) {
      // Update existing document
      console.log(`🔄 Updating existing NDIS training document`);
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
      console.log("✅ Document updated successfully");
    } else {
      // Create new document - IMPORTANT: Include updatedAt field
      console.log(`✨ Creating new NDIS training document`);
      verificationReq = await authPrisma.verificationRequirement.create({
        data: {
          workerProfileId: workerProfile.id,
          requirementType: "ndis-training",
          requirementName: "NDIS Training Modules",
          isRequired: true,
          documentUrl: blob.url,
          documentUploadedAt: new Date(),
          status: "SUBMITTED",
          submittedAt: new Date(),
          updatedAt: new Date(), // ✅ Include updatedAt to avoid Prisma error
        },
      });
      console.log("✅ Document created successfully");
    }

    console.log("🎉 Returning success response");
    return NextResponse.json({
      success: true,
      id: verificationReq.id,
      url: blob.url,
      message: "NDIS training uploaded successfully",
    });

  } catch (error: any) {
    console.error("❌ NDIS training upload error:", error);
    console.error("❌ Error stack:", error.stack);
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
