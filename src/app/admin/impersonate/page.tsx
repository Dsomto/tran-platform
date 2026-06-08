import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ImpersonatePicker } from "./impersonate-picker";

export const dynamic = "force-dynamic";

export default async function ImpersonatePage() {
  await requireSuperAdmin();

  const interns = await prisma.intern.findMany({
    where: { isActive: true },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: [{ currentStage: "asc" }, { user: { firstName: "asc" } }],
    take: 1000,
  });

  return (
    <ImpersonatePicker
      interns={interns.map((i) => ({
        id: i.id,
        name: `${i.user.firstName} ${i.user.lastName}`.trim(),
        email: i.user.email,
        stage: i.currentStage,
        track: i.track,
      }))}
    />
  );
}
