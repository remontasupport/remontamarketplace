// The section mode (worker-profile-api U2, C14, rules R9): a definition that seeds its
// values from a read entry's body and saves them to a write entry. One section = one PUT
// (or POST) of a whole section. The validation is the write entry's own body schema, run on
// the body the section would send -- field rules and the cross-field ones (overlapping
// slots, an end before a start) alike -- so the page and apps/api cannot disagree (P11).
// No UI framework here (P-7): apps/app renders a definition and wires it to React.
import { createClient, friendlyError, type Contract, type ContractDef, type EntryDef } from "@remonta/api-contract";
import * as z from "zod";
import { isRetryableStatus, withRetry, type RetryOptions } from "./retry";

// ---- Field kinds of a section --------------------------------------------------------

interface SectionFieldBase {
  /** The write body's field this fills (also the key in the section's values). */
  name: string;
  label: string;
  hint?: string;
  /** Never written to the draft kept on the device (the bank account's numbers). */
  neverSaved?: boolean;
  /** Shown only while this boolean value is false, e.g. an end date while not "currently working". */
  hiddenWhen?: string;
}

export interface SelectOption {
  value: string;
  label?: string;
}

export type SectionFieldDef =
  /** `nullable`: an empty value is sent as null (an optional middle name). */
  | (SectionFieldBase & { kind: "text"; placeholder?: string; nullable?: boolean })
  | (SectionFieldBase & { kind: "textarea"; rows?: number; maxLength?: number })
  /** `nullable`: no choice is sent as null; `numeric`: the body takes the value as a number (a year). */
  | (SectionFieldBase & { kind: "select"; options: readonly SelectOption[] | readonly string[]; nullable?: boolean; numeric?: boolean })
  | (SectionFieldBase & { kind: "multiSelect"; options: readonly string[]; max?: number; allowOwn?: boolean; /** Show this many options, the rest behind a "show all" toggle (presentation only). */ collapseAfter?: number })
  | (SectionFieldBase & { kind: "checkbox" })
  | (SectionFieldBase & { kind: "date" })
  | (SectionFieldBase & { kind: "number"; min?: number; max?: number; unit?: string })
  | (SectionFieldBase & { kind: "locality"; placeholder?: string })
  | (SectionFieldBase & { kind: "timeRanges" })
  | (SectionFieldBase & {
      kind: "orderedList";
      itemFields: SectionFieldDef[];
      addLabel: string;
      itemTitle?: (item: Record<string, unknown>, index: number) => string;
      /**
       * A key the read carries on each row (e.g. `id`) kept on the row, never shown and never sent: the body is built from
       * itemFields only. A row added on the page has none. Lets the page name a stored row (2026-10-14: the row delete).
       */
      rowKey?: string;
    })
  /** A value entered in full and never shown back: the read carries a mask, shown as a placeholder. */
  | (SectionFieldBase & { kind: "maskedSecret"; maskedFrom?: string })
  | (SectionFieldBase & { kind: "abn" });

export type SectionFieldKind = SectionFieldDef["kind"];
export type SectionValues = Record<string, unknown>;

export interface SectionDefinition<C extends ContractDef = ContractDef> {
  /** The page slug and the draft key: `/dashboard/worker/profile/<name>`. */
  name: string;
  title: string;
  description?: string;
  contract: Contract<C>;
  /** The read entry the section seeds from (the profile read). */
  readEntry: keyof C & string;
  /** A dot path into the read body: `names`, `sections.availability`. */
  pick: string;
  writeEntry: keyof C & string;
  fields: SectionFieldDef[];
  /** Body fields the section sets itself, e.g. `{ group: 'languages' }`. */
  constants?: Record<string, unknown>;
  /** Path parameters of the write entry, e.g. `{ group: 'languages' }`. */
  pathParams?: Record<string, string>;
  /** When the picked value does not map field-by-field onto the body (an address, a masked account). */
  seed?: (picked: unknown) => SectionValues;
}

