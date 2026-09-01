import { cookies } from "next/headers";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth";
import { Stage8LinkRepairSendButton } from "./send-button";

export const dynamic = "force-dynamic";

type HealthCheck = {
  label: string;
  status: number;
  contentType: string;
  valid: boolean;
};

type HealthResult = {
  ready?: boolean;
  recipients?: number;
  checks?: HealthCheck[];
  error?: string;
};

function checkLabel(label: string): string {
  return label
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function Stage8LinkRepairPage() {
  await requireSuperAdmin();
  const cookieHeader = (await cookies()).toString();
  const origin = process.env.PUBLIC_APP_URL || "https://ubuntubridgeinitiatives.org";
  let result: HealthResult;

  try {
    const response = await fetch(`${origin.replace(/\/$/, "")}/api/admin/stage8-link-repair`, {
      cache: "no-store",
      headers: { cookie: cookieHeader },
      signal: AbortSignal.timeout(55_000),
    });
    result = (await response.json()) as HealthResult;
    if (!response.ok && !result.error) result.error = `Health check returned HTTP ${response.status}`;
  } catch {
    result = { error: "The live document check timed out. Reload this page to try again." };
  }

  const checks = result.checks ?? [];
  const ready = result.ready === true && checks.length === 10 && checks.every((check) => check.valid);

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
      <div className="flex items-start gap-4 border-b border-border pb-7">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-muted">Stage 8 result package</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">Production link verification</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Read-only validation. This page cannot queue or send email and does not change results,
            progression, cohort membership, or Stage 9.
          </p>
        </div>
      </div>

      {result.error ? (
        <div className="mt-7 border-l-4 border-red-500 bg-red-50 px-5 py-4 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">
          {result.error}
        </div>
      ) : (
        <>
          <div className={`mt-7 border-l-4 px-5 py-4 ${ready ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100" : "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100"}`}>
            <p className="font-bold">
              {ready ? "All production document links passed." : "The production package is not ready yet."}
            </p>
            <p className="mt-1 text-sm">
              {result.recipients ?? 0} affected result messages checked. No email was sent.
            </p>
          </div>

          <div className="mt-8 overflow-hidden border border-border">
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-border bg-muted/30 px-4 py-3 text-xs font-bold uppercase text-muted">
              <span>Document</span>
              <span>Response</span>
              <span>Status</span>
            </div>
            {checks.map((check) => (
              <div key={check.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-border px-4 py-3 last:border-b-0">
                <span className="text-sm font-medium text-foreground">{checkLabel(check.label)}</span>
                <span className="font-mono text-xs text-muted">HTTP {check.status || "error"}</span>
                <span className={check.valid ? "text-emerald-600" : "text-red-600"} title={check.contentType}>
                  {check.valid ? <CheckCircle2 className="h-5 w-5" aria-label="Passed" /> : <XCircle className="h-5 w-5" aria-label="Failed" />}
                </span>
              </div>
            ))}
          </div>
          <Stage8LinkRepairSendButton ready={ready} />
        </>
      )}
    </main>
  );
}
