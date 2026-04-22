import { prisma } from "./db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-change-me";

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

export function createToken(user: SessionUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser;
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

export async function login(
  identifier: string,
  password: string
): Promise<{ user: SessionUser; token: string } | null> {
  // Accept either an email OR an intern ID (e.g. UBI-2026-0001).
  const normalized = identifier.trim();
  const isInternId = /^UBI-\d{4}-\d+$/i.test(normalized);

  let user = null;
  if (isInternId) {
    const app = await prisma.publicApplication.findUnique({
      where: { internId: normalized.toUpperCase() },
    });
    if (app) {
      user = await prisma.user.findUnique({ where: { email: app.email.toLowerCase() } });
    }
  } else {
    user = await prisma.user.findUnique({ where: { email: normalized.toLowerCase() } });
  }
  if (!user) return null;

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) return null;

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };

  const token = createToken(sessionUser);
  return { user: sessionUser, token };
}
