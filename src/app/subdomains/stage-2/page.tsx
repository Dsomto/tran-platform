import { redirect } from "next/navigation";
import StageShell from "@/components/stage/StageShell";
import { STAGE_THEMES } from "@/components/stage/themes";
import { StageWizard } from "@/components/stage/StageWizard";
import { getStageAccess } from "@/lib/stage-access";
import { stageUrl } from "@/lib/stage-routes";
import { STAGE_BRIEFS } from "@/lib/stage-briefs";

export default async function Stage2LandingPage() {
  const result = await getStageAccess("stage-2");
  if (!result.ok) {
    if (result.reason === "no-session") redirect("/login");
    redirect("/dashboard");
  }
  const { internCode, fullName, ndaSignedAt } = result.access;

  const theme = STAGE_THEMES["stage-2"];
  const brief = STAGE_BRIEFS.STAGE_2;

  return (
    <StageShell theme={theme} internCode={internCode}>
      <StageWizard
        brief={brief}
        boardHref={stageUrl("stage-2", "/board")}
        pdfHref="/api/stage-brief/stage-2/pdf"
        internFullName={fullName}
        ndaSignedAt={ndaSignedAt}
        companyName="Sankofa Digital · Chapter 3"
        welcomeLine="The decrypted files point at /legacy-admin/. Bayo wants the report on his desk before next sprint planning."
        theme={{
          slug: "stage-2",
          panelClass: "stage-2-panel",
          headingClass: "stage-2-heading",
          pillClass: "stage-2-pill",
          accentTextClass: "text-rose-700",
          bodyTextClass: "text-neutral-700",
          mutedTextClass: "text-neutral-500",
          ctaBgClass: "bg-rose-600",
          ctaHoverClass: "hover:bg-rose-700",
          dividerClass: "border-rose-100",
        }}
      />
    </StageShell>
  );
}
