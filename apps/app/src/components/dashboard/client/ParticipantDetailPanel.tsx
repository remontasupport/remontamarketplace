"use client";

import { useState } from "react";
import Image from "next/image";
import { Pencil, Calendar, User, Heart, Cake, ChevronDown } from "lucide-react";
import { BRAND_COLORS } from "@/lib/constants";

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
  onRemoveClick?: () => void;
  showRelationship?: boolean;
}

export default function ParticipantDetailPanel({
  participant,
  onEditClick,
  onRemoveClick,
  showRelationship = true,
}: ParticipantDetailPanelProps) {
  const [isNdisExpanded, setIsNdisExpanded] = useState(false);

  if (!participant) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 lg:h-full flex flex-col items-center justify-center text-center">
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
    photo,
    gender,
    age,
    dateOfBirth,
    relationshipToClient,
    additionalInfo,
  } = participant;

  // Parse additionalInfo — may be JSON with { notes, ndisDetails } or plain text
  type NdisDetails = {
    managementType?: string;
    planManagerName?: string;
    invoiceEmail?: string;
    emailToCC?: string;
    ndisNumber?: string;
    planStartDate?: string;
    planEndDate?: string;
    ndisDob?: string;
  };
  type ParsedAdditionalInfo = { notes?: string; ndisDetails?: NdisDetails };

  let parsedInfo: ParsedAdditionalInfo | null = null;
  try {
    if (additionalInfo) {
      const p = JSON.parse(additionalInfo);
      if (typeof p === "object" && p !== null) parsedInfo = p as ParsedAdditionalInfo;
    }
  } catch {
    // plain text — render as-is
  }

  const formatManagementType = (type?: string) =>
    type ? type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : "";

  const formatShortDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
  };

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

  const initials = name
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
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden min-h-[calc(100vh-220px)] lg:min-h-0 lg:h-full lg:flex lg:flex-col">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
              {photo ? (
                <Image
                  src={photo}
                  alt={name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-base sm:text-xl font-semibold" style={{ backgroundColor: BRAND_COLORS.HIGHLIGHT, color: BRAND_COLORS.PRIMARY }}>
                  {initials}
                </div>
              )}
            </div>

            {/* Name */}
            <div>
              <h2 className="text-base sm:text-xl font-semibold text-gray-900 font-poppins">
                {name}
              </h2>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={onEditClick}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-md text-xs font-medium font-poppins transition-colors"
              style={{ backgroundColor: BRAND_COLORS.HIGHLIGHT, color: BRAND_COLORS.PRIMARY }}
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Profile
            </button>
            {onRemoveClick && (
              <button
                onClick={onRemoveClick}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-md text-xs font-medium font-poppins transition-colors border border-red-200 text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 lg:flex-1 lg:overflow-y-auto lg:min-h-0">
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
                  {typeof age === "number" ? `${age} y/o` : "Not specified"}
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
            {parsedInfo ? (
              <div className="space-y-3">
                {/* Notes */}
                {parsedInfo.notes && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 font-poppins mb-1">Notes</p>
                    <p className="text-sm text-gray-700 font-poppins whitespace-pre-wrap">{parsedInfo.notes}</p>
                  </div>
                )}

                {/* NDIS Details collapsible */}
                {parsedInfo.ndisDetails && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setIsNdisExpanded((v) => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                    >
                      <span className="text-sm font-semibold text-gray-900 font-poppins">NDIS Details</span>
                      <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isNdisExpanded ? "rotate-180" : ""}`} />
                    </button>

                    {isNdisExpanded && (
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        {parsedInfo.ndisDetails.ndisNumber && (
                          <div>
                            <p className="text-xs text-gray-500 font-poppins">NDIS Number</p>
                            <p className="text-sm font-medium text-gray-900 font-poppins">{parsedInfo.ndisDetails.ndisNumber}</p>
                          </div>
                        )}
                        {parsedInfo.ndisDetails.managementType && (
                          <div>
                            <p className="text-xs text-gray-500 font-poppins">Management Type</p>
                            <p className="text-sm font-medium text-gray-900 font-poppins">{formatManagementType(parsedInfo.ndisDetails.managementType)}</p>
                          </div>
                        )}
                        {parsedInfo.ndisDetails.planManagerName && (
                          <div>
                            <p className="text-xs text-gray-500 font-poppins">Plan Manager</p>
                            <p className="text-sm font-medium text-gray-900 font-poppins">{parsedInfo.ndisDetails.planManagerName}</p>
                          </div>
                        )}
                        {parsedInfo.ndisDetails.invoiceEmail && (
                          <div>
                            <p className="text-xs text-gray-500 font-poppins">Invoice Email</p>
                            <p className="text-sm font-medium text-gray-900 font-poppins">{parsedInfo.ndisDetails.invoiceEmail}</p>
                          </div>
                        )}
                        {parsedInfo.ndisDetails.emailToCC && (
                          <div>
                            <p className="text-xs text-gray-500 font-poppins">Email to CC</p>
                            <p className="text-sm font-medium text-gray-900 font-poppins">{parsedInfo.ndisDetails.emailToCC}</p>
                          </div>
                        )}
                        {parsedInfo.ndisDetails.ndisDob && (
                          <div>
                            <p className="text-xs text-gray-500 font-poppins">Date of Birth (NDIS)</p>
                            <p className="text-sm font-medium text-gray-900 font-poppins">{formatShortDate(parsedInfo.ndisDetails.ndisDob)}</p>
                          </div>
                        )}
                        {parsedInfo.ndisDetails.planStartDate && (
                          <div>
                            <p className="text-xs text-gray-500 font-poppins">Plan Start Date</p>
                            <p className="text-sm font-medium text-gray-900 font-poppins">{formatShortDate(parsedInfo.ndisDetails.planStartDate)}</p>
                          </div>
                        )}
                        {parsedInfo.ndisDetails.planEndDate && (
                          <div>
                            <p className="text-xs text-gray-500 font-poppins">Plan End Date</p>
                            <p className="text-sm font-medium text-gray-900 font-poppins">{formatShortDate(parsedInfo.ndisDetails.planEndDate)}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 font-poppins whitespace-pre-wrap">{additionalInfo}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
