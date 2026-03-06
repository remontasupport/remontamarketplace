import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authPrisma, withRetry } from "./auth-prisma";
import { UserRole } from "@/types/auth";
import { getOrFetch, getCached, setCached, CACHE_KEYS, CACHE_TTL, invalidateCache } from "./redis";

// ============================================================================
// IMPERSONATION FLOW
// ============================================================================

async function handleImpersonation(email: string, token: string) {
  const normalizedEmail = email.toLowerCase()
  const tokenId = { identifier: `impersonation:${normalizedEmail}`, token }

  const tokenRecord = await withRetry(() =>
    authPrisma.verificationToken.findUnique({ where: { identifier_token: tokenId } })
  )

  if (!tokenRecord) throw new Error("Invalid impersonation token")

  if (tokenRecord.expires < new Date()) {
    await authPrisma.verificationToken.delete({ where: { identifier_token: tokenId } })
    throw new Error("Impersonation token expired")
  }

  const user = await authPrisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, email: true, role: true, status: true },
  })

  if (!user) throw new Error("User not found")
  if (user.status !== "ACTIVE") throw new Error(`Account is ${user.status.toLowerCase()}`)

  // Consume one-time token
  await authPrisma.verificationToken.delete({ where: { identifier_token: tokenId } })

  const isRestore = token.startsWith("restore_")
  const adminId = isRestore ? undefined : token.split("_")[2]

  return {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
    name: user.email.split("@")[0],
    ...(!isRestore && { impersonatedBy: adminId }),
  }
}

// ============================================================================
// NORMAL LOGIN FLOW
// ============================================================================

async function handleNormalLogin(email: string, password: string, rememberMe: boolean) {
  const normalizedEmail = email.toLowerCase()

  const user = await getOrFetch(
    CACHE_KEYS.user(normalizedEmail),
    () => withRetry(() => authPrisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: {
        id: true, email: true, passwordHash: true, role: true,
        status: true, failedLoginAttempts: true, accountLockedUntil: true,
      },
    })),
    CACHE_TTL.USER_DATA
  )

  if (!user?.passwordHash) throw new Error("Invalid credentials")

  // Account locked — active lock
  if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
    const secondsLeft = Math.ceil((user.accountLockedUntil.getTime() - Date.now()) / 1000)
    throw new Error(`ACCOUNT_LOCKED:${secondsLeft}`)
  }

  // Expired lock — reset counter so user gets fresh attempts
  if (user.accountLockedUntil && user.accountLockedUntil <= new Date()) {
    authPrisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, accountLockedUntil: null },
    }).catch(() => {})
    invalidateCache(CACHE_KEYS.user(normalizedEmail)).catch(() => {})
    user.failedLoginAttempts = 0
    user.accountLockedUntil = null
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash)

  if (!isValidPassword) {
    const attemptsKey = `login_attempts:${user.id}`
    const failedAttempts = (await getCached<number>(attemptsKey) ?? 0) + 1

    authPrisma.auditLog.create({ data: { userId: user.id, action: "LOGIN_FAILED" } }).catch(() => {})

    if (failedAttempts >= 3) {
      const lockUntil = new Date(Date.now() + 30_000)
      await authPrisma.user.update({
        where: { id: user.id },
        data: { accountLockedUntil: lockUntil, failedLoginAttempts: failedAttempts },
      })
      invalidateCache(attemptsKey).catch(() => {})
      invalidateCache(CACHE_KEYS.user(normalizedEmail)).catch(() => {})
      throw new Error("ACCOUNT_LOCKED:30")
    }

    setCached(attemptsKey, failedAttempts, 10 * 60).catch(() => {})
    authPrisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: failedAttempts },
    }).catch(() => {})

    throw new Error("Invalid credentials")
  }

  if (user.status !== "ACTIVE") throw new Error(`Account is ${user.status.toLowerCase()}`)

  // Fire-and-forget post-login updates — user gets session immediately
  authPrisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, accountLockedUntil: null, lastLoginAt: new Date() },
  }).catch(() => {})
  authPrisma.auditLog.create({ data: { userId: user.id, action: "LOGIN_SUCCESS" } }).catch(() => {})
  // Only clear the attempts counter — keep the user cache warm for the next signin
  invalidateCache(`login_attempts:${user.id}`).catch(() => {})

  return {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
    name: user.email.split("@")[0],
    rememberMe,
  }
}

// ============================================================================
// AUTH CONFIG
// ============================================================================

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" },
        impersonationToken: { label: "Impersonation Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) throw new Error("Missing credentials")

        if (credentials.impersonationToken) {
          return handleImpersonation(credentials.email, credentials.impersonationToken)
        }

        if (!credentials.password) throw new Error("Missing password")
        return handleNormalLogin(
          credentials.email,
          credentials.password,
          credentials.rememberMe === "true"
        )
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.email = user.email
        const rememberMe = (user as any).rememberMe ?? false
        token.exp = Math.floor(Date.now() / 1000) + (rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60)
        if ((user as any).impersonatedBy) {
          token.impersonatedBy = (user as any).impersonatedBy
        }
      }

      if (trigger === "update" && token.id) {
        const cacheKey = CACHE_KEYS.user(token.email as string)
        const cached = await getCached<{ email: string; role: string }>(cacheKey)
        if (cached?.email) {
          token.email = cached.email
          token.role = cached.role
        } else {
          const freshUser = await withRetry(() => authPrisma.user.findUnique({
            where: { id: token.id as string },
            select: { email: true, role: true },
          }))
          if (freshUser) {
            token.email = freshUser.email
            token.role = freshUser.role
          }
        }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.email = token.email as string
        session.user.impersonatedBy = token.impersonatedBy as string | undefined
      }
      return session
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("http")) return url.startsWith(baseUrl) ? url : baseUrl
      if (url.startsWith("/")) return `${baseUrl}${url}`
      return baseUrl
    },
  },

  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
    verifyRequest: "/auth/verify-email",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,

  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "production"
          ? process.env.NEXTAUTH_URL?.replace(/https?:\/\//, "").split(":")[0]
          : undefined,
      },
    },
    callbackUrl: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "production"
          ? process.env.NEXTAUTH_URL?.replace(/https?:\/\//, "").split(":")[0]
          : undefined,
      },
    },
    csrfToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Host-" : ""}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  useSecureCookies: process.env.NODE_ENV === "production",
  debug: process.env.NODE_ENV === "development",
}