/** The write entry's body schema for this section; a union body (the additional-info groups) resolves to the member the constants select. */
export function sectionBodySchema(def: SectionDefinition): z.ZodType {
  const entry = def.contract.entries[def.writeEntry] as EntryDef | undefined;
  if (!entry || entry.body?.kind !== "json") throw new Error(`section ${def.name}: ${def.writeEntry} has no JSON body`);
  const schema = entry.body.schema as z.ZodType & { options?: z.ZodType[] };
  if (Array.isArray(schema.options)) {
    const member = schema.options.find((m) => {
      const shape = (m as unknown as { shape?: Record<string, z.ZodType> }).shape ?? {};
      return Object.entries(def.constants ?? {}).every(([k, v]) => shape[k]?.safeParse(v).success === true);
    });
    if (!member) throw new Error(`section ${def.name}: no member of ${def.writeEntry}'s body matches the constants`);
    return member;
  }
  return schema;
}

function shapeOf(schema: z.ZodType): Record<string, z.ZodType> {
  const shape = (schema as unknown as { shape?: Record<string, z.ZodType> }).shape;
  if (!shape) throw new Error("the section's body is not an object schema");
  return shape;
}

/** Import-time checks (R9.1): the entries exist, every field is in the body, the pick path is in the read, no field twice. */
export function defineSection<C extends ContractDef>(def: SectionDefinition<C>): SectionDefinition {
  const problems: string[] = [];
  const d = def as unknown as SectionDefinition;
  const read = d.contract.entries[d.readEntry] as EntryDef | undefined;
  if (!read) problems.push(`${d.readEntry} is not in the ${d.contract.area} contract`);
  if (!d.contract.entries[d.writeEntry]) problems.push(`${d.writeEntry} is not in the ${d.contract.area} contract`);
  if (!problems.length) {
    let shape: Record<string, z.ZodType> = {};
    try {
      shape = shapeOf(sectionBodySchema(d));
    } catch (err) {
      problems.push(err instanceof Error ? err.message : String(err));
    }
    const names = d.fields.map((f) => f.name);
    const dup = names.find((n, i) => names.indexOf(n) !== i);
    if (dup) problems.push(`${dup} appears twice`);
    for (const n of [...names, ...Object.keys(d.constants ?? {})]) if (Object.keys(shape).length && !(n in shape)) problems.push(`field ${n} is not in the ${d.writeEntry} body`);
    for (const f of d.fields) if (f.hiddenWhen && !names.includes(f.hiddenWhen)) problems.push(`${f.name}: hiddenWhen ${f.hiddenWhen} is not a field`);
    const readSchema = (read!.responses as Record<number, z.ZodType | undefined>)[200];
    if (readSchema && !pathExists(readSchema, d.pick)) problems.push(`pick ${d.pick} is not in the ${d.readEntry} response`);
    const writeEntry = d.contract.entries[d.writeEntry] as EntryDef;
    const params = Object.keys(writeEntry.pathParams?.shape ?? {});
    for (const p of params) if (!(p in (d.pathParams ?? {}))) problems.push(`path parameter ${p} has no value`);
  }
  if (problems.length) throw new Error(`section ${def.name}: ${problems.join("; ")}`);
  return d;
}

function pathExists(schema: z.ZodType, path: string): boolean {
  let s: unknown = schema;
  for (const key of path.split(".")) {
    s = unwrap(s);
    const shape = (s as { shape?: Record<string, unknown> }).shape;
    if (!shape || !(key in shape)) return false;
    s = shape[key];
  }
  return true;
}

function unwrap(s: unknown): unknown {
  let cur = s as { unwrap?: () => unknown; def?: { innerType?: unknown } };
  for (let i = 0; i < 5 && cur; i++) {
    if (typeof cur.unwrap === "function") cur = cur.unwrap() as typeof cur;
    else if (cur.def?.innerType) cur = cur.def.innerType as typeof cur;
    else break;
  }
  return cur;
}

export function pickPath(body: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((v, k) => (v && typeof v === "object" ? (v as Record<string, unknown>)[k] : undefined), body);
}

/** A copy of `values` with the value at a dot path replaced; numeric segments index arrays. The input is not changed. */
export function setPath<T extends Record<string, unknown>>(values: T, path: string, v: unknown): T {
  const [head, ...rest] = path.split(".");
  const key = head!;
  const copy = (Array.isArray(values) ? [...values] : { ...values }) as Record<string, unknown>;
  if (rest.length === 0) {
    copy[key] = v;
  } else {
    const child = copy[key];
    const base = child && typeof child === "object" ? child : /^\d+$/.test(rest[0]!) ? [] : {};
    copy[key] = setPath(base as Record<string, unknown>, rest.join("."), v);
  }
  return copy as T;
}

