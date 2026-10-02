// What each field KIND means, independent of how it is drawn: its empty value, its
// validation, and what it puts in the request body. The UI draws a kind; this file
// decides it. One entry per kind, shared by every form.
import * as z from "zod";
import type { FieldDef } from "./types";

export interface KindContext {
  field: FieldDef;
  /** The contract body's schema for each field name: the rules apps/api applies. */
  contractShape: Record<string, z.ZodType>;
}

export interface KindRules {
  /** Form-state keys this field owns, with their empty values. */
  defaults(field: FieldDef): Record<string, unknown>;
  /** Validation for each key it owns. */
  schemas(ctx: KindContext): Record<string, z.ZodType>;
  /** What it contributes to the api request body. */
  toBody(field: FieldDef, values: Record<string, unknown>): Record<string, unknown>;
  /** Applied to each keystroke of a text-like field: what the value MAY contain while typed. */
  sanitise?(raw: string): string;
}

/**
 * What an Australian mobile may contain while it is being typed: a leading "+",
 * digits and single spaces, and no more digits than a mobile has -- 10 (04xx xxx xxx),
 * or 11 after the 61 country code (+61 4xx xxx xxx). Anything else typed or pasted
 * is dropped. Whether the number IS a mobile is still the contract's rule.
 */
export function constrainAuMobileInput(raw: string): string {
  let s = raw.replace(/[^0-9+ ]/g, "").replace(/(?!^)\+/g, "").replace(/ +/g, " ").replace(/^ /, "");
  const digits = s.replace(/[^0-9]/g, "");
  const max = s.startsWith("+") || digits.startsWith("61") ? 11 : 10;
  if (digits.length > max) {
    // Cut after the max-th digit.
    let seen = 0;
    let end = 0;
    while (seen < max && end < s.length) if (/[0-9]/.test(s[end++]!)) seen++;
    s = s.slice(0, end);
  }
  return s;
}

/** The rule for `name`: the contract's, so the form and apps/api agree. */
function ruleFor(ctx: KindContext, name: string): z.ZodType {
  const rule = ctx.contractShape[name];
  if (!rule) throw new Error(`field ${name} is not in the contract body`);
  return rule;
}

const plain: KindRules = {
  defaults: (f) => ({ [f.name]: "" }),
  schemas: (ctx) => ({ [ctx.field.name]: ruleFor(ctx, ctx.field.name) }),
  toBody: (f, v) => ({ [f.name]: v[f.name] }),
};

export const localityValue = z.object({
  /** au_localities id; null only from the pre-migration fallback lookup. */
  id: z.number().int().positive().nullable(),
  name: z.string().min(1),
  state: z.string().min(2),
  postcode: z.string().regex(/^\d{3,4}$/),
});
export type LocalityValue = z.infer<typeof localityValue>;

const CHOOSE_SUBURB = "Please choose your suburb from the list";

export const KINDS: Record<FieldDef["kind"], KindRules> = {
  text: plain,
  email: plain,
  phone: { ...plain, sanitise: constrainAuMobileInput },
  password: plain,

  locality: {
    defaults: (f) => ({ [f.name]: null }),
    schemas: (ctx) => ({
      [ctx.field.name]: localityValue
        .nullable()
        .refine((v) => v !== null, CHOOSE_SUBURB)
        // apps/api needs the au_localities id, not the label.
        .refine((v) => v?.id != null, CHOOSE_SUBURB),
    }),
    toBody: (f, v) => ({ [f.name]: (v[f.name] as LocalityValue | null)?.id }),
  },

  services: {
    defaults: (f) => ({ [f.name]: [], ...(f.kind === "services" ? { [f.subcategoriesName]: [] } : {}) }),
    schemas: (ctx) => {
      const f = ctx.field as Extract<FieldDef, { kind: "services" }>;
      return { [f.name]: ruleFor(ctx, f.name), [f.subcategoriesName]: ruleFor(ctx, f.subcategoriesName) };
    },
    toBody: (f, v) => {
      const s = f as Extract<FieldDef, { kind: "services" }>;
      return { [s.name]: v[s.name], [s.subcategoriesName]: v[s.subcategoriesName] };
    },
  },

  photo: {
    defaults: (f) => ({ [f.name]: "" }),
    // Empty is the only thing to catch here; the server checks the id itself.
    schemas: (ctx) => ({ [ctx.field.name]: z.string().min(1, "Profile photo is required") }),
    toBody: (f, v) => ({ [f.name]: v[f.name] }),
  },

  consent: {
    defaults: (f) => ({ [f.name]: false }),
    schemas: (ctx) => ({ [ctx.field.name]: ruleFor(ctx, ctx.field.name) }),
    toBody: (f) => ({ [f.name]: true }),
  },

  emailCode: {
    defaults: (f) => ({ [f.name]: null }),
    // The contract's rule: the proof object, or "Please verify your email address".
    schemas: (ctx) => ({ [ctx.field.name]: ruleFor(ctx, ctx.field.name) }),
    toBody: (f, v) => ({ [f.name]: v[f.name] }),
  },
};
