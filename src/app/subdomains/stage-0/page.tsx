import { redirect } from "next/navigation";
import StageShell from "@/components/stage/StageShell";
import { STAGE_THEMES } from "@/components/stage/themes";
import { StageLanding } from "@/components/stage/StageLanding";
import { getStageAccess } from "@/lib/stage-access";
import { stageUrl } from "@/lib/stage-routes";
import { STAGE_BRIEFS } from "@/lib/stage-briefs";

export default async function Stage0LandingPage() {
  const result = await getStageAccess("stage-0");
  if (!result.ok) {
    if (result.reason === "no-session") redirect("/login");
    redirect("/dashboard");
  }
  const { internCode, ndaSignedAt } = result.access;

  // One-time onboarding gate. Once signed, the intern lands here directly.
  if (!ndaSignedAt) {
    redirect(`/dashboard/onboarding?next=${encodeURIComponent(stageUrl("stage-0"))}`);
  }

  const theme = STAGE_THEMES["stage-0"];
  const brief = STAGE_BRIEFS.STAGE_0;

  return (
    <StageShell theme={theme} internCode={internCode}>
      <StageLanding
        brief={brief}
        boardHref={stageUrl("stage-0", "/board")}
        companyName="Sankofa Digital"
        welcomeLine="You arrived at the Sankofa office at 8:47am. Reception is expecting you. Amaka has cleared the morning to walk you through the Q2 incident — and she does not want her time wasted."
        theme={{
          slug: "stage-0",
          panelClass: "stage-0-panel",
          headingClass: "stage-0-heading",
          pillClass: "stage-0-pill",
          accentTextClass: "text-emerald-700",
          bodyTextClass: "text-neutral-700",
          mutedTextClass: "text-neutral-500",
          ctaBgClass: "bg-emerald-600",
          ctaHoverClass: "hover:bg-emerald-700",
          dividerClass: "border-neutral-200",
        }}
      />
    </StageShell>
  );
}
