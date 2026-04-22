"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

interface Application {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  internCode: string | null;
  currentStage: string | null;
  dataSituation: string;
  reason: string;
  referralSource: string | null;
  status: string;
  reviewNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

interface Props {
  applications: Application[];
}

export function ScholarshipReview({ applications }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<"PENDING" | "APPROVED" | "REJECTED" | "ALL">("PENDING");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const visible = filter === "ALL" ? applications : applications.filter((a) => a.status === filter);
  const counts = {
    pending: applications.filter((a) => a.status === "PENDING").length,
    approved: applications.filter((a) => a.status === "APPROVED").length,
    rejected: applications.filter((a) => a.status === "REJECTED").length,
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Heart className="h-6 w-6 text-blue" />
          <h1 className="text-2xl font-bold text-foreground">Data Scholarship Applications</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Review applications for weekly mobile data credits. Approved participants
          are notified by email and should be added to your top-up roster.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-lg border ${
              filter === f
                ? "bg-blue text-white border-blue"
                : "bg-white border-border text-foreground hover:bg-muted/50"
            }`}
          >
            {f === "PENDING" && <Clock className="h-3.5 w-3.5 inline mr-1" />}
            {f === "APPROVED" && <CheckCircle2 className="h-3.5 w-3.5 inline mr-1" />}
            {f === "REJECTED" && <XCircle className="h-3.5 w-3.5 inline mr-1" />}
            {f}
            {f === "PENDING" && ` (${counts.pending})`}
            {f === "APPROVED" && ` (${counts.approved})`}
            {f === "REJECTED" && ` (${counts.rejected})`}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="p-8 bg-white border border-border rounded-xl text-center text-muted-foreground">
          No applications in this view.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((a) => (
            <ApplicationCard
              key={a.id}
              application={a}
              expanded={expandedId === a.id}
              onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
              onReviewed={() => router.refresh()}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationCard({
  application,
  expanded,
  onToggle,
  onReviewed,
}: {
  application: Application;
  expanded: boolean;
  onToggle: () => void;
  onReviewed: () => void;
}) {
  const [notes, setNotes] = useState(application.reviewNotes ?? "");
  const [saving, setSaving] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function review(status: "APPROVED" | "REJECTED") {
    setSaving(status);
    setError(null);
    try {
      const res = await fetch(`/api/scholarship/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNotes: notes || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
      } else {
        onReviewed();
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(null);
    }
  }

  const statusBadge = {
    PENDING: "bg-amber-50 text-amber-800 border-amber-200",
    APPROVED: "bg-emerald-50 text-emerald-800 border-emerald-200",
    REJECTED: "bg-rose-50 text-rose-800 border-rose-200",
  }[application.status] ?? "bg-muted text-muted-foreground border-border";

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 text-left hover:bg-muted/30 flex items-start justify-between gap-4"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <strong className="text-foreground">{application.fullName}</strong>
            <span className={`text-xs px-2 py-0.5 rounded border ${statusBadge}`}>
              {application.status}
            </span>
            {application.internCode && (
              <span className="text-xs text-muted-foreground">· {application.internCode}</span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {application.email} · {application.phone} · {application.country}
            {application.currentStage && ` · ${application.currentStage}`}
          </div>
        </div>
        <div className="text-xs text-muted-foreground shrink-0">
          {new Date(application.createdAt).toLocaleDateString()}
        </div>
      </button>

      {expanded && (
        <div className="p-4 border-t border-border space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">
              Current data situation
            </h3>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">
              {application.dataSituation}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">
              Why they need the scholarship
            </h3>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{application.reason}</p>
          </div>
          {application.referralSource && (
            <div>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                Referral source
              </h3>
              <p className="text-sm text-foreground/80">{application.referralSource}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Review notes (optional — included in the email to the applicant)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full p-2 border border-border rounded-lg text-sm"
              placeholder="Any note you want the applicant to see…"
            />
          </div>

          {error && (
            <div className="p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => review("APPROVED")}
              disabled={saving !== null}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving === "APPROVED" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Approve
            </button>
            <button
              onClick={() => review("REJECTED")}
              disabled={saving !== null}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-rose-600 text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving === "REJECTED" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
