import { redirect } from "next/navigation";
import StageShell from "@/components/stage/StageShell";
import { STAGE_THEMES } from "@/components/stage/themes";
import { StageLanding } from "@/components/stage/StageLanding";
import { getStageAccess } from "@/lib/stage-access";
import { stageUrl } from "@/lib/stage-routes";
import { STAGE_BRIEFS } from "@/lib/stage-briefs";

export default async function Stage4LandingPage() {
  const result = await getStageAccess("stage-4");
  if (!result.ok) {
    if (result.reason === "no-session") redirect("/login");
    redirect("/dashboard");
  }
  const { internCode, ndaSignedAt } = result.access;

  if (!ndaSignedAt) {
    redirect(`/dashboard/onboarding?next=${encodeURIComponent(stageUrl("stage-4"))}`);
  }

  const theme = STAGE_THEMES["stage-4"];
  const brief = STAGE_BRIEFS.STAGE_4;

  return (
    <StageShell theme={theme} internCode={internCode}>
      <StageLanding
        brief={brief}
        boardHref={stageUrl("stage-4", "/board")}
        pdfHref="/dashboard/brief/stage-4"
        companyName="Sankofa Digital · The Boardroom"
        welcomeLine="Tomorrow at 09:00 the board sits. Adaeze, Babatunde, Chief Wale. They want three answers: did customer PII leave, are we in breach of NDPA, what does next year of security spend look like. Counsel is at the table with you."
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
