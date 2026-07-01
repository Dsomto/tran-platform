import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// Records an intern's chosen specialist track (SOC / Ethical Hacking / GRC).
// Backs the track picker on the Stage 4 "Ethics Stance + Binding Track
// Rationale" task. GET returns the current choice; POST registers a new one.
const TRACKS = ["SOC_ANALYSIS", "ETHICAL_HACKING", "GRC"] as const;

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });
  const intern = await prisma.intern.findUnique({
    where: { userId: session.id },
    select: { track: true },
  });
  if (!intern) return Response.json({ error: "No intern record" }, { status: 404 });
  return Response.json({ track: intern.track });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const track = body?.track;
    if (typeof track !== "string" || !TRACKS.includes(track as (typeof TRACKS)[number])) {
      return Response.json({ error: "Pick one of SOC Analysis, Ethical Hacking, or GRC." }, { status: 400 });
    }

    const intern = await prisma.intern.findUnique({
      where: { userId: session.id },
      select: { id: true, track: true },
    });
    if (!intern) return Response.json({ error: "No intern record" }, { status: 404 });

    await prisma.intern.update({
      where: { id: intern.id },
      data: { track: track as never },
    });

    return Response.json({ success: true, track, previous: intern.track });
  } catch (error) {
    logger.error("track_selection_failed", error);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
