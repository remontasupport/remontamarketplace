"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { BRAND_COLORS } from "@/lib/constants";
import ParticipantListItem from "./ParticipantListItem";
import ParticipantDetailPanel from "./ParticipantDetailPanel";
import EditParticipantModal from "./EditParticipantModal";
import AddClientModal from "./AddClientModal";
import RemoveClientModal from "./RemoveClientModal";

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
  conditions?: string[];
  // Raw data for edit form
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string | null;
}

interface ParticipantsMasterDetailProps {
  participants: ParticipantData[];
  showRelationship?: boolean;
  showRemove?: boolean;
  showAddButton?: boolean;
  title: string;
  subtitle: string;
  defaultToList?: boolean; // When true, starts with no selection (list view on mobile)
  clientName?: { firstName: string; lastName: string };
}

export default function ParticipantsMasterDetail({
  participants: initialParticipants,
  showRelationship = true,
  showRemove = false,
  showAddButton = true,
  title,
  subtitle,
  defaultToList = false,
  clientName,
}: ParticipantsMasterDetailProps) {
  const router = useRouter();
  const [participants, setParticipants] = useState(initialParticipants);
  const [selectedId, setSelectedId] = useState<string | null>(
    defaultToList ? null : (participants.length > 0 ? participants[0].id : null)
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

  const selectedParticipant = participants.find((p) => p.id === selectedId) || null;

  // Get data for edit modal
  const getEditData = () => {
    if (!selectedParticipant) return null;

    // Parse name into firstName and lastName
    const nameParts = selectedParticipant.name.split(" ");
    const firstName = selectedParticipant.firstName || nameParts[0] || "";
    const lastName = selectedParticipant.lastName || nameParts.slice(1).join(" ") || "";

    return {
      id: selectedParticipant.id,
      firstName,
      lastName,
      dateOfBirth: selectedParticipant.dateOfBirth || null,
      gender: selectedParticipant.gender || null,
      relationshipToClient: selectedParticipant.relationshipToClient || null,
      fundingType: selectedParticipant.fundingType || null,
      conditions: selectedParticipant.conditions || [],
      additionalInfo: selectedParticipant.additionalInfo || null,
    };
  };

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleRemoveClick = () => {
    if (!selectedParticipant) return;
    setIsRemoveModalOpen(true);
  };

  const handleRemoveProceed = async () => {
    if (!selectedParticipant) return;

    const response = await fetch(`/api/client/participants/${selectedParticipant.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || "Failed to remove client");
    }

    setIsRemoveModalOpen(false);
    setParticipants((prev) => prev.filter((p) => p.id !== selectedParticipant.id));
    setSelectedId(null);
    router.refresh();
  };

  const handleAddParticipant = (newParticipant: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string | null;
    gender?: string | null;
    relationshipToClient?: string | null;
    fundingType?: string | null;
    conditions?: string[];
    additionalInfo?: string | null;
  }) => {
    // Compute age client-side from dateOfBirth
    let age: number | undefined;
    if (newParticipant.dateOfBirth) {
      const [year, month, day] = newParticipant.dateOfBirth.split("-").map(Number);
      const dob = new Date(year, month - 1, day);
      const today = new Date();
      age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    }

    const startDate = new Date().toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const added: ParticipantData = {
      id: newParticipant.id,
      name: `${newParticipant.firstName} ${newParticipant.lastName}`,
      preferredName: newParticipant.firstName,
      firstName: newParticipant.firstName,
      lastName: newParticipant.lastName,
      dateOfBirth: newParticipant.dateOfBirth ?? null,
      gender: newParticipant.gender ?? undefined,
      age,
      fundingType: newParticipant.fundingType ?? undefined,
      relationshipToClient: newParticipant.relationshipToClient ?? undefined,
      conditions: newParticipant.conditions?.length ? newParticipant.conditions : undefined,
      additionalInfo: newParticipant.additionalInfo ?? undefined,
      startDate,
    };
    setParticipants((prev) => [added, ...prev]);
    setSelectedId(newParticipant.id);
  };

  const handleSaveParticipant = async (data: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string | null;
    gender?: string | null;
    relationshipToClient?: string | null;
    fundingType?: string | null;
    conditions?: string[];
    additionalInfo?: string | null;
  }) => {
    const response = await fetch(`/api/client/participants/${data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth || null,
        gender: data.gender || null,
        relationshipToClient: data.relationshipToClient || null,
        fundingType: data.fundingType || null,
        conditions: data.conditions || [],
        additionalInfo: data.additionalInfo || null,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to update participant");
    }

    // Update local state with the new data
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === data.id
          ? {
              ...p,
              name: `${data.firstName} ${data.lastName}`,
              preferredName: data.firstName,
              firstName: data.firstName,
              lastName: data.lastName,
              dateOfBirth: data.dateOfBirth,
              gender: data.gender || undefined,
              relationshipToClient: data.relationshipToClient || undefined,
              fundingType: data.fundingType || undefined,
              conditions: data.conditions || undefined,
              additionalInfo: data.additionalInfo || undefined,
            }
          : p
      )
    );

    // Refresh the page data
    router.refresh();
  };

  return (
    <>
      {/* Page header + Add Client button */}
      <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h1 className="text-lg md:text-3xl font-semibold font-poppins text-gray-900">
            {title}
          </h1>
          {subtitle && <p className="text-gray-600 font-poppins mt-1">{subtitle}</p>}
        </div>
        {!showRelationship && showAddButton && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium font-poppins text-sm transition-colors hover:opacity-90 flex-shrink-0"
            style={{ backgroundColor: BRAND_COLORS.TERTIARY, color: BRAND_COLORS.PRIMARY }}
          >
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        )}
      </div>

      {/* Empty state */}
      {participants.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-gray-200 transition-colors"
          >
            <Plus className="w-8 h-8 text-gray-400" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900 font-poppins mb-2">
            {showRelationship ? "Add Your Details" : "No clients yet"}
          </h3>
          <p className="text-gray-600 font-poppins">
            {showRelationship
              ? "Click the + button above to add your details and get started."
              : "Click \"Add Client\" above to add your first client."}
          </p>
        </div>
      )}

      {/* Mobile + Desktop Layouts */}
      {participants.length > 0 && (
      <>
      <div className="lg:hidden">
        {/* Show list when no participant selected, or show detail with back button */}
        {!selectedId ? (
          <div className="space-y-3">
            {participants.map((participant) => (
              <ParticipantListItem
                key={participant.id}
                participant={participant}
                isSelected={false}
                onClick={() => setSelectedId(participant.id)}
              />
            ))}
          </div>
        ) : (
          <div>
            {showRelationship === false && (
              <button
                onClick={() => setSelectedId(null)}
                className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 font-poppins"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to list
              </button>
            )}
            <ParticipantDetailPanel
              participant={selectedParticipant}
              onEditClick={handleEditClick}
              onRemoveClick={showRemove ? handleRemoveClick : undefined}
              showRelationship={showRelationship}
            />
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex flex-1 min-h-0 gap-6">
        {/* Left Panel - List */}
        <div className="w-80 flex-shrink-0 flex flex-col min-h-0">
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
        <div className="flex-1 min-h-0">
          <ParticipantDetailPanel
            participant={selectedParticipant}
            onEditClick={handleEditClick}
            onRemoveClick={showRemove ? handleRemoveClick : undefined}
            showRelationship={showRelationship}
          />
        </div>
      </div>
      </>
      )}

      {/* Edit Modal */}
      <EditParticipantModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        participant={getEditData()}
        onSave={handleSaveParticipant}
        showRelationship={showRelationship}
      />

      {/* Remove Client Modal */}
      <RemoveClientModal
        isOpen={isRemoveModalOpen}
        clientName={selectedParticipant?.name || ""}
        onClose={() => setIsRemoveModalOpen(false)}
        onProceed={handleRemoveProceed}
      />

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddParticipant}
        showRelationship={showRelationship}
        initialFirstName={clientName?.firstName}
        initialLastName={clientName?.lastName}
      />
    </>
  );
}
