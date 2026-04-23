import { prisma } from "./db";
import type { Prisma } from "@/generated/prisma";
import type { SessionUser } from "./auth";
import { logger } from "./logger";

export type AuditTargetType =
  | "APPLICATION"
  | "INTERN"
  | "USER"
  | "REPORT"
  | "SCHOLARSHIP"
  | "STAGE_WINDOW"
  | "STAGE_RESULTS"
  | "ANNOUNCEMENT"
  | "EMAIL_QUEUE"
  | "OTHER";

export interface AuditContext {
  actor: SessionUser;
  action: string;                         // dot-notated, e.g. "application.approve"
  targetType: AuditTargetType;
  targetId?: string | null;
  details?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
}

// Fire-and-forget audit write. Failure is logged but does not throw —
// an audit outage must not break the user-facing operation.
export async function recordAudit(ctx: AuditContext): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: ctx.actor.id,
        actorEmail: ctx.actor.email,
        actorRole: ctx.actor.role,
        action: ctx.action,
        targetType: ctx.targetType,
        targetId: ctx.targetId ?? null,
        // Prisma's InputJsonValue is strict; our details are constrained to
        // JSON-safe primitives at every call site, so the cast is safe.
        details: (ctx.details ?? undefined) as Prisma.InputJsonValue | undefined,
        ip: ctx.ip ?? null,
        userAgent: ctx.userAgent ?? null,
      },
    });
  } catch (err) {
    logger.error("audit_write_failed", err, {
      action: ctx.action,
      actorId: ctx.actor.id,
    });
  }
}

// Convenience for route handlers: pull IP + UA off a request.
export function auditMetaFromRequest(req: Request): {
  ip: string | null;
  userAgent: string | null;
} {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;
  const userAgent = req.headers.get("user-agent") || null;
  return { ip, userAgent };
}
