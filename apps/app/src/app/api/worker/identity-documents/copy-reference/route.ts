/**
 * Copy Identity Document Reference API
 * Creates a reference to an existing document without re-uploading the file
 * Used for reusing driver's license from "Other Personal Info" in "100 Points ID"
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sourceDocumentType, targetDocumentType } = body;

    // Get worker profile
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!workerProfile) {
      return NextResponse.json(
        { error: "Worker profile not found" },
        { status: 404 }
      );
    }

    // Find the source document in VerificationRequirement table
    const sourceDocument = await authPrisma.verificationRequirement.findFirst({
      where: {
        workerProfileId: workerProfile.id,
        requirementType: sourceDocumentType,
      },
    });

    if (!sourceDocument) {
      return NextResponse.json(
        { error: `Source document '${sourceDocumentType}' not found` },
        { status: 404 }
      );
    }

    // Check if target document already exists
    const existingTargetDocument = await authPrisma.verificationRequirement.findFirst({
      where: {
        workerProfileId: workerProfile.id,
        requirementType: targetDocumentType,
      },
    });

    if (existingTargetDocument) {
    
      // Update existing document with the same URL
      const updatedDocument = await authPrisma.verificationRequirement.update({
        where: { id: existingTargetDocument.id },
        data: {
          documentUrl: sourceDocument.documentUrl,
          documentUploadedAt: new Date(),
          status: "SUBMITTED",
          submittedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Document reference copied successfully",
        document: updatedDocument,
      });
    }

    // Create new target document referencing the same file URL
    const newDocument = await authPrisma.verificationRequirement.create({
      data: {
        workerProfileId: workerProfile.id,
        requirementType: targetDocumentType,
        requirementName: "Driver's License",
        documentCategory: "SECONDARY",
        isRequired: true,
        documentUrl: sourceDocument.documentUrl, // Reuse the same blob URL
        documentUploadedAt: new Date(),
        status: "SUBMITTED",
        submittedAt: new Date(),
        updatedAt: new Date(),
      },
    });


    return NextResponse.json({
      success: true,
      message: "Document reference copied successfully",
      document: newDocument,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to copy document reference",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
