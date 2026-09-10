"use client";

import { useEffect } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete File",
  message = "Are you sure you want to delete file?",
  confirmText = "Yes",
  cancelText = "No",
}: ConfirmDialogProps) {
  // Handle ESC key to close dialog
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      // Prevent body scroll when dialog is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="confirm-dialog-overlay"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="confirm-dialog">
        <h3 className="confirm-dialog-title">{title}</h3>
        <p className="confirm-dialog-message">{message}</p>

        <div className="confirm-dialog-buttons">
          <button
            onClick={handleConfirm}
            className="confirm-dialog-btn confirm-dialog-btn-confirm"
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className="confirm-dialog-btn confirm-dialog-btn-cancel"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </>
  );
}
