// GET /api/documents/<id>/<file name>: a worker's private document (api-review U3c, U3b design; compliance U4b). This
// path is what a service or compliance document row stores as `documentUrl`, ending in the file's real extension, so
// every page that opens `documentUrl` directly -- the admin compliance review (link, iframe for a PDF, img for a photo)
// and the worker's Services and Compliance pages -- keeps working. The route checks the session, asks apps/api for a
// five-minute signed link (any of the worker's own documents, or any document for an admin) and redirects to it.
// Nothing is cached; the name segment is only for the viewer and is not trusted.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { adminContract, createClient, workerContract } from "@remonta/api-contract";
import { authOptions } from "@/lib/auth.config";
import { authPrisma, withRetry } from "@/lib/auth-prisma";
import { mintApiToken } from "@/lib/api/mint";
import { checkServerActionRateLimit, publicApiRateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "private, no-store", "referrer-policy": "no-referrer" } as const;
const ID = /^[A-Za-z0-9_-]{1,40}$/;

function answer(status: number, message: string): NextResponse {
  return new NextResponse(message, { status, headers: { ...NO_STORE, "content-type": "text/plain; charset=utf-8" } });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; name: string }> }) {
  const { id } = await params;
  if (!ID.test(id)) return answer(404, "Document not found.");
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return answer(401, "Please sign in to view this document.");

  const minted = await mintApiToken({
    session: { user: { id: session.user.id, role: session.user.role, impersonatedBy: session.user.impersonatedBy, authAt: session.user.authAt } },
    readAccount: (userId) => withRetry(() => authPrisma.user.findUnique({ where: { id: userId }, select: { status: true, role: true, passwordChangedAt: true } })),
    rateLimit: (userId) => checkServerActionRateLimit(userId, publicApiRateLimit),
    secret: process.env.API_TOKEN_SECRET,
  });
  const token = minted.status === 200 ? (minted.body as { token?: unknown }).token : undefined;
  if (typeof token !== "string") return answer(minted.status === 429 ? 429 : minted.status === 401 ? 401 : 503, "This document can't be opened right now. Please try again.");

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) return answer(503, "This document can't be opened right now. Please try again.");
  const headers = { authorization: `Bearer ${token}` };
  let res;
  try {
    res =
      session.user.role === "ADMIN"
        ? await createClient(adminContract, { baseUrl }).getDocumentLink({ params: { documentId: id } }, { headers })
        : await createClient(workerContract, { baseUrl }).getDocumentLink({ params: { documentId: id } }, { headers });
  } catch {
    // The api unreachable, or an answer outside the contract.
    return answer(503, "This document can't be opened right now. Please try again.");
  }
  if (res.ok) return NextResponse.redirect(res.body.url, { status: 302, headers: NO_STORE });
  if (res.status === 404 || res.status === 403) return answer(404, "Document not found.");
  return answer(res.status === 429 ? 429 : 503, "This document can't be opened right now. Please try again.");
}
