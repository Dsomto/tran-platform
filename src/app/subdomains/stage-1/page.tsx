import { redirect } from "next/navigation";
import StageShell from "@/components/stage/StageShell";
import { STAGE_THEMES } from "@/components/stage/themes";
import { StageLanding } from "@/components/stage/StageLanding";
import { getStageAccess } from "@/lib/stage-access";
import { stageUrl } from "@/lib/stage-routes";
import { STAGE_BRIEFS } from "@/lib/stage-briefs";

export default async function Stage1LandingPage() {
  const result = await getStageAccess("stage-1");
  if (!result.ok) {
    if (result.reason === "no-session") redirect("/login");
    redirect("/dashboard");
  }
  const { internCode, ndaSignedAt } = result.access;

  if (!ndaSignedAt) {
    redirect(`/dashboard/onboarding?next=${encodeURIComponent(stageUrl("stage-1"))}`);
  }

  const theme = STAGE_THEMES["stage-1"];
  const brief = STAGE_BRIEFS.STAGE_1;

  return (
    <StageShell theme={theme} internCode={internCode}>
      <StageLanding
        brief={brief}
        boardHref={stageUrl("stage-1", "/board")}
        pdfHref="/api/stage-brief/stage-1/pdf"
        companyName="Sankofa Digital · Chapter 2"
        welcomeLine="The board met overnight. They know the Q2 login was not nothing. Tunde has a zip on his desk — files The Griot left behind, sloppily encrypted in places. You're being asked to peel them back."
        theme={{
          slug: "stage-1",
          panelClass: "stage-1-panel",
          headingClass: "stage-1-heading",
          pillClass: "stage-1-pill",
          accentTextClass: "text-violet-300",
          bodyTextClass: "text-violet-50/85",
          mutedTextClass: "text-violet-200/55",
          ctaBgClass: "bg-violet-500",
          ctaHoverClass: "hover:bg-violet-600",
          dividerClass: "border-violet-400/20",
        }}
      />
    </StageShell>
  );
}
