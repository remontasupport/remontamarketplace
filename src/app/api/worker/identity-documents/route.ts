import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";

/**
 * GET /api/worker/identity-documents
 * Fetch identity documents for the authenticated worker from verification_requirements table
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get worker profile
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });
    }

    // Get all identity documents from verification_requirements table
    const documents = await authPrisma.verificationRequirement.findMany({
      where: {
        workerProfileId: workerProfile.id,
        documentCategory: {
          in: ["PRIMARY", "SECONDARY", "WORKING_RIGHTS"],
        },
      },
      select: {
        id: true,
        requirementType: true,
        requirementName: true,
        documentCategory: true,
        documentUrl: true,
        status: true,
        documentUploadedAt: true,
        reviewedAt: true,
        approvedAt: true,
        rejectedAt: true,
        rejectionReason: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform to match the expected interface
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      documentType: doc.requirementType,
      documentUrl: doc.documentUrl,
      documentCategory: doc.documentCategory,
      status: doc.status,
      uploadedAt: doc.documentUploadedAt,
      reviewedAt: doc.reviewedAt,
      approvedAt: doc.approvedAt,
      rejectedAt: doc.rejectedAt,
      rejectionReason: doc.rejectionReason,
    }));

    return NextResponse.json({
      success: true,
      documents: formattedDocuments,
    });
  } catch (error: any) {
    console.error("Error fetching identity documents:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch identity documents",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/worker/identity-documents?id={documentId}
 * Delete an identity document from verification_requirements table
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

    // Verify document belongs to this worker and is an identity document
    const document = await authPrisma.verificationRequirement.findFirst({
      where: {
        id: documentId,
        workerProfileId: workerProfile.id,
        documentCategory: {
          in: ["PRIMARY", "SECONDARY", "WORKING_RIGHTS"],
        },
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
    console.error("Error deleting identity document:", error);
    return NextResponse.json(
      {
        error: "Failed to delete identity document",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
