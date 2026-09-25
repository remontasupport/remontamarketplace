/**
 * @remonta/form-engine -- form logic without a UI framework (P-7).
 *
 * A form is a definition (types.ts) bound to an apps/api contract entry. This
 * package decides everything about it -- defaults, validation per backend mode,
 * which step owns which field, the request body, submission with retries, the
 * on-device draft. apps/app renders it (components/ui/form-wizard) and wires it
 * to React (features/forms/useFormWizard).
 */
export * from "./types";
export * from "./kinds";
export * from "./form";
export * from "./submit";
export * from "./retry";
export * from "./draft";
