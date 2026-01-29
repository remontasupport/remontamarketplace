"use client";

import Link from "next/link";
import Image from "next/image";
import { Pencil, MapPin, Calendar, Clock, User, Heart } from "lucide-react";

interface ParticipantDetailPanelProps {
  participant: {
    id: string;
    name: string;
    preferredName?: string;
    photo?: string | null;
    gender?: string;
    age?: number;
    location?: string;
    services?: string[];
    startDate?: string;
    hoursPerWeek?: number;
    fundingType?: string;
    relationshipToClient?: string;
    additionalInfo?: string;
  } | null;
}

export default function ParticipantDetailPanel({
  participant,
}: ParticipantDetailPanelProps) {
  if (!participant) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 h-full flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 font-poppins mb-2">
          Select a participant
        </h3>
        <p className="text-gray-500 font-poppins text-sm">
          Click on a participant from the list to view their details
        </p>
      </div>
    );
  }

  const {
    id,
    name,
    preferredName,
    photo,
    gender,
    age,
    location,
    services,
    startDate,
    hoursPerWeek,
    fundingType,
    relationshipToClient,
    additionalInfo,
  } = participant;

  const displayName = preferredName || name;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formatRelationship = (rel?: string) => {
    if (!rel) return "Not specified";
    return rel.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
              {photo ? (
                <Image
                  src={photo}
                  alt={displayName}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-orange-100 text-orange-600 text-2xl font-semibold">
                  {initials}
                </div>
              )}
            </div>

            {/* Name & Location */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 font-poppins">
                {displayName}
              </h2>
              {preferredName && preferredName !== name && (
                <p className="text-sm text-gray-500 font-poppins">({name})</p>
              )}
              {location && (
                <div className="flex items-center gap-1 mt-1 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-poppins">{location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Edit Button */}
          <Link
            href={`/dashboard/client/participants/${id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium font-poppins hover:bg-indigo-700 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit Profile
          </Link>
        </div>

        {/* Funding Type Badge */}
        {fundingType && (
          <div className="mt-4">
            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              {fundingType}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto" style={{ maxHeight: "calc(100vh - 400px)" }}>
        {/* Personal Details Section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 font-poppins">
            Personal Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 font-poppins">Gender</p>
                <p className="text-sm font-medium text-gray-900 font-poppins capitalize">
                  {gender || "Not specified"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 font-poppins">Age</p>
                <p className="text-sm font-medium text-gray-900 font-poppins">
                  {typeof age === "number" ? `${age} years` : "Not specified"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Heart className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 font-poppins">Relationship</p>
                <p className="text-sm font-medium text-gray-900 font-poppins">
                  {formatRelationship(relationshipToClient)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 font-poppins">Hours/Week</p>
                <p className="text-sm font-medium text-gray-900 font-poppins">
                  {hoursPerWeek ? `${hoursPerWeek} hrs` : "Not specified"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 font-poppins">
            Services Requested
          </h3>
          {services && services.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {services.map((service, index) => (
                <span
                  key={index}
                  className="inline-block px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg"
                >
                  {service}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 font-poppins">No services specified</p>
          )}
        </div>

        {/* Timeline Section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 font-poppins">
            Timeline
          </h3>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 font-poppins">Start Date</p>
              <p className="text-sm font-medium text-gray-900 font-poppins">
                {startDate || "ASAP"}
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
        {additionalInfo && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 font-poppins">
              Additional Information
            </h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 font-poppins whitespace-pre-wrap">
                {additionalInfo}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
