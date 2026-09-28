// Turning a definition into what a renderer needs: defaults, a validation schema
// for the mode, which step owns which field, and the api request body.
import type { ContractDef, EntryDef } from "@remonta/api-contract";
import * as z from "zod";
import { KINDS, type Mode } from "./kinds";
import type { FieldDef, FormDefinition } from "./types";

/**
 * Validates a definition once, when it is declared.
 *
 * Typed against the specific contract while it is written (so `submitEntry` and
 * friends are checked), and returned as the general FormDefinition that the
 * renderer accepts: `keyof C` makes FormDefinition contravariant in C, so the
 * widening is done here, once, instead of as a cast at every use.
 */
export function defineForm<C extends ContractDef>(def: FormDefinition<C>): FormDefinition {
  const problems: string[] = [];
  const entry = def.contract.entries[def.submitEntry] as EntryDef | undefined;
  if (!entry) problems.push(`${def.submitEntry} is not in the ${def.contract.area} contract`);
  const shape = entry ? bodyShape(entry) : {};
  const keys = def.steps.flatMap((s) => s.fields.flatMap(ownedKeys));
  const dup = keys.find((k, i) => keys.indexOf(k) !== i);
  if (dup) problems.push(`${dup} appears twice`);
  for (const k of keys) if (entry && !(k in shape)) problems.push(`field ${k} is not in the ${def.submitEntry} body`);
  for (const k of [...Object.keys(def.constants ?? {}), ...Object.keys(def.fromQuery ?? {})]) {
    if (entry && !(k in shape)) problems.push(`${k} is not in the ${def.submitEntry} body`);
  }
  def.steps.forEach((s, stepIndex) => {
    for (const f of s.fields) {
      if (f.kind === "photo" && !(f.uploadEntry in def.contract.entries)) problems.push(`photo ${f.name}: ${f.uploadEntry} is not in the contract`);
      if (f.kind === "emailCode") {
        for (const e of [f.sendEntry, f.verifyEntry, ...(f.availabilityEntry ? [f.availabilityEntry] : [])]) {
          if (!(e in def.contract.entries)) problems.push(`emailCode ${f.name}: ${e} is not in the contract`);
        }
        // The address must exist by the time the code is requested: this step or an earlier one.
        const target = def.steps.slice(0, stepIndex + 1).flatMap((x) => x.fields).find((x) => x.name === f.for);
        if (!target || target.kind !== "email") problems.push(`emailCode ${f.name}: ${f.for} is not an email field on this or an earlier step`);
      }
      if (f.enabledWhen && !keys.includes(f.enabledWhen)) problems.push(`${f.name}: enabledWhen ${f.enabledWhen} is not a field`);
      if (f.visibleWhen && !keys.includes(f.visibleWhen)) problems.push(`${f.name}: visibleWhen ${f.visibleWhen} is not a field`);
    }
  });
  if (problems.length) throw new Error(`form ${def.id}: ${problems.join("; ")}`);
  return def as unknown as FormDefinition;
}

export function ownedKeys(f: FieldDef): string[] {
  return f.kind === "services" ? [f.name, f.subcategoriesName] : [f.name];
}

export function bodyShape(entry: EntryDef): Record<string, z.ZodType> {
  const schema = entry.body?.kind === "json" ? entry.body.schema : undefined;
  const shape = (schema as unknown as { shape?: Record<string, z.ZodType> } | undefined)?.shape;
  if (!shape) throw new Error(`${entry.path}: the body is not an object schema`);
  return shape;
}

export function defaultsOf(def: FormDefinition): Record<string, unknown> {
  return Object.assign({}, ...def.steps.flatMap((s) => s.fields.map((f) => KINDS[f.kind].defaults(f))));
}

/** The form-state schema for a mode: the contract's rules, or the legacy ones where they differ. */
export function formSchemaFor(def: FormDefinition, mode: Mode): z.ZodObject {
  const contractShape = bodyShape(def.contract.entries[def.submitEntry] as EntryDef);
  const legacyShape = mode === "legacy" ? (def.legacy?.fieldSchemas ?? {}) : {};
  const entries = def.steps.flatMap((s) => s.fields.map((field) => KINDS[field.kind].schemas({ field, mode, contractShape, legacyShape })));
  return z.object(Object.assign({}, ...entries));
}

/** The keys validated when leaving step `index` (0-based). */
export function keysOfStep(def: FormDefinition, index: number): string[] {
  return def.steps[index]?.fields.flatMap(ownedKeys) ?? [];
}

/** The step (0-based) that owns a key, e.g. to go back to a field the server rejected. */
export function stepOfKey(def: FormDefinition, key: string): number {
  const i = def.steps.findIndex((s) => s.fields.some((f) => ownedKeys(f).includes(key)));
  return i < 0 ? def.steps.length - 1 : i;
}

/** Keys never kept in the on-device draft. */
export function neverSavedKeys(def: FormDefinition): string[] {
  return def.steps.flatMap((s) => s.fields.filter((f) => f.neverSaved).flatMap(ownedKeys));
}

/**
 * Values that no longer hold once another changes: an email verification is for
 * one address, so editing the address clears it (and disables what depended on it).
 */
export function resetsOf(def: FormDefinition): { when: string; reset: string }[] {
  return def.steps.flatMap((s) => s.fields.filter((f) => f.kind === "emailCode").map((f) => ({ when: (f as Extract<FieldDef, { kind: "emailCode" }>).for, reset: f.name })));
}

/** The api request body: constants, URL values, then each field's contribution. */
export function toRequestBody(def: FormDefinition, values: Record<string, unknown>, query: URLSearchParams): Record<string, unknown> {
  const fromQuery = Object.fromEntries(
    Object.entries(def.fromQuery ?? {})
      .map(([key, param]) => [key, query.get(param)] as const)
      .filter(([, v]) => v !== null && v !== ""),
  );
  const fields = def.steps.flatMap((s) => s.fields.map((f) => KINDS[f.kind].toBody(f, values)));
  return Object.assign({}, def.constants ?? {}, fromQuery, ...fields);
}
