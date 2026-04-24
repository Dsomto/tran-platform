import { logger } from "@/lib/logger";
import { getApplicationState } from "@/lib/system-settings";

// Public, unauthenticated read of the application-form state.
// Returns only the fields the /apply page actually needs to render — never the
// internal audit metadata.
export async function GET() {
  try {
    const s = await getApplicationState();
    return Response.json({
      isAcceptingApplications: s.isAcceptingApplications,
      reason: s.reason,
      opensAt: s.applicationsOpensAt?.toISOString() ?? null,
      closesAt: s.applicationsClosesAt?.toISOString() ?? null,
      note: s.applicationsClosedNote,
      secondsUntilOpen: s.secondsUntilOpen,
    });
  } catch (error) {
    logger.error("public_application_state_failed", error);
    // If something goes wrong, fail open — better to let someone apply than
    // to silently block the funnel.
    return Response.json({
      isAcceptingApplications: true,
      reason: "open",
      opensAt: null,
      closesAt: null,
      note: null,
      secondsUntilOpen: null,
    });
  }
}
