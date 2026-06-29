import { prisma } from "@/lib/db";
import { isValidCertificateShareSig, certificateUrl, verifyUrl } from "@/lib/certificate-link";
import { certificateIdFor } from "@/lib/certificate-link";
import { buildAddToProfileUrl, stageCertName } from "@/lib/linkedin";
import { LogoMark } from "@/components/logo";
import { VerifyActions } from "./verify-actions";
import { CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

const STAGE_LABEL: Record<string, string> = {
  STAGE_0: "Stage 0 — Foundations",
  STAGE_1: "Stage 1 — Applied Cryptography",
  STAGE_2: "Stage 2 — Web Application Security",
  STAGE_3: "Stage 3 — Incident Response",
  STAGE_4: "Stage 4 — Governance & Risk",
  STAGE_5: "Stage 5 — Track Specialisation",
};

function Invalid({ msg }: { msg: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-border bg-surface p-8 text-center">
        <h1 className="text-xl font-bold text-foreground">Certificate not found</h1>
        <p className="text-sm text-muted mt-2">{msg}</p>
      </div>
    </div>
  );
}

export default async function VerifyPage({
  params,
  searchParams,
}: {
  params: Promise<{ reportId: string }>;
  searchParams: Promise<{ sig?: string }>;
}) {
  const { reportId } = await params;
  const { sig } = await searchParams;

  const report = await prisma.stageReport.findUnique({
    where: { id: reportId },
    include: { intern: { include: { user: true } } },
  });

  if (!report || report.status !== "PASSED") {
    return <Invalid msg="This credential is not valid, or the certificate has not been issued yet." />;
  }
  if (!isValidCertificateShareSig(report.id, report.intern.id, sig ?? null)) {
    return <Invalid msg="This verification link is missing or invalid. Open it from the link issued to the holder." />;
  }

  const fullName =
    `${report.intern.user.firstName} ${report.intern.user.lastName}`.trim() ||
    report.intern.user.email;
  const stageLabel = STAGE_LABEL[report.stage] ?? report.stage;
  const issuedAt = report.finalizedAt ?? report.gradedAt ?? new Date();
  const certId = certificateIdFor(report.id);
  const origin = process.env.PUBLIC_APP_URL || "https://ubuntubridgeinitiatives.org";

  const pdfUrl = certificateUrl({ origin, reportId: report.id, internId: report.intern.id });
  const thisUrl = verifyUrl({ origin, reportId: report.id, internId: report.intern.id });
  const addToLinkedIn = buildAddToProfileUrl({
    stageKey: report.stage,
    issuedAt,
    certId,
    certUrl: thisUrl,
  });

  const issuedStr = issuedAt.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-2.5">
          <LogoMark size={28} />
          <span className="text-lg font-bold tracking-tight">
            <span className="text-blue dark:text-blue-400">Ubuntu Bridge Initiative</span>
          </span>
        </div>
      </header>

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
                successfully completed <span className="font-semibold text-foreground">{stageCertName(report.stage)}</span> of
                the UBI Cybersecurity Internship.
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="text-muted">Programme stage</dt>
                <dd className="font-medium text-foreground mt-0.5">{stageLabel}</dd>
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

            <VerifyActions
              addToLinkedIn={addToLinkedIn}
              pdfUrl={pdfUrl}
              certId={certId}
              verifyUrl={thisUrl}
            />
          </div>
        </div>

        <p className="text-xs text-muted text-center mt-6">
          Anyone with this link can confirm the credential is genuine. The credential ID and this
          page are what you enter as the “Credential ID” and “Credential URL” on LinkedIn.
        </p>
      </main>
    </div>
  );
}
