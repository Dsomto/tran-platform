import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Name search for the Decision Emails page: find applicants whose decision can
// still be switched (not yet emailed / onboarded) so an admin can re-route them
// before the email goes out. Returns their current decision status too.
//
// Flippable statuses: pending (undecided), queued_approved (welcome pool),
// rejected, waitlisted. The /review endpoint enforces the real rules (it
// refuses once an email has been sent or the applicant is onboarded).
const FLIPPABLE = ["pending", "queued_approved", "rejected", "waitlisted"];

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return Response.json({ results: [] });
  }

  const results = await prisma.publicApplication.findMany({
    where: {
      status: { in: FLIPPABLE },
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { fullName: "asc" },
    take: 25,
    select: { id: true, fullName: true, email: true, trackInterest: true, status: true },
  });

  return Response.json({ results });
}
