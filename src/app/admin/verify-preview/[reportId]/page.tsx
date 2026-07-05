import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { certificateIdFor } from "@/lib/certificate-link";
import { CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

// Super-admin preview of what the public /verify page shows AFTER finalize —
// the verified-credential card plus the actual certificate embedded. Bypasses
// the PASSED + signature gates (super-admin only) so the programme office can
// see the recruiter-facing view before running finalize.
export default async function VerifyPreview({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  await requireSuperAdmin();
  const { reportId } = await params;

  const report = await prisma.stageReport.findUnique({
    where: { id: reportId },
    include: { intern: { include: { user: true } } },
  });
  if (!report) {
    return <div className="min-h-screen flex items-center justify-center p-10 text-foreground">Report not found.</div>;
  }

  const fullName =
    `${report.intern.user.firstName ?? ""} ${report.intern.user.lastName ?? ""}`.trim() ||
    report.intern.user.email;
  const issuedAt = report.finalizedAt ?? report.gradedAt ?? new Date();
  const certId = certificateIdFor(report.id);
  const issuedStr = issuedAt.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
  const certEmbed = `/api/admin/cyber-core-preview/${report.id}/certificate`;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-sm px-6 py-2 text-center">
        Super-admin preview — this is exactly what a recruiter sees on the verify page after finalize.
      </div>
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border-b border-emerald-200 dark:border-emerald-500/20 px-6 py-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              Verified credential — issued by Ubuntu Bridge Initiative
            </span>
          </div>
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">This certifies that</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{fullName}</h1>
              <p className="text-muted mt-2">
                was conferred the standing of{" "}
                <span className="font-semibold text-foreground">Certified Cyber Core Associate</span> on
                completing the Ubuntu Bridge Cybersecurity Internship.
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="text-muted">Credential</dt>
                <dd className="font-medium text-foreground mt-0.5">Certified Cyber Core Associate</dd>
              </div>
              <div>
                <dt className="text-muted">Issued</dt>
                <dd className="font-medium text-foreground mt-0.5">{issuedStr}</dd>
              </div>
              <div>
                <dt className="text-muted">Credential ID</dt>
                <dd className="font-mono text-foreground mt-0.5">{certId}</dd>
              </div>
              <div>
                <dt className="text-muted">Issuing organization</dt>
                <dd className="font-medium text-foreground mt-0.5">Ubuntu Bridge Initiative</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="px-6 py-3 border-b border-border text-sm font-semibold text-foreground">Certificate</div>
          <iframe src={certEmbed} title="Certificate" className="w-full bg-white" style={{ height: 560, border: 0 }} />
        </div>
      </main>
    </div>
  );
}
