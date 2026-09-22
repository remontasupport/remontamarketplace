"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WithdrawButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWithdraw = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/worker/jobs/apply", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setConfirming(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setConfirming(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <p style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "0.25rem" }}>
        {error}
      </p>
    );
  }

  if (confirming) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
        <span style={{ fontSize: "0.75rem", color: "#374151" }}>Withdraw application?</span>
        <button
          onClick={handleWithdraw}
          disabled={isLoading}
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "#fff",
            background: "#dc2626",
            border: "none",
            borderRadius: "0.5rem",
            padding: "0.25rem 0.625rem",
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? "Withdrawing…" : "Yes, withdraw"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={isLoading}
          style={{
            fontSize: "0.75rem",
            fontWeight: 500,
            color: "#6b7280",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0.25rem 0.25rem",
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      style={{
        fontSize: "0.75rem",
        fontWeight: 500,
        color: "#6b7280",
        background: "none",
        border: "1px solid #e5e7eb",
        borderRadius: "0.5rem",
        padding: "0.3rem 0.75rem",
        cursor: "pointer",
        marginTop: "0.5rem",
        transition: "border-color 0.15s, color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#dc2626";
        e.currentTarget.style.color = "#dc2626";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#e5e7eb";
        e.currentTarget.style.color = "#6b7280";
      }}
    >
      Withdraw
    </button>
  );
}
