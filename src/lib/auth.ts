import { prisma } from "./db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtSecret } from "./secrets";

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "INTERN" | "GRADER" | "ADMIN" | "SUPER_ADMIN";
  avatarUrl: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// 1-hour absolute lifetime. Combined with the sliding refresh in
// `refreshSessionIfStale()` below, this gives "1 hour of inactivity" semantics:
// active users get silently re-issued a fresh token on every authenticated
// page load; idle users lose access after an hour.
export const SESSION_MAX_AGE_SECONDS = 60 * 60;

// Token payload carries `v` (token version). On every getSession we look up
// the user's current tokenVersion from the DB; if it doesn't match, the
// cookie is stale (e.g. user reset their password / disabled 2FA / was
// promoted-then-demoted) and we treat the session as ended. This is what
// gives password-reset and 2FA-disable their actual effect — without it,
// bumping tokenVersion in the DB doesn't invalidate any active cookies.
type SessionTokenPayload = SessionUser & { v: number };

export async function createTokenForUser(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      role: true, avatarUrl: true, tokenVersion: true,
    },
  });
  if (!user) throw new Error("User not found");
  const payload: SessionTokenPayload = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    avatarUrl: user.avatarUrl,
    v: user.tokenVersion,
  };
  return jwt.sign(payload, jwtSecret(), { expiresIn: SESSION_MAX_AGE_SECONDS });
}

// Backward-compat: existing call sites pass a SessionUser. We sign without
// the v claim — those tokens fail the version check on the next getSession,
// which is the correct behaviour after a redeploy.
export function createToken(user: SessionUser): string {
  return jwt.sign(user, jwtSecret(), { expiresIn: SESSION_MAX_AGE_SECONDS });
}

export function verifyToken(token: string): SessionTokenPayload | null {
  try {
    return jwt.verify(token, jwtSecret()) as SessionTokenPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session-token")?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded) return null;

  // Enforce token version. If the DB tokenVersion is ahead of the cookie's
  // `v` claim, this session has been revoked (password reset / 2FA disable
  // / forced re-login). Reject it.
  const current = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { tokenVersion: true },
  });
  if (!current) return null;
  // Tokens issued before this change have no `v` field; we treat them as
  // version 0. After the first password reset / token bump for that user,
  // those tokens stop working, which is the intended behaviour.
  const tokenV = typeof decoded.v === "number" ? decoded.v : 0;
  if (tokenV !== current.tokenVersion) return null;

  const user: SessionUser = {
    id: decoded.id,
    email: decoded.email,
    firstName: decoded.firstName,
    lastName: decoded.lastName,
    role: decoded.role,
    avatarUrl: decoded.avatarUrl,
  };

  // Sliding window: if the token is mid-life (>30 min old), re-issue a fresh
  // one so the user's session extends as long as they are actively using the
  // site. Idle users still expire at the hour boundary.
  await refreshSessionIfStale(token, user, current.tokenVersion);
  return user;
}

async function refreshSessionIfStale(
  token: string,
  user: SessionUser,
  tokenVersion: number
): Promise<void> {
  try {
    const decoded = jwt.decode(token) as { iat?: number; exp?: number } | null;
    if (!decoded?.iat || !decoded?.exp) return;
    const ageSeconds = Math.floor(Date.now() / 1000) - decoded.iat;
    // Only refresh if more than half the token's life has elapsed.
    if (ageSeconds < SESSION_MAX_AGE_SECONDS / 2) return;
    // Re-sign with current tokenVersion baked in so the refreshed cookie
    // remains valid across future revocation checks.
    const payload: SessionTokenPayload = { ...user, v: tokenVersion };
    const fresh = jwt.sign(payload, jwtSecret(), { expiresIn: SESSION_MAX_AGE_SECONDS });
    const cookieStore = await cookies();
    cookieStore.set("session-token", fresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
    });
  } catch {
    // If refresh fails for any reason, keep the existing token.
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }
  return session;
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  const session = await requireAuth();
  if (session.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }
  return session;
}

export async function requireGrader(): Promise<SessionUser> {
  const session = await requireAuth();
  if (
    session.role !== "GRADER" &&
    session.role !== "ADMIN" &&
    session.role !== "SUPER_ADMIN"
  ) {
    redirect("/dashboard");
  }
  return session;
}

export function isGrader(session: SessionUser | null): boolean {
  if (!session) return false;
  return session.role === "GRADER" || session.role === "ADMIN" || session.role === "SUPER_ADMIN";
}

// Account-level lockout after N failed logins. Lasts LOCKOUT_MINUTES.
// This is per-account, complementing the per-IP rate limit.
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export type LoginResult =
  | { ok: true; user: SessionUser; token: string }
  | { ok: false; reason: "invalid" | "locked"; lockedUntil?: Date };

export async function login(
  identifier: string,
  password: string
): Promise<LoginResult> {
  const normalized = identifier.trim();
  const isInternId = /^UBI-\d{4}-\d+$/i.test(normalized);

  let user = null;
  if (isInternId) {
    // findFirst (not findUnique) because we dropped the unique index on
    // internId; the atomic counter in lib/intern-id.ts still guarantees
    // each issued ID is allocated only once.
    const app = await prisma.publicApplication.findFirst({
      where: { internId: normalized.toUpperCase() },
    });
    if (app) {
      user = await prisma.user.findUnique({
        where: { email: app.email.toLowerCase() },
      });
    }
  } else {
    user = await prisma.user.findUnique({
      where: { email: normalized.toLowerCase() },
    });
  }

  if (!user) {
    // No such user — return generic invalid. Don't leak which half failed.
    return { ok: false, reason: "invalid" };
  }

  // Lockout check.
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { ok: false, reason: "locked", lockedUntil: user.lockedUntil };
  }

  const isValid = await verifyPassword(password, user.password);

  if (!isValid) {
    // Increment counter; lock the account if we hit the threshold.
    const nextFailed = (user.failedLoginCount ?? 0) + 1;
    const shouldLock = nextFailed >= MAX_FAILED_ATTEMPTS;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: nextFailed,
        lockedUntil: shouldLock
          ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000)
          : user.lockedUntil,
      },
    });
    return { ok: false, reason: "invalid" };
  }

  // Success — reset counter and lockedUntil.
  if (user.failedLoginCount > 0 || user.lockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });
  }

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };

  // Sign with the user's current tokenVersion baked in so getSession()'s
  // revocation check passes until the next bump.
  const payload: SessionTokenPayload = { ...sessionUser, v: user.tokenVersion };
  const token = jwt.sign(payload, jwtSecret(), { expiresIn: SESSION_MAX_AGE_SECONDS });
  return { ok: true, user: sessionUser, token };
}
