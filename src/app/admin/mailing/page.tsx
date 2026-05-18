"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Send,
  Mail,
  Eye,
  Loader2,
  CheckCircle2,
  XCircle,
  X,
  FileText,
  ArrowLeftRight,
} from "lucide-react";

interface Applicant {
  id: string;
  fullName: string;
  email: string;
  trackInterest: string;
  createdAt: string;
}

interface ApplicationDetail {
  id: string;
  fullName: string;
  email: string;
  country: string;
  ageRange: string;
  gender: string | null;
  currentStatus: string;
  experience: string;
  trackInterest: string;
  dedication: string;
  goals: string;
  whyPickYou: string | null;
  referralSource: string | null;
  status: string;
  createdAt: string;
}

type Tab = "welcome" | "rejection";

// Decision Emails — the dedicated home for the welcome / decline emails.
// Approving or rejecting an applicant only records the decision; the email is
// queued from here. Queued emails are delivered in the background by the
// email-drain cron, and tracked on the Email Queue page.
export default function DecisionEmailsPage() {
  const [tab, setTab] = useState<Tab>("welcome");
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyAll, setBusyAll] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [appPreview, setAppPreview] = useState<ApplicationDetail | null>(null);
  const [appPreviewLoading, setAppPreviewLoading] = useState<string | null>(null);
  const [flippingId, setFlippingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/applicants/send-pending?list=${tab}`);
      const data = await res.json();
      setApplicants(data.applicants ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setToast("Couldn't load the list.");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const label = tab === "welcome" ? "welcome" : "decline";
  const decisionWord = tab === "welcome" ? "approved" : "rejected";

  async function send(applicationId?: string) {
    const isAll = !applicationId;
    if (isAll) {
      if (total === 0) return;
      if (
        !confirm(
          `Queue ${total} ${label} email${total === 1 ? "" : "s"} for delivery? ` +
            "They send automatically in the background — no need to keep this tab open."
        )
      ) {
        return;
      }
      setBusyAll(true);
    } else {
      setSendingId(applicationId);
    }
    setToast(null);
    try {
      const res = await fetch("/api/admin/applicants/send-pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: tab, ...(applicationId ? { applicationId } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast(`Couldn't queue: ${data.error || "unknown error"}`);
      } else {
        const skipped = data.skipped
          ? ` ${data.skipped} skipped — onboarding incomplete, re-approve them.`
          : "";
        setToast(
          `${data.queued} ${label} email${data.queued === 1 ? "" : "s"} queued for delivery. ` +
            `Track delivery on the Email Queue page.${skipped}`
        );
        await load();
      }
    } catch {
      setToast("Network error while queueing.");
    } finally {
      setBusyAll(false);
      setSendingId(null);
    }
  }

  async function openPreview() {
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/admin/applicants/send-pending?preview=${tab}`);
      const data = await res.json();
      setPreview({ subject: data.subject, html: data.html });
    } catch {
      setToast("Couldn't load the email preview.");
    } finally {
      setPreviewLoading(false);
    }
  }

  // Open the full application of one applicant.
  async function openApplicantPreview(id: string) {
    setAppPreviewLoading(id);
    setToast(null);
    try {
      const res = await fetch(`/api/public-applications/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setToast(data.error || "Couldn't load the application.");
      } else {
        setAppPreview(data.application);
      }
    } catch {
      setToast("Couldn't load the application.");
    } finally {
      setAppPreviewLoading(null);
    }
  }

  // Flip a not-yet-emailed decision: the welcome tab holds approved
  // applicants (flip → rejected); the rejection tab holds rejected ones
  // (flip → approved). No email has gone out, so this just moves the
  // pending decision between the two tabs.
  async function flipDecision(a: Applicant) {
    const action = tab === "welcome" ? "rejected" : "approved";
    const toWord = action === "rejected" ? "Rejected" : "Approved";
    if (
      !confirm(
        `Move ${a.fullName} to ${toWord}? They have not been emailed yet — ` +
          "this only changes the pending decision."
      )
    ) {
      return;
    }
    setFlippingId(a.id);
    setToast(null);
    try {
      const res = await fetch(`/api/public-applications/${a.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast(data.error || "Couldn't change the decision.");
      } else {
        setToast(`${a.fullName} moved to ${toWord}.`);
        await load();
      }
    } catch {
      setToast("Network error while changing the decision.");
    } finally {
      setFlippingId(null);
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Send className="h-6 w-6 text-blue" />
          <h1 className="text-2xl font-bold text-foreground">Decision Emails</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Approving or rejecting an applicant only records the decision — no email goes out then.
          Queue the welcome and decline emails here when you&apos;re ready. Queued emails send
          automatically in the background; track delivery on the Email Queue page.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <TabButton
          active={tab === "welcome"}
          onClick={() => setTab("welcome")}
          icon={CheckCircle2}
          label="Welcome — Approved"
        />
        <TabButton
          active={tab === "rejection"}
          onClick={() => setTab("rejection")}
          icon={XCircle}
          label="Decline — Rejected"
        />
      </div>

      {toast && (
        <div className="mb-4 p-3 bg-blue/10 border border-blue/30 rounded-lg text-sm text-foreground">
          {toast}
        </div>
      )}

      {/* Summary + bulk actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-4 bg-white border border-border rounded-xl">
        <div className="text-sm text-foreground">
          <span className="text-2xl font-bold">{total}</span>{" "}
          {decisionWord} applicant{total === 1 ? "" : "s"} {total === 1 ? "hasn't" : "haven't"} been
          emailed yet.
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openPreview}
            disabled={previewLoading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted/50 disabled:opacity-40"
          >
            {previewLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            Preview email
          </button>
          <button
            onClick={() => send()}
            disabled={busyAll || total === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue text-white hover:opacity-90 disabled:opacity-40"
          >
            {busyAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Queue all {total} {label} email{total === 1 ? "" : "s"}
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="p-8 bg-white border border-border rounded-xl text-center text-muted-foreground">
          Loading…
        </div>
      ) : applicants.length === 0 ? (
        <div className="p-8 bg-white border border-border rounded-xl text-center text-muted-foreground">
          Everyone {decisionWord} has been emailed. Nothing pending.
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wide">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Track</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {applicants.map((a) => (
                <tr key={a.id} className="hover:bg-muted/20">
                  <td className="p-3 font-medium text-foreground">{a.fullName}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{a.email}</td>
                  <td className="p-3 text-xs text-muted-foreground">{a.trackInterest}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openApplicantPreview(a.id)}
                        disabled={appPreviewLoading === a.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted/50 disabled:opacity-40"
                      >
                        {appPreviewLoading === a.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <FileText className="h-3.5 w-3.5" />
                        )}
                        Preview
                      </button>
                      <button
                        onClick={() => flipDecision(a)}
                        disabled={flippingId === a.id || busyAll}
                        title={tab === "welcome" ? "Move to Rejected" : "Move to Approved"}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted/50 disabled:opacity-40"
                      >
                        {flippingId === a.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ArrowLeftRight className="h-3.5 w-3.5" />
                        )}
                        {tab === "welcome" ? "Reject" : "Approve"}
                      </button>
                      <button
                        onClick={() => send(a.id)}
                        disabled={sendingId === a.id || busyAll}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted/50 disabled:opacity-40"
                      >
                        {sendingId === a.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        Send
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {total > applicants.length && (
            <div className="p-3 text-xs text-muted-foreground text-center border-t border-border">
              Showing the first {applicants.length} of {total}. &ldquo;Queue all&rdquo; covers every
              one of them.
            </div>
          )}
        </div>
      )}

      {/* Email preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Subject</p>
                <p className="text-sm font-semibold text-foreground truncate">{preview.subject}</p>
              </div>
              <button
                onClick={() => setPreview(null)}
                className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Rendered inline rather than in an <iframe>: the site CSP sets
                frame-src 'none', which blocks srcdoc iframes. The email HTML
                is our own template (no scripts), so this is safe. */}
            <div className="flex-1 overflow-y-auto bg-white">
              <div dangerouslySetInnerHTML={{ __html: preview.html }} />
            </div>
            <div className="p-3 text-xs text-muted-foreground border-t border-border">
              Sample data shown. Each applicant receives this with their own name
              {tab === "welcome" ? ", intern ID and login password" : ""}.
            </div>
          </div>
        </div>
      )}

      {/* Application preview modal */}
      {appPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4"
          onClick={() => setAppPreview(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {appPreview.fullName}
                </p>
                <p className="text-xs font-mono text-muted-foreground truncate">
                  {appPreview.email}
                </p>
              </div>
              <button
                onClick={() => setAppPreview(null)}
                className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Field label="Track interest" value={appPreview.trackInterest} />
                <Field label="Country" value={appPreview.country} />
                <Field label="Age range" value={appPreview.ageRange} />
                <Field label="Gender" value={appPreview.gender || "—"} />
                <Field label="Current status" value={appPreview.currentStatus} />
                <Field label="Dedication" value={appPreview.dedication} />
                <Field label="Referral source" value={appPreview.referralSource || "—"} />
                <Field label="Decision status" value={appPreview.status} />
              </div>
              <LongField label="Experience" value={appPreview.experience} />
              <LongField label="Goals" value={appPreview.goals} />
              <LongField label="Why pick you" value={appPreview.whyPickYou || "—"} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm text-foreground mt-0.5 break-words">{value}</p>
    </div>
  );
}

function LongField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap bg-muted/20 border border-border rounded-lg p-3">
        {value}
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
        active
          ? "bg-blue/10 border-blue/40 text-foreground"
          : "bg-white border-border text-muted-foreground hover:bg-muted/30"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
