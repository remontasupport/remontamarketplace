"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import ParticipantListItem from "./ParticipantListItem";
import ParticipantDetailPanel from "./ParticipantDetailPanel";

export interface ParticipantData {
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
}

interface ParticipantsMasterDetailProps {
  participants: ParticipantData[];
}

export default function ParticipantsMasterDetail({
  participants,
}: ParticipantsMasterDetailProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    participants.length > 0 ? participants[0].id : null
  );

  const selectedParticipant = participants.find((p) => p.id === selectedId) || null;

  if (participants.length === 0) {
    return (
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
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-220px)] min-h-[500px]">
      {/* Left Panel - List */}
      <div className="w-80 flex-shrink-0 flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {participants.map((participant) => (
            <ParticipantListItem
              key={participant.id}
              participant={participant}
              isSelected={participant.id === selectedId}
              onClick={() => setSelectedId(participant.id)}
            />
          ))}
        </div>
      </div>

      {/* Right Panel - Detail */}
      <div className="flex-1">
        <ParticipantDetailPanel participant={selectedParticipant} />
      </div>
    </div>
  );
}
