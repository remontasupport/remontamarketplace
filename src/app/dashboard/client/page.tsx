"use client";

/**
 * Client Dashboard
 * Protected route - only accessible to users with CLIENT role
 */

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClientDashboard() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="font-poppins text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-cooper text-gray-900">Client Dashboard</h1>
            <p className="text-gray-600 font-poppins mt-2">
              Welcome back, {session?.user?.email}
            </p>
          </div>
          <Button
            onClick={() => signOut({ callbackUrl: "/login" })}
            variant="outline"
            className="font-poppins"
          >
            Sign Out
          </Button>
        </div>

        {/* Session Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="font-poppins">Session Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-poppins text-sm">
              <p>
                <strong>Email:</strong> {session?.user?.email}
              </p>
              <p>
                <strong>Role:</strong>{" "}
                <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded">
                  {session?.user?.role}
                </span>
              </p>
              <p>
                <strong>User ID:</strong> {session?.user?.id}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder Content */}
        <Card>
          <CardHeader>
            <CardTitle className="font-poppins">Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-poppins text-gray-600">
              Your client dashboard features will be implemented here, including:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 font-poppins text-gray-600">
              <li>Search for support workers</li>
              <li>View worker profiles</li>
              <li>Request services</li>
              <li>Manage bookings</li>
              <li>Rate and review workers</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
