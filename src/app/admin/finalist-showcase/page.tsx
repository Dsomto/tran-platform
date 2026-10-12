import Link from "next/link";
import { ExternalLink, ShieldAlert } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getShowcaseResults, getSuspiciousActivity, launchBlockers } from "@/lib/showcase-admin";
import { EXPECTED_ROLL_SIZE, SHOWCASE_PATH, SHOWCASE_TRACKS, TRACK_LABEL } from "@/lib/showcase-public";
import { getShowcaseSettings, MAX_CODE_ATTEMPTS, votingPhase } from "@/lib/showcase-vote";
import { ShowcaseControls, EntryControls, BallotResetForm, LinkCheckPanel } from "./showcase-controls";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ADMIN ONLY. This page is the only place vote totals are rendered.
export default async function FinalistShowcaseAdminPage() {
  await requireAdmin();
  const [settings, results, suspicious, blockers] = await Promise.all([
    getShowcaseSettings(),
    getShowcaseResults(),
    getSuspiciousActivity(),
    launchBlockers(),
  ]);
  const phase = votingPhase(settings);
  const prepared = results.entries.length > 0;

  return (
    <div className="min-h-full bg-background px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="text-xs font-bold uppercase text-blue">Cohort One</p>
            <h1 className="mt-2 text-3xl font-bold text-foreground">Finalist showcase &amp; private voting</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Vote totals on this page are internal. They are never sent to the public page, its API responses, or its metadata.
            </p>
          </div>
          <Link href={SHOWCASE_PATH} target="_blank" className="inline-flex items-center gap-1.5 border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-hover">
            Preview public page <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        {!prepared && (
          <div className="flex gap-3 border border-amber/40 bg-amber-light/40 p-5 text-sm text-foreground">
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber" />
            <p>The showcase has not been prepared in this database yet: no showcase entries, voter roll or settings record exist. The public page returns 404 until it is.</p>
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Voting state", phase],
            ["Published", settings.published ? "Yes" : "No"],
            ["Eligible roll", `${results.rollSize} / ${EXPECTED_ROLL_SIZE}`],
            ["Verified voters", results.verifiedVoters],
            ["Completed ballots", results.completedBallots],
          ].map(([label, value]) => (
            <div key={String(label)} className="border border-border bg-surface px-4 py-3">
              <p className="text-xs text-muted">{label}</p>
              <p className="text-2xl font-bold text-foreground">{value}</p>
            </div>
          ))}
        </section>
        <p className="-mt-5 text-sm text-muted">Remaining eligible (no ballot yet): {results.remainingEligible}</p>

        <section className="border border-border bg-surface p-5">
          <h2 className="text-lg font-bold text-foreground">Launch readiness</h2>
          {blockers.length === 0 ? (
            <p className="mt-2 text-sm text-emerald">All launch checks pass: roll of {EXPECTED_ROLL_SIZE}, 4 / 3 / 3 published entries, unique indexes enforced.</p>
          ) : (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-danger">
              {blockers.map((b) => <li key={b}>{b}</li>)}
            </ul>
          )}
          <ShowcaseControls
            settings={{
              published: settings.published,
              votingState: settings.votingState,
              opensAt: settings.opensAt?.toISOString() ?? null,
              closesAt: settings.closesAt?.toISOString() ?? null,
            }}
            prepared={prepared}
            blockers={blockers}
          />
        </section>

        <section className="border border-border bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
            <div>
              <h2 className="text-lg font-bold text-foreground">Internal results</h2>
              <p className="text-sm text-muted">
                {results.reconciled ? "Reconciled: entry totals match stored ballots and votes." : `Reconciliation issue: ${results.reconcileNotes.join("; ")}`}
              </p>
            </div>
            <a href="/api/admin/showcase/cohort-one/export" className="border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-hover">
              Export CSV
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="bg-surface-hover text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3">Track</th>
                  <th className="px-4 py-3">Finalist / project</th>
                  <th className="px-4 py-3">Consent</th>
                  <th className="px-4 py-3">Votes</th>
                  <th className="px-4 py-3">% of track</th>
                  <th className="px-4 py-3">Publication</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {results.entries.map((e) => (
                  <tr key={e.id} className="align-top">
                    <td className="px-4 py-4 text-muted">{TRACK_LABEL[e.track]}</td>
                    <td className="max-w-md px-4 py-4">
                      <p className="font-semibold text-foreground">{e.finalistName}</p>
                      <p className="mt-1 text-xs text-muted">{e.projectTitle}</p>
                      {!e.stillFinalist && <p className="mt-1 text-xs font-semibold text-danger">No longer an active Stage 9 finalist</p>}
                    </td>
                    <td className="px-4 py-4 text-muted">{e.consent ? "Given" : <span className="text-danger">Missing</span>}</td>
                    <td className="px-4 py-4 text-lg font-bold text-foreground">{e.votes}</td>
                    <td className="px-4 py-4 text-muted">{e.percentOfTrack.toFixed(1)}%</td>
                    <td className="px-4 py-4">
                      <EntryControls entryId={e.id} published={e.published} linkNote={e.linkNote} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-surface-hover text-xs text-muted">
                <tr>
                  <td className="px-4 py-3" colSpan={6}>
                    Votes by track: {SHOWCASE_TRACKS.map((t) => `${TRACK_LABEL[t]} ${results.votesByTrack[t]}`).join(" · ")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <LinkCheckPanel entries={results.entries.map((e) => ({ id: e.id, label: `${e.finalistName} — ${e.projectTitle}`, linkNote: e.linkNote }))} />

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="border border-border bg-surface p-5">
            <h2 className="text-lg font-bold text-foreground">Suspicious activity</h2>
            <p className="mt-1 text-sm text-muted">Hashed references only. No email addresses or IP addresses are stored or shown.</p>
            <p className="mt-4 text-sm text-foreground">Codes locked after {MAX_CODE_ATTEMPTS} wrong guesses: <strong>{suspicious.lockedCodes}</strong></p>
            <h3 className="mt-4 text-sm font-semibold text-foreground">Codes with 3+ wrong guesses</h3>
            {suspicious.highFailureCodes.length === 0 ? <p className="text-sm text-muted">None.</p> : (
              <ul className="mt-1 space-y-1 text-sm text-muted">
                {suspicious.highFailureCodes.map((c, i) => <li key={i}>voter …{c.voterRef}: {c.failedAttempts} wrong · {c.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC</li>)}
              </ul>
            )}
            <h3 className="mt-4 text-sm font-semibold text-foreground">Busy networks (10+ code requests in 24h, or 5+ ballots)</h3>
            {suspicious.busySignals.length === 0 ? <p className="text-sm text-muted">None.</p> : (
              <ul className="mt-1 space-y-1 text-sm text-muted">
                {suspicious.busySignals.map((s) => <li key={s.signal}>network {s.signal}…: {s.codeRequests} code requests, {s.ballots} ballots</li>)}
              </ul>
            )}
          </div>
          <BallotResetForm />
        </section>
      </div>
    </div>
  );
}
