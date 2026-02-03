"use client";

import Image from "next/image";
import Link from "next/link";
import { Pencil, MapPin, Calendar, User, Heart, Cake } from "lucide-react";

interface ParticipantDetailPanelProps {
  participant: {
    id: string;
    name: string;
    preferredName?: string;
    photo?: string | null;
    gender?: string;
    age?: number;
    dateOfBirth?: string | null;
    location?: string;
    services?: string[];
    startDate?: string;
    fundingType?: string;
    relationshipToClient?: string;
    additionalInfo?: string;
    conditions?: string[];
  } | null;
  onEditClick?: () => void;
  showRelationship?: boolean;
  basePath?: string;
}

export default function ParticipantDetailPanel({
  participant,
  onEditClick,
  showRelationship = true,
  basePath = '/dashboard/client',
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
    dateOfBirth,
    location,
    services,
    relationshipToClient,
    additionalInfo,
  } = participant;

  // Format date of birth for display
  const formatDateOfBirth = (dob?: string | null) => {
    if (!dob) return "Not specified";
    const date = new Date(dob);
    if (isNaN(date.getTime())) return "Not specified";
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

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
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
              {photo ? (
                <Image
                  src={photo}
                  alt={displayName}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-orange-100 text-orange-600 text-xl sm:text-2xl font-semibold">
                  {initials}
                </div>
              )}
            </div>

            {/* Name & Location */}
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 font-poppins">
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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={onEditClick}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-md text-xs font-medium font-poppins transition-colors"
              style={{ backgroundColor: '#F8E8D8', color: '#0C1628' }}
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Profile
            </button>
            <Link
              href={`${basePath}/request-service/edit/${participant.id}`}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-md text-xs font-medium font-poppins text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: '#0C1628' }}
            >
              Modify Request
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 overflow-y-auto" style={{ maxHeight: "calc(100vh - 400px)" }}>
        {/* Personal Details Section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 font-poppins">
            Personal Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
            {showRelationship && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Heart className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 font-poppins">Relationship</p>
                  <p className="text-sm font-medium text-gray-900 font-poppins">
                    {formatRelationship(relationshipToClient)}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Cake className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 font-poppins">Date of Birth</p>
                <p className="text-sm font-medium text-gray-900 font-poppins">
                  {formatDateOfBirth(dateOfBirth)}
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

        {/* Conditions Section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 font-poppins">
            Conditions/Disabilities
          </h3>
          {participant.conditions && participant.conditions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {participant.conditions.map((condition, index) => (
                <span
                  key={index}
                  className="inline-block px-3 py-1.5 bg-purple-50 text-purple-700 text-sm font-medium rounded-lg"
                >
                  {condition}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 font-poppins">No conditions specified</p>
          )}
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
