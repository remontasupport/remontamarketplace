"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useRequestService } from "./RequestServiceContext";
import { BRAND_COLORS } from "@/lib/constants";

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  hasPendingRequest: boolean;
}

export default function ClientListPanel() {
  const [clients, setClients] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedParticipantId, selectParticipant } = useRequestService();

  useEffect(() => {
    fetch("/api/client/participants")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setClients(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="additional-details-menu" style={{ padding: "1rem 1.25rem" }}>
      {/* Label + note */}
      <p
        style={{
          fontSize: "0.6875rem",
          fontWeight: 600,
          color: "#9ca3af",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "0.25rem",
          fontFamily: "var(--font-poppins, sans-serif)",
        }}
      >
        Clients
      </p>
      <p
        style={{
          fontSize: "0.75rem",
          color: selectedParticipantId ? "#6b7280" : BRAND_COLORS.PRIMARY,
          fontFamily: "var(--font-poppins, sans-serif)",
          marginBottom: "0.75rem",
          fontWeight: selectedParticipantId ? 400 : 500,
        }}
      >
        {selectedParticipantId
          ? "Client selected"
          : "Select a client for your request"}
      </p>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                padding: "0.375rem 0",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: "#f3f4f6",
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  height: 12,
                  width: "60%",
                  borderRadius: 4,
                  backgroundColor: "#f3f4f6",
                }}
              />
            </div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <p
          style={{
            fontSize: "0.8125rem",
            color: "#9ca3af",
            textAlign: "center",
            padding: "0.5rem 0",
            fontFamily: "var(--font-poppins, sans-serif)",
          }}
        >
          No clients yet
        </p>
      ) : (
        <div
          style={{
            maxHeight: "220px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
            marginRight: "-0.25rem",
            paddingRight: "0.25rem",
          }}
        >
          {clients.map((client) => {
            const initials = `${client.firstName.charAt(0)}${client.lastName.charAt(0)}`.toUpperCase();
            const fullName = `${client.firstName} ${client.lastName}`;
            const isSelected = selectedParticipantId === client.id;
            const isPending = client.hasPendingRequest;

            return (
              <button
                key={client.id}
                type="button"
                disabled={isPending}
                onClick={() =>
                  !isPending &&
                  selectParticipant(client.id, {
                    firstName: client.firstName,
                    lastName: client.lastName,
                  })
                }
                title={isPending ? "This client already has a pending request" : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  padding: "0.375rem 0.5rem",
                  borderRadius: "0.5rem",
                  cursor: isPending ? "not-allowed" : "pointer",
                  transition: "background-color 0.15s",
                  backgroundColor: isSelected ? "#fff7ed" : "transparent",
                  border: isSelected ? "1.5px solid #fdba74" : "1.5px solid transparent",
                  width: "100%",
                  textAlign: "left",
                  opacity: isPending ? 0.45 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected && !isPending)
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected && !isPending)
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: isSelected ? BRAND_COLORS.PRIMARY : "#f3f4f6",
                    color: isSelected ? BRAND_COLORS.HIGHLIGHT : "#6b7280",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    flexShrink: 0,
                    fontFamily: "var(--font-poppins, sans-serif)",
                  }}
                >
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.8125rem",
                      color: isSelected ? BRAND_COLORS.PRIMARY : "#374151",
                      fontFamily: "var(--font-poppins, sans-serif)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    {fullName}
                  </span>
                  {isPending && (
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.6875rem",
                        color: "#9ca3af",
                        fontFamily: "var(--font-poppins, sans-serif)",
                      }}
                    >
                      Pending request
                    </span>
                  )}
                </div>
                {isSelected && (
                  <Check
                    style={{ width: 14, height: 14, color: BRAND_COLORS.PRIMARY, flexShrink: 0 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
