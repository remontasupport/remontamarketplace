// The sign-up form's resolver (2026-10-14): the contract's rules through react-hook-form, with the plain-English
// messages (api-contract friendlyError) wherever the contract writes none -- the same wording as My Profile and the
// api. The resolver runs its own copy of Zod; the per-parse `error` option still reaches the contract's schemas
// (forms.test.ts proves it on the real sign-up form).
import { zodResolver } from "@hookform/resolvers/zod";
import { friendlyError } from "@remonta/api-contract";

export const wizardResolver = (schema: Parameters<typeof zodResolver>[0]) => zodResolver(schema, { error: friendlyError } as never);
