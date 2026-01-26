"use client";

import Image from "next/image";
import Link from "next/link";

interface ParticipantCardProps {
  participant: {
    id: string;
    name: string;
    preferredName?: string;
    photo?: string | null;
    gender?: string;
    age?: number;
    location?: string;
    services?: string[];
    frequency?: string;
    startDate?: string;
    status?: string;
    hoursPerWeek?: number;
  };
}

export default function ParticipantCard({ participant }: ParticipantCardProps) {
  const {
    id,
    name,
    preferredName,
    photo,
    gender,
    age,
    location,
    services,
    frequency,
    startDate,
    status,
    hoursPerWeek,
  } = participant;

  const displayName = preferredName || name;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const statusColors: Record<string, string> = {
    active: "text-green-600",
    pending: "text-amber-600",
    inactive: "text-gray-500",
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left side - Profile info */}
        <div className="flex flex-col items-center md:items-start md:w-48 flex-shrink-0">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 mb-4">
            {photo ? (
              <Image
                src={photo}
                alt={displayName}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-orange-100 text-orange-600 text-2xl font-semibold">
                {initials}
              </div>
            )}
          </div>

          {/* Name */}
          <h3 className="text-xl font-semibold text-gray-900 font-poppins text-center md:text-left">
            {displayName}
          </h3>

          {/* Preferred name indicator */}
          {preferredName && preferredName !== name && (
            <p className="text-sm text-gray-500 font-poppins mt-1">
              ({name})
            </p>
          )}

          {/* Edit Profile Button */}
          <Link
            href={`/dashboard/client/participants/${id}/edit`}
            className="mt-4 px-4 py-2 border-2 border-orange-500 text-orange-500 rounded-full text-sm font-medium font-poppins hover:bg-orange-50 transition-colors"
          >
            Edit Profile
          </Link>
        </div>

        {/* Right side - Info grid */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
          {/* Gender */}
          <div>
            <p className="text-sm text-gray-500 font-poppins">Gender</p>
            <p className="text-base font-medium text-gray-900 font-poppins capitalize">
              {gender || "Not specified"}
            </p>
          </div>

          {/* Age */}
          <div>
            <p className="text-sm text-gray-500 font-poppins">Age</p>
            <p className="text-base font-medium text-gray-900 font-poppins">
              {age ? `${age} years` : "Not specified"}
            </p>
          </div>

          {/* Location */}
          <div>
            <p className="text-sm text-gray-500 font-poppins">Location</p>
            <p className="text-base font-medium text-gray-900 font-poppins">
              {location || "Not specified"}
            </p>
          </div>

          {/* Status */}
          <div>
            <p className="text-sm text-gray-500 font-poppins">Status</p>
            <p className={`text-base font-medium font-poppins capitalize ${statusColors[status?.toLowerCase() || ""] || "text-gray-900"}`}>
              {status || "Pending"}
            </p>
          </div>

          {/* Frequency */}
          <div>
            <p className="text-sm text-gray-500 font-poppins">Frequency</p>
            <p className="text-base font-medium text-gray-900 font-poppins capitalize">
              {frequency || "Not specified"}
            </p>
          </div>

          {/* Start Date */}
          <div>
            <p className="text-sm text-gray-500 font-poppins">Start Date</p>
            <p className="text-base font-medium text-gray-900 font-poppins">
              {startDate || "ASAP"}
            </p>
          </div>

          {/* Hours per Week */}
          <div>
            <p className="text-sm text-gray-500 font-poppins">Hours/Week</p>
            <p className="text-base font-medium text-gray-900 font-poppins">
              {hoursPerWeek ? `${hoursPerWeek} hrs` : "Not specified"}
            </p>
          </div>

          {/* Services */}
          <div className="col-span-2">
            <p className="text-sm text-gray-500 font-poppins">Services</p>
            {services && services.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {services.slice(0, 3).map((service, index) => (
                  <span
                    key={index}
                    className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full"
                  >
                    {service}
                  </span>
                ))}
                {services.length > 3 && (
                  <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    +{services.length - 3} more
                  </span>
                )}
              </div>
            ) : (
              <p className="text-base font-medium text-gray-900 font-poppins">
                Not specified
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
