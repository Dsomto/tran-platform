import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FeedbackInvitesPanel } from "./invites-panel";

export const dynamic = "force-dynamic";

export default async function FeedbackInvitesPage() {
  await requireAdmin();

  const origin = process.env.PUBLIC_APP_URL || "https://ubuntubridgeinitiatives.org";
  const invites = await prisma.feedbackInvite.findMany({
    orderBy: [{ respondedAt: "desc" }, { createdAt: "asc" }],
    select: {
      id: true, token: true, email: true, name: true,
      outcome: true, lastStage: true, sentAt: true, respondedAt: true,
    },
  });

  const internCount = await prisma.intern.count();

  const rows = invites.map((i) => ({
    ...i,
    sentAt: i.sentAt ? i.sentAt.toISOString() : null,
    respondedAt: i.respondedAt ? i.respondedAt.toISOString() : null,
    link: `${origin.replace(/\/$/, "")}/feedback/${i.token}`,
  }));

  return (
    <FeedbackInvitesPanel
      rows={rows}
      internCount={internCount}
      origin={origin.replace(/\/$/, "")}
    />
  );
}
