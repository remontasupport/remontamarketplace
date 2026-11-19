"use client";

// The sign-up's last step (signup-abn-agreement U2): the dashboard's ABN Contractor Agreement. "Sign & Accept Agreement"
// checks the preamble and the ABN on the device, builds the signed PDF, uploads it by ticket and sets the field to
// { uploadId, fileName, abn }; Complete Signup sends it and apps/api records it with the account (R4-R7). Nothing of it
// is kept in the on-device draft (neverSaved).
import { useEffect, useState } from "react";
import { useController, useWatch, type Control } from "react-hook-form";
import { CheckCircle2 } from "lucide-react";
import type { FieldDef } from "@remonta/form-engine";
import { abnNumberSchema } from "@remonta/schemas/schema/workerRegistrationSchema";
import ContractAgreementForm, { emptyPreamble } from "@/components/contracts/ContractAgreementForm";
import { Button } from "@/components/ui/button";
import { buildContractPdf, preambleProblem, type ContractPreamble } from "@/lib/contractPdf";
import type { useFormWizard } from "./useFormWizard";
import "@/app/styles/contract.css";

type Values = Record<string, unknown>;
type AgreementDef = Extract<FieldDef, { kind: "agreement" }>;
type Signed = { uploadId: string; fileName: string; abn: string };

export function AgreementSlot({ field, control, wizard, error }: { field: AgreementDef; control: Control<Values>; wizard: ReturnType<typeof useFormWizard>; error?: string }) {
  const { field: value } = useController({ name: field.name, control });
  const [first, last] = useWatch({ control, name: [...field.nameFrom] }) as [string | undefined, string | undefined];
  // R2a: the name starts as the worker's own (from the details step), editable.
  const [preamble, setPreamble] = useState<ContractPreamble>(() => emptyPreamble(`${first ?? ""} ${last ?? ""}`.trim()));
  const [signature, setSignature] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const signed = value.value as Signed | null;

  // A refusal from the server ("Please sign the agreement again") clears the signature: the worker signs again.
  useEffect(() => {
    if (error && signed) value.onChange(null);
  }, [error, signed, value]);

  async function sign() {
    const missing = preambleProblem("abn", preamble, signature, agreed);
    if (missing) return setProblem(missing);
    const abn = abnNumberSchema.safeParse(preamble.partyTaxId);
    if (!abn.success) return setProblem(abn.error.issues[0]?.message ?? "That is not a valid ABN");
    setSigning(true);
    setProblem(null);
    try {
      const pdf = await buildContractPdf("abn", preamble, signature!);
      const uploadId = await wizard.agreementUploaderFor(field)(pdf);
      value.onChange({ uploadId, fileName: pdf.name, abn: abn.data } satisfies Signed);
    } catch (err) {
      setProblem(err instanceof Error && err.name === "UploadFieldError" ? err.message : "We couldn't prepare your agreement. Please try again.");
    } finally {
      setSigning(false);
    }
  }

  if (signed) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 font-poppins">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" aria-hidden />
          <div className="space-y-1">
            <p className="text-lg font-medium text-gray-900">Agreement signed</p>
            <p className="text-sm text-gray-600">Your signed Contractor Agreement will be saved to your account when you complete your sign-up. You can view it on your dashboard afterwards.</p>
          </div>
        </div>
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              value.onChange(null);
              setSignature(null);
              setAgreed(false);
            }}
          >
            Change
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="contract-page !min-h-0 !bg-transparent !p-0">
      <div className="contract-page-container !max-w-none !p-0 !shadow-none">
        <ContractAgreementForm
          contractType="abn"
          preamble={preamble}
          onPreambleChange={(patch) => {
            setPreamble((p) => ({ ...p, ...patch }));
            setProblem(null);
          }}
          onSignatureChange={(d) => {
            setSignature(d);
            setProblem(null);
          }}
          hasSignature={!!signature}
          agreed={agreed}
          onAgreedChange={(v) => {
            setAgreed(v);
            setProblem(null);
          }}
          error={problem ?? error ?? null}
          submitting={signing}
          onSubmit={sign}
        />
      </div>
    </div>
  );
}
