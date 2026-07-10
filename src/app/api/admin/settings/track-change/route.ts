import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { getTrackChangeDeadline, setTrackChangeDeadline } from "@/lib/system-settings";
import { requireApiAdmin } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireApiAdmin();
    if (auth.response) return auth.response;
    const deadline = await getTrackChangeDeadline();
    return Response.json({ trackChangeDeadline: deadline ? deadline.toISOString() : null });
  } catch (error) {
    logger.error("get_track_change_deadline_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Set (or clear, with null) the moment after which interns can no longer
// switch their specialisation track.
export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAdmin();
    if (auth.response) return auth.response;
    const body = await request.json().catch(() => ({}));

    const raw = body?.trackChangeDeadline;
    let deadline: Date | null = null;
    if (raw !== null && raw !== undefined && raw !== "") {
      const d = new Date(String(raw));
      if (Number.isNaN(d.getTime())) {
        return Response.json({ error: "Invalid date." }, { status: 400 });
      }
      deadline = d;
    }

    await setTrackChangeDeadline(deadline, auth.session.id);
    return Response.json({
      trackChangeDeadline: deadline ? deadline.toISOString() : null,
    });
  } catch (error) {
    logger.error("set_track_change_deadline_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