// ---- Seed, body, validation ---------------------------------------------------------------

function emptyOf(f: SectionFieldDef): unknown {
  switch (f.kind) {
    case "multiSelect":
    case "timeRanges":
    case "orderedList":
      return [];
    case "checkbox":
      return false;
    case "number":
    case "locality":
      return null;
    case "select":
      return f.nullable ? null : "";
    default:
      return "";
  }
}

/** Each field's empty value: a new row of a list section (the "Add" button). */
export function emptyValuesOf(fields: readonly SectionFieldDef[]): SectionValues {
  return Object.fromEntries(fields.map((f) => [f.name, emptyOf(f)]));
}

/** R9.2: the section's values from the read body; missing or null parts take each kind's empty value. */
export function seedSection(def: SectionDefinition, readBody: unknown): SectionValues {
  return seedFromSaved(def, pickPath(readBody, def.pick));
}

/**
 * R9.5: the values from the section as a write returned it. A write answers with its body's
 * shape (`{ bio }`, `{ slots }`, `{ group, languages }`), which maps by field name; a section
 * with its own `seed` answers with the read's shape (a name, an address, the masked account).
 */
export function seedFromSaved(def: SectionDefinition, picked: unknown): SectionValues {
  if (def.seed) return { ...Object.fromEntries(def.fields.map((f) => [f.name, emptyOf(f)])), ...def.seed(picked) };
  // A picked list or a primitive fills the section's single field; an object maps by name.
  const source: Record<string, unknown> =
    Array.isArray(picked) || (picked !== null && typeof picked !== "object") ? { [def.fields[0]!.name]: picked } : ((picked ?? {}) as Record<string, unknown>);
  return Object.fromEntries(def.fields.map((f) => [f.name, fromRead(f, source[f.name])]));
}

function fromRead(f: SectionFieldDef, v: unknown): unknown {
  if (v === undefined || v === null) return emptyOf(f);
  if (f.kind === "orderedList" && Array.isArray(v)) {
    // Rows carry their id on the read; a replace assigns new ids, so the section works without them -- unless the list
    // names a rowKey, which is kept (from the read, or from a save's answer) and never sent.
    return v.map((row) => {
      const r = row as Record<string, unknown>;
      const fields = Object.fromEntries(f.itemFields.map((i) => [i.name, fromRead(i, r[i.name])]));
      return f.rowKey && typeof r[f.rowKey] === "string" ? { [f.rowKey]: r[f.rowKey], ...fields } : fields;
    });
  }
  if (f.kind === "maskedSecret") return ""; // never shown back
  if (f.kind === "select" && f.numeric) return String(v);
  return v;
}

function toBodyValue(f: SectionFieldDef, v: unknown): unknown {
  switch (f.kind) {
    case "text":
      return typeof v === "string" && v.trim() !== "" ? v : f.nullable ? null : "";
    case "textarea":
      return typeof v === "string" ? v : "";
    case "select":
      if (v === "" || v === null || v === undefined) return f.nullable ? null : "";
      return f.numeric ? Number(v) : v;
    case "locality": {
      const l = v as { id?: number | null } | number | null;
      return typeof l === "number" ? l : (l?.id ?? null);
    }
    case "orderedList":
      return (Array.isArray(v) ? v : []).map((row) => {
        const r = row as Record<string, unknown>;
        return Object.fromEntries(f.itemFields.map((i) => [i.name, hiddenNow(f.itemFields, i, r) ? null : toBodyValue(i, r[i.name])]));
      });
    default:
      return v;
  }
}

function hiddenNow(fields: SectionFieldDef[], f: SectionFieldDef, values: Record<string, unknown>): boolean {
  return !!f.hiddenWhen && fields.some((x) => x.name === f.hiddenWhen) && values[f.hiddenWhen] === true;
}

/** The request body: the constants, then every field's value (a hidden field sends null). */
export function sectionBody(def: SectionDefinition, values: SectionValues): Record<string, unknown> {
  const fields = Object.fromEntries(def.fields.map((f) => [f.name, hiddenNow(def.fields, f, values) ? null : toBodyValue(f, values[f.name])]));
  return { ...(def.constants ?? {}), ...fields };
}

