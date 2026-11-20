/**
 * ContractPage Component
 * Main wrapper for contract viewing and signing (the dashboard). The agreement itself (ContractAgreementForm) and the
 * PDF (buildContractPdf) are shared with the sign-up's last step (signup-abn-agreement U2).
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { getContractContent } from "@/config/contractContent";
import { buildContractPdf, preambleProblem, type ContractPreamble } from "@/lib/contractPdf";
import { signContract } from "@/features/worker/compliance";
import { useWorkerProfile } from "@/features/worker/profile";
import ContractAgreementForm, { emptyPreamble } from "./ContractAgreementForm";

interface ContractPageProps {
  contractType: "abn" | "tfn";
  initialTaxId?: string;
}

/** The worker's copy, as the page has always given it (best effort). */
function download(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ContractPage({ contractType, initialTaxId = "" }: ContractPageProps) {
  const [signature, setSignature] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preamble, setPreamble] = useState<ContractPreamble>(() => emptyPreamble("", initialTaxId));

  const contract = getContractContent(contractType);

  // R2a (signup-abn-agreement): the name starts as the worker's own, while the field is still empty.
  const { profile } = useWorkerProfile();
  useEffect(() => {
    const n = profile?.names;
    if (!n) return;
    const full = `${n.firstName} ${n.lastName}`.trim();
    setPreamble((p) => (p.partyName ? p : { ...p, partyName: full }));
  }, [profile]);

  const handleSignatureChange = useCallback((dataUrl: string | null) => {
    setSignature(dataUrl);
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    const problem = preambleProblem(contractType, preamble, signature, agreed);
    if (problem) {
      setError(problem);
      return;
    }
    setIsSubmitting(true);
    setError(null);

    // ── Step 1: Generate the PDF (the signed contract is what proves the engagement) ──
    let pdf: File;
    try {
      pdf = await buildContractPdf(contractType, preamble, signature!);
    } catch (pdfErr) {
      console.error("[Contract] PDF generation failed:", pdfErr);
      setError("We couldn't prepare your contract. Please try again.");
      setIsSubmitting(false);
      return;
    }

    // ── Step 2: Sign on apps/api (U4d): the PDF straight to the private bucket, then the contract and the engagement
    // recorded together. No tax number is sent; the PDF carries it. Nothing is marked signed unless this succeeds. ──
    let signed;
    try {
      signed = await signContract(pdf, contractType);
    } catch {
      signed = { ok: false as const, message: "Unable to reach the server. Please check your connection and try again.", retryable: true };
    }
    if (!signed.ok) {
      setError(signed.message);
      setIsSubmitting(false);
      return;
    }

    // ── Step 3: Download PDF for worker's records (non-critical) ──
    try {
      download(pdf);
    } catch (downloadErr) {
      console.error("[Contract] PDF download failed:", downloadErr);
    }

    // ── Step 4: Notify setup tab (best-effort) ──
    try {
      const bc = new BroadcastChannel("remonta-worker-compliance");
      bc.postMessage({ type: "contract-signed", contractType });
      bc.close();
    } catch {
      // BroadcastChannel not supported — visibilitychange handles the refetch
    }

    setIsSubmitting(false);
    setIsSuccess(true);
  }, [contractType, preamble, signature, agreed]);

  const handleClose = useCallback(() => {
    window.close();
  }, []);

  // Success state
  if (isSuccess) {
    return (
      <div className="contract-page">
        <div className="contract-page-container">
          <div className="contract-header">
            <div className="contract-header-logo">
              <Image
                src="/logo/logo.svg"
                alt="Remonta"
                width={120}
                height={40}
                style={{ height: "auto" }}
              />
            </div>
            <h1 className="contract-title">{contract.title}</h1>
            <p className="contract-subtitle">{contract.subtitle}</p>
          </div>

          <div className="contract-success">
            <div className="contract-success-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
            <h2 className="contract-success-title">Contract Signed Successfully</h2>
            <p className="contract-success-message">
              Thank you for signing the {contract.title}. Your agreement has been
              recorded. You can now close this tab and continue with your
              registration.
            </p>

            <button
              type="button"
              className="contract-success-close-btn"
              onClick={handleClose}
            >
              Close this tab
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="contract-page">
      <div className="contract-page-container">
        {/* Header */}
        <div className="contract-header">
          <div className="contract-header-logo">
            <Image
              src="/logo/logo.svg"
              alt="Remonta"
              width={120}
              height={40}
              style={{ height: "auto" }}
            />
          </div>
          <h1 className="contract-title">{contract.title}</h1>
          <p className="contract-subtitle">{contract.subtitle}</p>
        </div>

        <ContractAgreementForm
          contractType={contractType}
          preamble={preamble}
          onPreambleChange={(patch) => {
            setPreamble((p) => ({ ...p, ...patch }));
            setError(null);
          }}
          onSignatureChange={handleSignatureChange}
          hasSignature={!!signature}
          agreed={agreed}
          onAgreedChange={(v) => {
            setAgreed(v);
            setError(null);
          }}
          error={error}
          submitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
