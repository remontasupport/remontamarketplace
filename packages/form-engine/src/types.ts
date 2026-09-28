// The form engine's vocabulary (S1 step 9 revision, 2026-09-25). A form is DATA:
// steps of fields, each field of a KIND, submitted to a CONTRACT ENTRY. The web app
// renders any definition with one wizard and one component per field kind; the
// validation comes from the contract entry's schema. No UI framework here (P-7).
import type { Contract, ContractDef } from "@remonta/api-contract";
import type * as z from "zod";

export type Backend = { mode: "legacy" } | { mode: "api"; apiBaseUrl: string; recaptchaSiteKey: string };

interface FieldBase {
  /** The contract body field this fills (also the key in the form state). */
  name: string;
  label?: string;
  hint?: string;
  /** Never written to the draft kept on the device (passwords). */
  neverSaved?: boolean;
  /** Disabled until this form-state key holds a value. */
  enabledWhen?: string;
  /** Not shown at all until this form-state key holds a value, e.g. the password until the email is verified. */
  visibleWhen?: string;
}

export type FieldDef =
  | (FieldBase & { kind: "text" })
  | (FieldBase & { kind: "email" })
  | (FieldBase & { kind: "phone" })
  | (FieldBase & { kind: "password"; strengthMeter?: boolean })
  | (FieldBase & { kind: "locality"; placeholder?: string })
  /** Services, and the sub-categories chosen for them (a second contract field). */
  | (FieldBase & { kind: "services"; subcategoriesName: string; title?: string })
  /** A photo staged through another contract entry (api mode); its id is the value. */
  | (FieldBase & { kind: "photo"; uploadEntry: string })
  | (FieldBase & { kind: "consent"; statement: string; paragraphs?: string[] })
  /**
   * A code emailed to the `for` field's address and checked before the step can
   * continue (api mode; legacy has no such step). The value is the proof the
   * sign-up sends: the code and its signed ticket. Changing the address resets it.
   */
  | (FieldBase & { kind: "emailCode"; for: string; sendEntry: string; verifyEntry: string });

export type FieldKind = FieldDef["kind"];

export interface StepDef {
  /** Shown as the step heading; omit when the fields carry their own headings. */
  title?: string;
  fields: FieldDef[];
}

/**
 * The backend that existed before this form moved to apps/api. It keeps the
 * previous rules and request exactly, so switching back to it is a true rollback.
 */
export interface LegacyAdapter {
  /** Previous validation for fields whose rule changed (e.g. names). */
  fieldSchemas: Record<string, z.ZodType>;
  /** Runs after step N (1-based) validates; a returned message keeps the user on that step. */
  afterStep?: Record<number, (values: Record<string, unknown>) => Promise<string | null>>;
  submit(values: Record<string, unknown>, ctx: { query: URLSearchParams }): Promise<SubmitResult>;
}

export type SubmitResult =
  | { ok: true }
  | { ok: false; kind: "invalid"; fields: Record<string, string[]> }
  | { ok: false; kind: "failed"; message: string };

export interface FormDefinition<C extends ContractDef = ContractDef> {
  /** Stable id: the draft key, analytics. Bump the suffix when the steps change shape. */
  id: string;
  contract: Contract<C>;
  /** The entry that receives the submission. Its body schema is the validation. */
  submitEntry: keyof C & string;
  /** reCAPTCHA v3 action, fetched fresh for every attempt (api mode). */
  captcha?: string;
  /** Body fields the form sets itself, e.g. the consent wording version. */
  constants?: Record<string, unknown>;
  /** Body fields taken from the page URL: { zohoLeadId: "id" } reads ?id=. */
  fromQuery?: Record<string, string>;
  intro?: { title: string; text: string; button: string };
  steps: StepDef[];
  successRedirect: string;
  legacy?: LegacyAdapter;
}
