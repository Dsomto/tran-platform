import { redirect } from "next/navigation";
import StageShell from "@/components/stage/StageShell";
import { STAGE_THEMES } from "@/components/stage/themes";
import { StageWizard } from "@/components/stage/StageWizard";
import { getStageAccess } from "@/lib/stage-access";
import { stageUrl } from "@/lib/stage-routes";
import { STAGE_BRIEFS } from "@/lib/stage-briefs";

export default async function Stage3LandingPage() {
  const result = await getStageAccess("stage-3");
  if (!result.ok) {
    if (result.reason === "no-session") redirect("/login");
    redirect("/dashboard");
  }
  const { internCode, fullName, ndaSignedAt } = result.access;

  const theme = STAGE_THEMES["stage-3"];
  const brief = STAGE_BRIEFS.STAGE_3;

  return (
    <StageShell theme={theme} internCode={internCode}>
      <StageWizard
        brief={brief}
        boardHref={stageUrl("stage-3", "/board")}
        pdfHref="/api/stage-brief/stage-3/pdf"
        internFullName={fullName}
        ndaSignedAt={ndaSignedAt}
        companyName="Sankofa Digital · Chapter 4"
        welcomeLine="The Griot is inside. Workstation 10.0.1.87 is in quarantine. Dami flew in this morning to lead the investigation. Legal is downstairs, waiting."
        theme={{
          slug: "stage-3",
          panelClass: "stage-3-panel",
          headingClass: "stage-3-heading",
          pillClass: "stage-3-pill",
          accentTextClass: "text-amber-400",
          bodyTextClass: "text-amber-50/85",
          mutedTextClass: "text-amber-200/55",
          ctaBgClass: "bg-amber-500",
          ctaHoverClass: "hover:bg-amber-600",
          dividerClass: "border-amber-500/20",
        }}
      />
    </StageShell>
  );
}
