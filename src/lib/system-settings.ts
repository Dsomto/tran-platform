import { prisma } from "./db";

// The SystemSetting table holds at most one row, keyed by `key = "singleton"`.
// We expose a couple of helpers so callers don't have to remember that.

export interface ApplicationWindow {
  applicationsOpen: boolean;
  applicationsOpensAt: Date | null;
  applicationsClosesAt: Date | null;
  applicationsClosedNote: string | null;
}

export interface ApplicationState extends ApplicationWindow {
  // Resolved state — what callers actually act on.
  isAcceptingApplications: boolean;
  reason: "open" | "not_yet_open" | "manually_closed" | "closed_past_deadline";
  secondsUntilOpen: number | null;
}

const DEFAULTS: ApplicationWindow = {
  applicationsOpen: true,
  applicationsOpensAt: null,
  applicationsClosesAt: null,
  applicationsClosedNote: null,
};

export async function getApplicationState(): Promise<ApplicationState> {
  const row = await prisma.systemSetting.findUnique({ where: { key: "singleton" } });
  const w: ApplicationWindow = row
    ? {
        applicationsOpen: row.applicationsOpen,
        applicationsOpensAt: row.applicationsOpensAt,
        applicationsClosesAt: row.applicationsClosesAt,
        applicationsClosedNote: row.applicationsClosedNote,
      }
    : DEFAULTS;

  const now = Date.now();
  let reason: ApplicationState["reason"] = "open";
  let isOpen = true;
  let secondsUntilOpen: number | null = null;

  if (!w.applicationsOpen) {
    isOpen = false;
    reason = "manually_closed";
  } else if (w.applicationsOpensAt && w.applicationsOpensAt.getTime() > now) {
    isOpen = false;
    reason = "not_yet_open";
    secondsUntilOpen = Math.ceil((w.applicationsOpensAt.getTime() - now) / 1000);
  } else if (w.applicationsClosesAt && w.applicationsClosesAt.getTime() < now) {
    isOpen = false;
    reason = "closed_past_deadline";
  }

  return { ...w, isAcceptingApplications: isOpen, reason, secondsUntilOpen };
}

export async function setApplicationWindow(
  patch: Partial<ApplicationWindow>,
  updatedById?: string
): Promise<ApplicationState> {
  await prisma.systemSetting.upsert({
    where: { key: "singleton" },
    create: {
      key: "singleton",
      applicationsOpen: patch.applicationsOpen ?? DEFAULTS.applicationsOpen,
      applicationsOpensAt: patch.applicationsOpensAt ?? null,
      applicationsClosesAt: patch.applicationsClosesAt ?? null,
      applicationsClosedNote: patch.applicationsClosedNote ?? null,
      updatedById,
    },
    update: {
      ...(patch.applicationsOpen !== undefined && { applicationsOpen: patch.applicationsOpen }),
      ...("applicationsOpensAt" in patch && { applicationsOpensAt: patch.applicationsOpensAt }),
      ...("applicationsClosesAt" in patch && { applicationsClosesAt: patch.applicationsClosesAt }),
      ...("applicationsClosedNote" in patch && { applicationsClosedNote: patch.applicationsClosedNote }),
      updatedById,
    },
  });
  return getApplicationState();
}
