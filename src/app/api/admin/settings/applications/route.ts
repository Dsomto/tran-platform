import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { getApplicationState, setApplicationWindow } from "@/lib/system-settings";

export async function GET() {
  try {
    await requireAdmin();
    const state = await getApplicationState();
    return Response.json({ state });
  } catch (error) {
    logger.error("get_application_state_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json().catch(() => ({}));

    const patch: Parameters<typeof setApplicationWindow>[0] = {};

    if (typeof body.applicationsOpen === "boolean") {
      patch.applicationsOpen = body.applicationsOpen;
    }
    if ("applicationsOpensAt" in body) {
      const v = body.applicationsOpensAt;
      if (v === null || v === "") {
        patch.applicationsOpensAt = null;
      } else {
        const d = new Date(v);
        if (isNaN(d.getTime())) return Response.json({ error: "Invalid applicationsOpensAt" }, { status: 400 });
        patch.applicationsOpensAt = d;
      }
    }
    if ("applicationsClosesAt" in body) {
      const v = body.applicationsClosesAt;
      if (v === null || v === "") {
        patch.applicationsClosesAt = null;
      } else {
        const d = new Date(v);
        if (isNaN(d.getTime())) return Response.json({ error: "Invalid applicationsClosesAt" }, { status: 400 });
        patch.applicationsClosesAt = d;
      }
    }
    if ("applicationsClosedNote" in body) {
      patch.applicationsClosedNote =
        typeof body.applicationsClosedNote === "string" && body.applicationsClosedNote.trim()
          ? body.applicationsClosedNote.trim().slice(0, 500)
          : null;
    }

    const state = await setApplicationWindow(patch, session.id);
    return Response.json({ state });
  } catch (error) {
    logger.error("set_application_state_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
