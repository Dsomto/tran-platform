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

export function createToken(user: SessionUser): string {
  return jwt.sign(user, jwtSecret(), { expiresIn: SESSION_MAX_AGE_SECONDS });
}

export function verifyToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, jwtSecret()) as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session-token")?.value;
  if (!token) return null;
  const user = verifyToken(token);
  if (!user) return null;
  // Sliding window: if the token is mid-life (>30 min old), re-issue a fresh one
  // so the user's session extends as long as they are actively using the site.
  // Idle users still expire at the hour boundary because no refresh happens.
  await refreshSessionIfStale(token, user);
  return user;
}

async function refreshSessionIfStale(token: string, user: SessionUser): Promise<void> {
  try {
    const decoded = jwt.decode(token) as { iat?: number; exp?: number } | null;
    if (!decoded?.iat || !decoded?.exp) return;
    const ageSeconds = Math.floor(Date.now() / 1000) - decoded.iat;
    // Only refresh if more than half the token's life has elapsed.
    if (ageSeconds < SESSION_MAX_AGE_SECONDS / 2) return;
    const fresh = createToken(user);
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
    const app = await prisma.publicApplication.findUnique({
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

  const token = createToken(sessionUser);
  return { ok: true, user: sessionUser, token };
}
