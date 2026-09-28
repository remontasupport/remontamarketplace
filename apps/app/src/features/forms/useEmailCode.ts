"use client";

// The glue for one `emailCode` field: owns the send/verify status, calls the
// engine, and writes the proof into the form value the sign-up body carries.
// The engine (requestEmailCode / confirmEmailCode) decides the requests and the
// retries; the wizard clears the value again when the address changes (resetsOf).
import { useCallback, useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { confirmEmailCode, requestEmailCode, type ApiBackend, type EmailCodeField, type EmailCodeTicket, type FormDefinition, type RetryOptions } from "@remonta/form-engine";
import type { EmailCodeStatus } from "@/components/ui/form-wizard/fields";

export const RESEND_AFTER_SECONDS = 60;
/** Fewer, shorter retries than the submission: the person is waiting on this button and can press it again. */
const SEND_RETRY = { maxAttempts: 3, maxRetryAfterMs: 5_000 } as const;

type Values = Record<string, unknown>;

export function useEmailCode(def: FormDefinition, backend: ApiBackend, field: EmailCodeField, form: UseFormReturn<Values>, deps: { getCaptchaToken: (action: string) => Promise<string>; retry?: RetryOptions }) {
  const proof = form.watch(field.name);
  const email = (form.watch(field.for) as string | undefined) ?? "";
  const [status, setStatus] = useState<EmailCodeStatus>(proof ? { kind: "verified" } : { kind: "idle" });
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const ticket = useRef<EmailCodeTicket | null>(null);

  // The wizard cleared the proof (the address changed, or a restored draft has none): start over.
  useEffect(() => {
    if (!proof && status.kind === "verified") {
      setStatus({ kind: "idle" });
      setCode("");
      ticket.current = null;
    }
  }, [proof, status.kind]);

  // Resend countdown.
  useEffect(() => {
    if (status.kind !== "sent" || status.resendInSeconds <= 0) return;
    const t = setTimeout(() => setStatus((s) => (s.kind === "sent" ? { kind: "sent", resendInSeconds: s.resendInSeconds - 1 } : s)), 1000);
    return () => clearTimeout(t);
  }, [status]);

  const send = useCallback(async () => {
    setMessage(null);
    if (!(await form.trigger(field.for, { shouldFocus: true }))) return;
    setStatus({ kind: "sending" });
    const r = await requestEmailCode(def, backend, field, email, { ...deps, retry: { ...deps.retry, onRetry: undefined, onOffline: undefined, ...SEND_RETRY } });
    if (!r.ok) {
      setStatus(ticket.current ? { kind: "sent", resendInSeconds: 0 } : { kind: "idle" });
      setMessage(r.message);
      return;
    }
    ticket.current = r.ticket;
    setCode("");
    setStatus({ kind: "sent", resendInSeconds: RESEND_AFTER_SECONDS });
  }, [form, field, def, backend, email, deps]);

  const verify = useCallback(async () => {
    if (!ticket.current) return;
    setMessage(null);
    setStatus({ kind: "verifying" });
    const r = await confirmEmailCode(def, backend, field, { email, code, ticket: ticket.current }, { retry: deps.retry });
    if (!r.ok) {
      setStatus({ kind: "sent", resendInSeconds: 0 });
      setMessage(r.message);
      return;
    }
    form.setValue(field.name, r.proof, { shouldValidate: true, shouldDirty: true });
    setStatus({ kind: "verified" });
  }, [def, backend, field, email, code, deps.retry, form]);

  return { status, code, setCode, message, send, verify, email };
}
