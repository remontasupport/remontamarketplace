/**
 * Service Documents Upload Dialog
 * Shows required and optional documents for a service/subcategory
 * Allows uploading training certificates and qualifications
 */

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";
import { ServiceDocumentRequirement } from "@/config/serviceDocumentRequirements";

interface ServiceDocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceName: string;
  subcategoryId?: string;
  requirements: ServiceDocumentRequirement[];
  uploadedDocuments?: Record<string, any>; // Map of documentType -> uploaded doc
  onUpload: (documentType: string, file: File) => Promise<void>;
  onDelete: (documentType: string) => Promise<void>;
  uploadingFiles: Set<string>;
}

export function ServiceDocumentsDialog({
  open,
  onOpenChange,
  serviceName,
  subcategoryId,
  requirements,
  uploadedDocuments = {},
  onUpload,
  onDelete,
  uploadingFiles,
}: ServiceDocumentsDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});

  // Separate required and optional documents
  const requiredDocs = requirements.filter(req => req.required);
  const optionalDocs = requirements.filter(req => !req.required);

  const handleFileSelect = (documentType: string, file: File | null) => {
    if (!file) {
      setSelectedFiles(prev => {
        const updated = { ...prev };
        delete updated[documentType];
        return updated;
      });
      return;
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a JPG, PNG, or PDF file");
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File size must be less than 10MB");
      return;
    }

    setSelectedFiles(prev => ({
      ...prev,
      [documentType]: file,
    }));
  };

  const handleUpload = async (documentType: string) => {
    const file = selectedFiles[documentType];
    if (!file) return;

    await onUpload(documentType, file);

    // Clear selected file after upload
    setSelectedFiles(prev => {
      const updated = { ...prev };
      delete updated[documentType];
      return updated;
    });
  };

  const handleDelete = async (documentType: string) => {
    if (!window.confirm("Are you sure you want to remove this document?")) {
      return;
    }
    await onDelete(documentType);
  };

  const isPdfDocument = (url: string) => {
    return url.toLowerCase().endsWith('.pdf') || url.includes('.pdf?');
  };

  const renderDocumentRow = (requirement: ServiceDocumentRequirement) => {
    const { type, name, description, required } = requirement;
    const isUploaded = !!uploadedDocuments[type];
    const isUploading = uploadingFiles.has(type);
    const selectedFile = selectedFiles[type];
    const uploadedDoc = uploadedDocuments[type];

    return (
      <div key={type} className="border-b border-gray-200 pb-4 last:border-b-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Label className="text-base font-poppins font-semibold" style={{ color: '#0C1628' }}>
                {name}
              </Label>
              {required ? (
                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded font-poppins font-medium">
                  Required
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-poppins font-medium">
                  Optional
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 font-poppins mt-1">{description}</p>

            {/* Show uploaded document */}
            {isUploaded && uploadedDoc && (
              <div className="mt-3 flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {isPdfDocument(uploadedDoc.documentUrl) ? (
                    <a
                      href={uploadedDoc.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-700 font-poppins hover:underline flex items-center gap-1"
                    >
                      <DocumentIcon className="w-4 h-4" />
                      View Document
                    </a>
                  ) : (
                    <img
                      src={uploadedDoc.documentUrl}
                      alt={name}
                      className="h-16 rounded border border-gray-200 cursor-pointer"
                      onClick={() => window.open(uploadedDoc.documentUrl, '_blank')}
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Uploaded {new Date(uploadedDoc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(type)}
                  className="text-red-600 hover:text-red-700 p-1"
                  title="Remove document"
                >
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Upload button/controls */}
          <div className="flex-shrink-0">
            {!isUploaded && (
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  id={`upload-${type}`}
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={(e) => handleFileSelect(type, e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label
                  htmlFor={`upload-${type}`}
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm font-poppins font-medium text-white bg-[#0C1628] hover:bg-[#1a2740] rounded-md transition-colors"
                >
                  <ArrowUpTrayIcon className="w-4 h-4" />
                  Choose File
                </label>

                {selectedFile && (
                  <div className="text-xs text-gray-600 font-poppins">
                    <p className="truncate max-w-[150px]">{selectedFile.name}</p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleUpload(type)}
                      disabled={isUploading}
                      className="mt-2 w-full"
                    >
                      {isUploading ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-poppins font-semibold" style={{ color: '#0C1628' }}>
            Upload Documents - {serviceName}
            {subcategoryId && <span className="text-gray-600 text-base ml-2">({subcategoryId})</span>}
          </DialogTitle>
          <p className="text-sm text-gray-600 font-poppins mt-2">
            Upload your training certificates and qualifications for this service
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Required Documents Section */}
          {requiredDocs.length > 0 && (
            <div>
              <h3 className="text-lg font-poppins font-semibold mb-4" style={{ color: '#0C1628' }}>
                Required Documents
              </h3>
              <div className="space-y-4">
                {requiredDocs.map(renderDocumentRow)}
              </div>
            </div>
          )}

          {/* Optional Documents Section */}
          {optionalDocs.length > 0 && (
            <div>
              <h3 className="text-lg font-poppins font-semibold mb-4" style={{ color: '#0C1628' }}>
                Optional Documents
              </h3>
              <div className="space-y-4">
                {optionalDocs.map(renderDocumentRow)}
              </div>
            </div>
          )}

          {requirements.length === 0 && (
            <p className="text-center text-gray-500 font-poppins py-8">
              No additional documents required for this service
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
