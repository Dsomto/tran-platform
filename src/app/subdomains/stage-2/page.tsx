import { redirect } from "next/navigation";
import StageShell from "@/components/stage/StageShell";
import { STAGE_THEMES } from "@/components/stage/themes";
import { StageLanding } from "@/components/stage/StageLanding";
import { getStageAccess } from "@/lib/stage-access";
import { stageUrl } from "@/lib/stage-routes";
import { STAGE_BRIEFS } from "@/lib/stage-briefs";
import { EVIDENCE_PACK } from "@/lib/evidence-pack";
import { STAGE_STORIES } from "@/lib/stage-story";
import { STAGE_LANDING_THEMES } from "@/lib/stage-landing-theme";

export default async function Stage2LandingPage() {
  const result = await getStageAccess("stage-2");
  if (!result.ok) {
    if (result.reason === "no-session") redirect("/login");
    redirect("/dashboard");
  }
  const { internCode, firstName, ndaSignedAt } = result.access;

  if (!ndaSignedAt) {
    redirect(`/dashboard/onboarding?next=${encodeURIComponent(stageUrl("stage-2"))}`);
  }

  return (
    <StageShell theme={STAGE_THEMES["stage-2"]} internCode={internCode}>
      <StageLanding
        brief={STAGE_BRIEFS.STAGE_2}
        story={STAGE_STORIES["stage-2"]}
        theme={STAGE_LANDING_THEMES["stage-2"]}
        boardHref={stageUrl("stage-2", "/board")}
        submitHref="/dashboard/reports/STAGE_2"
        companyName="Sankofa Digital"
        firstName={firstName}
        internCode={internCode}
        evidencePack={EVIDENCE_PACK.STAGE_2}
      />
    </StageShell>
  );
}
