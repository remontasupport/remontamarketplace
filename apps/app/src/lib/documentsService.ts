// Machine access to GET /api/documents/<id>/<name> (2026-11-25): an automation such as n8n sends
// `x-documents-secret: <DOCUMENTS_SERVICE_SECRET>` instead of a browser session, and the document is fetched as the
// admin account named by DOCUMENTS_SERVICE_USER_ID. The token is still minted through mintApiToken, so that account
// must exist, be ACTIVE and be an ADMIN: suspending it, or removing either variable, switches this access off.
// Pure apart from the constant-time compare, so every branch is tested without Next.
import { timingSafeEqual } from "crypto";

export const DOCUMENTS_SECRET_HEADER = "x-documents-secret";
export const DOCUMENTS_SECRET_MIN_LENGTH = 32;

export interface DocumentsServiceEnv {
  secret: string | undefined;
  userId: string | undefined;
}

/** The session the route acts as for a valid secret, or null (no header, a wrong one, or the access not configured). */
export function serviceSessionFor(
  presented: string | null,
  env: DocumentsServiceEnv,
  nowS: number,
): { user: { id: string; role: "ADMIN"; authAt: number; impersonatedBy?: string } } | null {
  const secret = (env.secret ?? "").trim();
  const userId = (env.userId ?? "").trim();
  if (!presented || secret.length < DOCUMENTS_SECRET_MIN_LENGTH || !userId) return null;
  const given = Buffer.from(presented);
  const expected = Buffer.from(secret);
  // timingSafeEqual throws on a length mismatch, so the length check comes first.
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return { user: { id: userId, role: "ADMIN", authAt: nowS } };
}
