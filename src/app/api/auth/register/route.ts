// Self-service registration is intentionally disabled for this programme.
// Participants are onboarded by admin after application review (see /apply).
//
// This endpoint is locked to SUPER_ADMIN only. Everyone else gets a 404
// (not a 403 — we don't want to leak that the endpoint exists).
import { NextRequest } from "next/server";
import { getSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return new Response(null, { status: 404 });
    }

    const { firstName, lastName, email, password, role } = await request.json();
    if (!firstName || !lastName || !email || !password) {
      return Response.json({ error: "All fields are required" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Invalid email" }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 10) {
      return Response.json(
        { error: "Password must be at least 10 characters" },
        { status: 400 }
      );
    }

    const allowedRoles = ["INTERN", "GRADER", "ADMIN", "SUPER_ADMIN"] as const;
    const safeRole = allowedRoles.includes(role) ? role : "INTERN";

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return Response.json({ error: "Account already exists" }, { status: 409 });
    }

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        password: hashed,
        role: safeRole,
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });

    return Response.json({ user }, { status: 201 });
  } catch (err) {
    logger.error("register_failed", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