/** Field errors keyed by the body path (`firstName`, `slots.2.startMinute`, `entries.0.endMonth`); empty when the body is valid. */
export function validateSection(def: SectionDefinition, values: SectionValues): Record<string, string[]> {
  // Plain-English messages where the contract names none (2026-10-14), the same wording the api returns.
  const r = sectionBodySchema(def).safeParse(sectionBody(def, values), { error: friendlyError });
  if (r.success) return {};
  const out: Record<string, string[]> = {};
  for (const issue of r.error.issues) (out[issue.path.map(String).join(".") || "_"] ??= []).push(issue.message);
  return out;
}

/** The first message for a field, or for anything under it (`slots` collects `slots.2.startMinute`). */
export function errorFor(errors: Record<string, string[]>, path: string): string | undefined {
  if (errors[path]?.[0]) return errors[path][0];
  const nested = Object.keys(errors).find((k) => k.startsWith(`${path}.`));
  return nested ? errors[nested]![0] : undefined;
}

/** Keys never kept in the draft (R9.3). */
export function sectionNeverSaved(def: SectionDefinition): string[] {
  return def.fields.filter((f) => f.neverSaved).map((f) => f.name);
}

export const sectionDraftId = (def: SectionDefinition) => `section:${def.name}`;

// ---- Saving --------------------------------------------------------------------------------

export type SectionSaveResult =
  | { ok: true; body: unknown }
  | { ok: false; kind: "invalid"; fields: Record<string, string[]> }
  | { ok: false; kind: "unauthenticated" }
  | { ok: false; kind: "failed"; message: string };

export interface SectionSaveDeps {
  apiBaseUrl: string;
  /** A bearer token for the signed-in worker; `invalidate` drops it so the next call fetches a fresh one. */
  token: { getToken(): Promise<string>; invalidate(): void };
  retry?: RetryOptions;
  fetch?: typeof globalThis.fetch;
  timeoutMs?: number;
}

export const SECTION_ATTEMPT_TIMEOUT_MS = 20_000;

/**
 * R9.4: one PUT of the whole section, retried with back-off honouring Retry-After and paused
 * while offline (resending a whole replace is safe: idempotent); a 401 is retried once with a
 * fresh token; a 400 maps the server's field errors back.
 */
export async function saveSection(def: SectionDefinition, values: SectionValues, deps: SectionSaveDeps): Promise<SectionSaveResult> {
  const client = createClient(def.contract, { baseUrl: deps.apiBaseUrl, fetch: deps.fetch }) as unknown as Record<string, (args: unknown, init?: { signal?: AbortSignal; headers?: Record<string, string> }) => Promise<{ ok: boolean; status: number; body: unknown; retryAfterSeconds?: number }>>;
  const send = client[def.writeEntry]!;
  const body = sectionBody(def, values);
  let refreshed = false;
  try {
    const { value: r } = await withRetry(async () => {
      const token = await deps.token.getToken();
      const res = await send({ body, ...(def.pathParams ? { params: def.pathParams } : {}) }, { signal: AbortSignal.timeout(deps.timeoutMs ?? SECTION_ATTEMPT_TIMEOUT_MS), headers: { authorization: `Bearer ${token}` } });
      if (res.ok) return { kind: "done", value: res };
      if (res.status === 401 && !refreshed) {
        refreshed = true;
        deps.token.invalidate();
        return { kind: "retry", reason: "token refreshed", retryAfterSeconds: 0 };
      }
      if (isRetryableStatus(res.status)) return { kind: "retry", reason: `HTTP ${res.status}`, retryAfterSeconds: res.retryAfterSeconds };
      return { kind: "fail", value: res };
    }, deps.retry);
    if (r.ok) return { ok: true, body: r.body };
    if (r.status === 401) return { ok: false, kind: "unauthenticated" };
    const fields = (r.body as { error?: { fields?: Record<string, string[]> } } | null)?.error?.fields;
    if (r.status === 400 && fields) return { ok: false, kind: "invalid", fields };
    return { ok: false, kind: "failed", message: "Something went wrong saving this section. What you typed is kept on this device -- please try again in a moment." };
  } catch (err) {
    if (err && typeof err === "object" && "name" in err && (err as { name: string }).name === "Unauthenticated") return { ok: false, kind: "unauthenticated" };
    return { ok: false, kind: "failed", message: "We couldn't reach Remonta. What you typed is kept on this device -- please check your connection and try again." };
  }
}
