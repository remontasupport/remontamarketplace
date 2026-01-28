/**
 * Participants Management Page
 * Allows clients to add/edit participants they manage
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth.config";
import { UserRole } from "@/types/auth";
import { authPrisma } from "@/lib/auth-prisma";
import ClientDashboardLayout from "@/components/dashboard/client/ClientDashboardLayout";
import ParticipantCard from "@/components/dashboard/client/ParticipantCard";
import Link from "next/link";
import { Plus } from "lucide-react";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ParticipantsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.CLIENT && session.user.role !== UserRole.COORDINATOR) {
    redirect("/unauthorized");
  }

  // Fetch user's profile based on role for sidebar display
  let displayName = session.user.email?.split('@')[0] || 'User';

  if (session.user.role === UserRole.CLIENT) {
    const clientProfile = await authPrisma.clientProfile.findUnique({
      where: { userId: session.user.id },
      select: { firstName: true },
    });
    displayName = clientProfile?.firstName || displayName;
  } else if (session.user.role === UserRole.COORDINATOR) {
    const coordinatorProfile = await authPrisma.coordinatorProfile.findUnique({
      where: { userId: session.user.id },
      select: { firstName: true },
    });
    displayName = coordinatorProfile?.firstName || displayName;
  }

  // Mock participants data - replace with actual data from database
  const participants = [
    {
      id: "1",
      name: "Maria Waston",
      preferredName: "Maria",
      photo: null,
      gender: "Female",
      age: 28,
      location: "Newtown, NSW 2042",
      services: ["Support Worker", "Personal Care", "Transport"],
      frequency: "Weekly",
      startDate: "20 Jan, 2023",
      status: "Active",
      hoursPerWeek: 10,
    },
    {
      id: "2",
      name: "John Smith",
      preferredName: "Johnny",
      photo: null,
      gender: "Male",
      age: 45,
      location: "Sydney, NSW 2000",
      services: ["Therapeutic Supports", "Nursing Services"],
      frequency: "Fortnightly",
      startDate: "15 Feb, 2023",
      status: "Pending",
      hoursPerWeek: 5,
    },
  ];

  return (
    <ClientDashboardLayout
      profileData={{
        firstName: displayName,
        photo: null,
      }}
    >
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold font-poppins text-gray-900">
              Participants
            </h1>
            <p className="text-gray-600 font-poppins mt-1">
              Manage the participants you support
            </p>
          </div>
          <Link
            href="/dashboard/client/request-service"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium font-poppins hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Participant
          </Link>
        </div>

        {/* Participants List */}
        {participants.length > 0 ? (
          <div className="space-y-4">
            {participants.map((p) => (
              <ParticipantCard key={p.id} participant={p} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 font-poppins mb-2">
              No participants yet
            </h3>
            <p className="text-gray-600 font-poppins mb-6">
              Add your first participant to get started with requesting support services.
            </p>
            <Link
              href="/dashboard/client/request-service"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium font-poppins hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Participant
            </Link>
          </div>
        )}
      </div>
    </ClientDashboardLayout>
  );
}
