import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";

/**
 * POST /api/worker/profile/update-step
 * Save a specific step of the account setup
 * Validates and saves data for the current step
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { step, data } = body;

    // Prepare update data based on step
    const updateData: any = {};

    switch (step) {
      case 1: // Name
        updateData.firstName = data.firstName.trim();
        if (data.middleName && data.middleName.trim()) {
          updateData.middleName = data.middleName.trim();
        }
        updateData.lastName = data.lastName.trim();
        break;

      case 2: // Photo
        if (data.photo) {
          // Photo URL is already uploaded to blob storage
          // Store it in the photos array (first photo is profile photo)
          updateData.photos = [data.photo];
        }
        break;

      case 3: // Bio
        if (data.bio) updateData.introduction = data.bio.trim();
        break;

      case 4: // Address (reordered - was step 5)
        // Build location string from city, state, and postal code
        // Format: "City, State PostalCode" or "StreetAddress, City, State PostalCode" if street address exists
        if (data.city && data.state && data.postalCode) {
          const cityStatePostal = `${data.city.trim()}, ${data.state.trim()} ${data.postalCode.trim()}`;
          const fullLocation = data.streetAddress
            ? `${data.streetAddress.trim()}, ${cityStatePostal}`
            : cityStatePostal;
          updateData.location = fullLocation;
        }
        if (data.city) updateData.city = data.city;
        if (data.state) updateData.state = data.state;
        if (data.postalCode) updateData.postalCode = data.postalCode;
        break;

      case 5: // Personal Info (reordered - was step 4)
        if (data.age) updateData.age = data.age;
        if (data.gender) updateData.gender = data.gender;
        if (data.genderIdentity) updateData.genderIdentity = data.genderIdentity;
        if (data.languages) updateData.languages = data.languages;
        break;

      case 6: // ABN
        // TODO: Store ABN (might need separate table for sensitive data)
        break;

      case 7: // Emergency Contact
        // TODO: Store emergency contact (might need separate table)
        break;
    }

    // Update worker profile
    if (Object.keys(updateData).length > 0) {
      await authPrisma.workerProfile.update({
        where: { userId: session.user.id },
        data: updateData,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Step ${step} saved successfully`,
    });
  } catch (error: any) {
    console.error("Error updating step:", error);
    return NextResponse.json(
      {
        error: "Failed to save step",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

