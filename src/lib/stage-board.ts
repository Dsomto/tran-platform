import { prisma } from "@/lib/db";

// Common server-side fetch for every stage's mission-board page. Each board
// page resolves the same shape: the Room with its ordered assignments, the
// intern's submissions for those assignments, a Map for quick lookup, and a
// boolean for "all 10 graded" (used to unlock the debrief).
//
// The render is left to each stage's own page so per-stage visual flavor
// (status word choices, layout flair) is preserved.
export async function getBoardData(internId: string, roomSlug: string) {
  const room = await prisma.room.findUnique({
    where: { slug: roomSlug },
    include: { assignments: { orderBy: { order: "asc" } } },
  });

  if (!room) {
    return { room: null as null, subByAssignment: new Map(), allGraded: false };
  }

  const assignmentIds = room.assignments.map((a) => a.id);
  const submissions = assignmentIds.length
    ? await prisma.submission.findMany({
        where: { internId, assignmentId: { in: assignmentIds } },
      })
    : [];

  const subByAssignment = new Map(submissions.map((s) => [s.assignmentId, s]));

  const allGraded =
    room.assignments.length > 0 &&
    room.assignments.every((a) => {
      const sub = subByAssignment.get(a.id);
      return sub && sub.status === "GRADED";
    });

  return { room, subByAssignment, allGraded };
}
