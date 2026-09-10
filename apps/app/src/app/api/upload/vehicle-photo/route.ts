import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";
import { put } from "@vercel/blob";

/**
 * POST /api/upload/vehicle-photo
 * Upload vehicle/driver's license photo and save to verification_requirements
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert File to Buffer (required for Vercel Blob)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const blobPath = `vehicle-photos/${session.user.id}/${timestamp}-${sanitizedFileName}`;

    const blob = await put(blobPath, buffer, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });

    // Get worker profile
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });
    }

    // Check if vehicle photo requirement exists
    const existingRequirement = await authPrisma.verificationRequirement.findFirst({
      where: {
        workerProfileId: workerProfile.id,
        requirementType: "vehicle-drivers-license",
      },
    });

    if (existingRequirement) {
      // Update existing requirement
      await authPrisma.verificationRequirement.update({
        where: { id: existingRequirement.id },
        data: {
          documentUrl: blob.url,
          documentUploadedAt: new Date(),
          status: "SUBMITTED",
          submittedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new verification requirement
      await authPrisma.verificationRequirement.create({
        data: {
          workerProfileId: workerProfile.id,
          requirementType: "vehicle-drivers-license",
          requirementName: "Vehicle/Driver's License",
          documentCategory: "OPTIONAL",
          isRequired: false,
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
      photoUrl: blob.url,
    });
  } catch (error: any) {
 
    return NextResponse.json(
      { error: "Failed to upload vehicle photo", details: error.message },
      { status: 500 }
    );
  }
}
