"use client";

/**
 * The contract of agreement as the worker fills and signs it: the preamble (parties, ABN or TFN, GST, address), the
 * contract text, the signature, the date and the agreement box. Presentational: values in, callbacks out. Used by the
 * dashboard's agreement page (ContractPage) and the sign-up's last step (signup-abn-agreement U2), so both show the
 * same agreement; what happens on "Sign & Accept" is the caller's.
 */
import type { ContractPreamble } from "@/lib/contractPdf";
import { getContractContent } from "@/config/contractContent";
import ContractViewer from "./ContractViewer";
import SignaturePad from "./SignaturePad";

export interface ContractAgreementFormProps {
  contractType: "abn" | "tfn";
  preamble: ContractPreamble;
  onPreambleChange: (patch: Partial<ContractPreamble>) => void;
  onSignatureChange: (dataUrl: string | null) => void;
  hasSignature: boolean;
  agreed: boolean;
  onAgreedChange: (agreed: boolean) => void;
  error: string | null;
  submitting: boolean;
  onSubmit: () => void;
}

export default function ContractAgreementForm({ contractType, preamble, onPreambleChange, onSignatureChange, hasSignature, agreed, onAgreedChange, error, submitting, onSubmit }: ContractAgreementFormProps) {
  const contract = getContractContent(contractType);
  const isContractor = contractType === "abn";
  return (
    <>
      {/* Preamble Section */}
      <div className="contract-preamble">
        <div className="preamble-intro">
          <p className="preamble-text">
            This {contract.title} (&quot;Agreement&quot;) is made and entered into on the <span className="preamble-required">*</span>
          </p>
          <div className="preamble-field">
            <input type="date" value={preamble.agreementDate} onChange={(e) => onPreambleChange({ agreementDate: e.target.value })} className="preamble-input preamble-date-input" />
          </div>
        </div>

        <div className="preamble-parties">
          <p className="preamble-label">by and between:</p>
          <div className="preamble-company">
            <p className="preamble-company-name">
              <strong>Remonta Group Pty Ltd</strong> (trading as Remonta)
            </p>
            <p className="preamble-company-role">(&quot;Company&quot;)</p>
            <p className="preamble-company-address">Located at: 3 Montrose Place, St Andrews, NSW 2566</p>
          </div>

          <p className="preamble-separator">and</p>

          <div className="preamble-party-fields">
            <div className="preamble-field-group">
              <label className="preamble-field-label">
                {isContractor ? "Company / Business / Sole Trader (Provider) Name" : "Employee Name"} <span className="preamble-required">*</span>
              </label>
              <input
                type="text"
                value={preamble.partyName}
                onChange={(e) => onPreambleChange({ partyName: e.target.value })}
                placeholder={isContractor ? "Enter company or provider name" : "Enter employee name"}
                className="preamble-input"
              />
            </div>

            <div className="preamble-field-group">
              <label className="preamble-field-label">
                {isContractor ? "ABN (Australian Business Number)" : "Tax File Number (TFN)"} <span className="preamble-required">*</span>
              </label>
              <input
                type="text"
                value={preamble.partyTaxId}
                onChange={(e) => onPreambleChange({ partyTaxId: e.target.value })}
                placeholder={isContractor ? "12 345 678 901" : "123 456 789"}
                className="preamble-input"
                inputMode="numeric"
              />
            </div>

            {isContractor && (
              <fieldset className="preamble-field-group preamble-radio-group-wrapper">
                <legend className="preamble-field-label">
                  GST Registered <span className="preamble-required">*</span>
                </legend>
                <div className="preamble-radio-group">
                  <label className="preamble-radio-option">
                    <input type="radio" name="gstRegistered" value="yes" checked={preamble.gstRegistered === "yes"} onChange={() => onPreambleChange({ gstRegistered: "yes" })} />
                    Yes
                  </label>
                  <label className="preamble-radio-option">
                    <input type="radio" name="gstRegistered" value="no" checked={preamble.gstRegistered === "no"} onChange={() => onPreambleChange({ gstRegistered: "no" })} />
                    No
                  </label>
                </div>
              </fieldset>
            )}

            <div className="preamble-field-group">
              <label className="preamble-field-label">
                Located at (Address) <span className="preamble-required">*</span>
              </label>
              <input type="text" value={preamble.partyAddress} onChange={(e) => onPreambleChange({ partyAddress: e.target.value })} placeholder="Enter full address" className="preamble-input" />
            </div>
          </div>
        </div>
      </div>

      {/* Contract Content */}
      <ContractViewer contractType={contractType} />

      {/* Signature Section */}
      <div className="contract-signature-section">
        <h3 className="signature-section-title">Sign this Agreement</h3>
        <SignaturePad onSignatureChange={onSignatureChange} />
        <div className="signature-date-field">
          <label className="preamble-field-label">
            Date <span className="preamble-required">*</span>
          </label>
          <input type="date" value={preamble.signatureDate} onChange={(e) => onPreambleChange({ signatureDate: e.target.value })} className="preamble-input preamble-date-input" />
        </div>

        <label className="contract-agreement">
          <input type="checkbox" checked={agreed} onChange={(e) => onAgreedChange(e.target.checked)} />
          <span className="contract-agreement-text">
            I have read and understood all terms and conditions outlined in this Agreement. I agree to comply with the Company&apos;s policies, procedures, and obligations as stated above.
          </span>
        </label>

        {error && <p className="contract-error">{error}</p>}

        <div className="contract-submit-section">
          <button type="button" className="contract-submit-btn" onClick={onSubmit} disabled={submitting || !hasSignature || !agreed}>
            {submitting ? "Submitting..." : "Sign & Accept Agreement"}
          </button>
        </div>
      </div>
    </>
  );
}

/** A fresh preamble: today's dates, the name given (the worker's own, R2a), nothing else. */
export function emptyPreamble(partyName = "", partyTaxId = ""): ContractPreamble {
  const today = new Date().toISOString().split("T")[0]!;
  return { agreementDate: today, partyName, partyTaxId, gstRegistered: "", partyAddress: "", signatureDate: today };
}
