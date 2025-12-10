/**
 * Service Documents API
 *
 * GET /api/worker/service-documents - Fetch all service qualification documents for the logged-in worker
 * DELETE /api/worker/service-documents?id={id} - Delete a specific service document
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });
    }

    // Fetch all service qualification documents
    const documents = await authPrisma.verificationRequirement.findMany({
      where: {
        workerProfileId: workerProfile.id,
        documentCategory: "SERVICE_QUALIFICATION",
      },
      orderBy: {
        documentUploadedAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      documents: documents.map(doc => ({
        id: doc.id,
        documentType: doc.requirementType,
        documentUrl: doc.documentUrl,
        uploadedAt: doc.documentUploadedAt,
        status: doc.status,
      })),
    });
  } catch (error: any) {
   
    return NextResponse.json(
      { error: "Failed to fetch service documents" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("id");

    if (!documentId) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

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
        documentCategory: "SERVICE_QUALIFICATION",
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Delete the document
    await authPrisma.verificationRequirement.delete({
      where: { id: documentId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
  
    return NextResponse.json(
      { error: "Failed to delete service document" },
      { status: 500 }
    );
  }
}
