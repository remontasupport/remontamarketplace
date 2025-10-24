"use client";

/**
 * Worker Dashboard
 * Protected route - only accessible to users with WORKER role
 */

import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function WorkerDashboard() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="font-poppins text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search your course here..."
              className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 font-poppins"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-poppins mb-4">
              ONLINE COURSE
            </span>
            <h2 className="text-3xl font-bold font-cooper mb-4">
              Sharpen Your Skills With<br />Professional Online Courses
            </h2>
            <button className="bg-black text-white px-6 py-2 rounded-full font-poppins font-medium hover:bg-gray-900 transition">
              Join Now →
            </button>
          </div>
          {/* Decorative elements */}
          <div className="absolute right-10 top-1/2 -translate-y-1/2 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute right-20 bottom-10 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        </div>

        {/* Course Progress Cards */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600">📚</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-poppins">2/8 Watched</p>
                </div>
                <button className="text-gray-400">⋮</button>
              </div>
              <p className="font-poppins text-sm font-semibold text-gray-900">
                Product Design
              </p>
            </div>
          ))}
        </div>

        {/* Continue Watching Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold font-poppins text-gray-900">
              Continue Watching
            </h3>
            <div className="flex gap-2">
              <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                ←
              </button>
              <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition">
                <div className="aspect-video bg-gray-900 relative">
                  <span className="absolute top-2 left-2 px-2 py-1 bg-purple-600 text-white text-xs rounded font-poppins">
                    FRONTEND
                  </span>
                </div>
                <div className="p-4">
                  <h4 className="font-poppins font-semibold text-gray-900 mb-2">
                    Beginner's Guide To Becoming A Professional Frontend Developer
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <img
                      src="/images/profilePlaceHolder.png"
                      alt="Instructor"
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="font-poppins">Support Worker Name</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
