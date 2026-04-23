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

// Shorter-lived tokens (was 7d). Combined with logout clearing the cookie,
// this bounds the blast radius of a leaked token to 24 hours instead of a
// week. Full revocation via tokenVersion is reserved for a future pass — it
// would require a DB hit on every authenticated request.
export function createToken(user: SessionUser): string {
  return jwt.sign(user, jwtSecret(), { expiresIn: "24h" });
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
  return verifyToken(token);
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
