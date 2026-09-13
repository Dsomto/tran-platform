import { cookies } from "next/headers";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth";
import { Stage9LinkRepairSendButton } from "./send-button";

export const dynamic = "force-dynamic";

type Check = { label: string; status: number; contentType: string; valid: boolean };
type Health = { ready?: boolean; recipients?: number; finalists?: number; departures?: number; checks?: Check[]; error?: string };

export default async function Stage9LinkRepairPage() {
  await requireSuperAdmin();
  const cookieHeader = (await cookies()).toString();
  const origin = process.env.PUBLIC_APP_URL || "https://ubuntubridgeinitiatives.org";
  let result: Health;
  try {
    const response = await fetch(`${origin.replace(/\/$/, "")}/api/admin/stage9-link-repair`, {
      cache: "no-store",
      headers: { cookie: cookieHeader },
      signal: AbortSignal.timeout(55_000),
    });
    result = (await response.json()) as Health;
    if (!response.ok && !result.error) result.error = `Health check returned HTTP ${response.status}`;
  } catch {
    result = { error: "The production document check timed out. Reload to try again." };
  }
  const checks = result.checks ?? [];
  const ready = result.ready === true && checks.length === 11 && checks.every((item) => item.valid);
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
      <div className="flex items-start gap-4 border-b border-border pb-7">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-emerald-700 text-white"><ShieldCheck className="h-6 w-6" aria-hidden="true" /></div>
        <div><p className="text-sm font-semibold text-muted">Stage 9 result package</p><h1 className="mt-1 text-2xl font-bold text-foreground">Final production link correction</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">The live application generates and tests these signatures. The correction goes only to 10 finalists and 23 assessed departures; the non-submitter has no document links to repair.</p></div>
      </div>
      {result.error ? <div className="mt-7 border-l-4 border-red-500 bg-red-50 px-5 py-4 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">{result.error}</div> : <>
        <div className={`mt-7 border-l-4 px-5 py-4 ${ready ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100" : "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100"}`}><p className="font-bold">{ready ? "All production document rules passed." : "The correction is not ready."}</p><p className="mt-1 text-sm">{result.recipients ?? 0} recipients checked: {result.finalists ?? 0} finalists and {result.departures ?? 0} assessed departures.</p></div>
        <div className="mt-8 overflow-hidden border border-border"><div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-border bg-muted/30 px-4 py-3 text-xs font-bold uppercase text-muted"><span>Document rule</span><span>Response</span><span>Status</span></div>{checks.map((item) => <div key={item.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-border px-4 py-3 last:border-b-0"><span className="text-sm font-medium text-foreground">{item.label.replaceAll("-", " ")}</span><span className="font-mono text-xs text-muted">HTTP {item.status || "error"}</span><span className={item.valid ? "text-emerald-600" : "text-red-600"} title={item.contentType}>{item.valid ? <CheckCircle2 className="h-5 w-5" aria-label="Passed" /> : <XCircle className="h-5 w-5" aria-label="Failed" />}</span></div>)}</div>
        <Stage9LinkRepairSendButton ready={ready} />
      </>}
    </main>
  );
}
