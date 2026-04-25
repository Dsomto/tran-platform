import { redirect } from "next/navigation";
import StageShell from "@/components/stage/StageShell";
import { STAGE_THEMES } from "@/components/stage/themes";
import { StageWizard } from "@/components/stage/StageWizard";
import { getStageAccess } from "@/lib/stage-access";
import { stageUrl } from "@/lib/stage-routes";
import { STAGE_BRIEFS } from "@/lib/stage-briefs";

export default async function Stage4LandingPage() {
  const result = await getStageAccess("stage-4");
  if (!result.ok) {
    if (result.reason === "no-session") redirect("/login");
    redirect("/dashboard");
  }
  const { internCode, fullName, ndaSignedAt } = result.access;

  const theme = STAGE_THEMES["stage-4"];
  const brief = STAGE_BRIEFS.STAGE_4;

  return (
    <StageShell theme={theme} internCode={internCode}>
      <StageWizard
        brief={brief}
        boardHref={stageUrl("stage-4", "/board")}
        pdfHref="/api/stage-brief/stage-4/pdf"
        internFullName={fullName}
        ndaSignedAt={ndaSignedAt}
        companyName="Sankofa Digital · The Boardroom"
        welcomeLine="Tomorrow at 09:00 the board sits. The chair, the CFO, an independent director who used to chair a bank. They want three answers."
        theme={{
          slug: "stage-4",
          panelClass: "stage-4-panel",
          headingClass: "stage-4-heading",
          pillClass: "stage-4-pill",
          accentTextClass: "text-cyan-300",
          bodyTextClass: "text-cyan-50/85",
          mutedTextClass: "text-cyan-200/55",
          ctaBgClass: "bg-cyan-500",
          ctaHoverClass: "hover:bg-cyan-600",
          dividerClass: "border-cyan-400/20",
        }}
      />
    </StageShell>
  );
}
