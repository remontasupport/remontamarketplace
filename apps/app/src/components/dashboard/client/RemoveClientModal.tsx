"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { BRAND_COLORS } from "@/lib/constants";

interface RemoveClientModalProps {
  isOpen: boolean;
  clientName: string;
  onClose: () => void;
  onProceed: (reason: string) => Promise<void>;
}

export default function RemoveClientModal({
  isOpen,
  clientName,
  onClose,
  onProceed,
}: RemoveClientModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setStep(1);
    setReason("");
    onClose();
  };

  const handleProceed = async () => {
    setIsLoading(true);
    try {
      await onProceed(reason);
      setStep(1);
      setReason("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-500/20 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl pointer-events-auto flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 font-poppins">
              Remove Client
            </h2>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            {step === 1 ? (
              <>
                <p className="text-sm text-gray-600 font-poppins mb-4">
                  Reason for removing{" "}
                  <span className="font-semibold text-gray-900">{clientName}</span>{" "}
                  from your clients
                </p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason..."
                  rows={4}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-poppins text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2"
                  autoFocus
                />
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!reason.trim()}
                    className="px-5 py-2 rounded-lg text-sm font-medium font-poppins transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-white"
                    style={{ backgroundColor: BRAND_COLORS.PRIMARY }}
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 font-poppins mb-6">
                  Are you sure you want to remove{" "}
                  <span className="font-semibold text-gray-900">{clientName}</span>{" "}
                  from your clients? This action can be undone by an administrator.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setStep(1)}
                    disabled={isLoading}
                    className="px-5 py-2 rounded-lg text-sm font-medium font-poppins border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProceed}
                    disabled={isLoading}
                    className="px-5 py-2 rounded-lg text-sm font-medium font-poppins bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-40"
                  >
                    {isLoading ? "Removing..." : "Proceed"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
