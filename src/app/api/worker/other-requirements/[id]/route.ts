/**
 * Worker Other Requirements - Delete API
 *
 * DELETE /api/worker/other-requirements/[id] - Delete a specific other requirement document
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";
import { del } from "@vercel/blob";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documentId = params.id;

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

    // Find the document to verify ownership and get URL for blob deletion
    const document = await authPrisma.verificationRequirement.findFirst({
      where: {
        id: documentId,
        workerProfileId: workerProfile.id,
        requirementType: "other-requirement",
      },
      select: {
        id: true,
        documentUrl: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
    }

    // Delete from blob storage if URL exists
    if (document.documentUrl) {
      try {
        await del(document.documentUrl);
        console.log("✅ Document deleted from blob storage:", document.documentUrl);
      } catch (blobError) {
        console.error("⚠️ Failed to delete from blob storage:", blobError);
        // Continue with database deletion even if blob deletion fails
      }
    }

    // Delete from database
    await authPrisma.verificationRequirement.delete({
      where: { id: documentId },
    });

    console.log("✅ Document deleted from database:", documentId);

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });

  } catch (error: any) {
    console.error("❌ Error deleting document:", error);
    return NextResponse.json(
      {
        error: "Failed to delete document",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
