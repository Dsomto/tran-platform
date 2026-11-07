"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  ExternalLink,
  Loader2,
  Search,
  UserRoundCheck,
  UsersRound,
  XCircle,
} from "lucide-react";
import { getVolunteerDepartment, volunteerDepartments } from "@/lib/volunteer-departments";

type VolunteerApplication = {
  id: string;
  cohort: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string | null;
  timeZone: string;
  currentRole: string;
  organisation: string | null;
  ubiRelationship: string;
  primaryDepartment: string;
  secondaryDepartment: string | null;
  weeklyAvailability: string;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  experienceSummary: string;
  motivation: string;
  contributionPlan: string;
  relevantExample: string;
  referralSource: string | null;
  conflictDisclosure: string | null;
  status: string;
  reviewNotes: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

const statuses = ["PENDING", "SHORTLISTED", "INTERVIEWING", "ACCEPTED", "DECLINED"] as const;

export function VolunteerReview({ applications }: { applications: VolunteerApplication[] }) {
  const [status, setStatus] = useState("ALL");
  const [department, setDepartment] = useState("ALL");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return applications.filter((application) => {
      if (status !== "ALL" && application.status !== status) return false;
      if (department !== "ALL" && application.primaryDepartment !== department) return false;
      if (!normalizedQuery) return true;
      return [application.fullName, application.email, application.country, application.currentRole]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [applications, department, query, status]);

  const counts = Object.fromEntries(
    ["PENDING", "SHORTLISTED", "INTERVIEWING", "ACCEPTED", "DECLINED"].map((item) => [
      item,
      applications.filter((application) => application.status === item).length,
    ])
  );

  function exportCsv() {
    const columns = [
      "fullName", "email", "phone", "country", "timeZone", "currentRole",
      "primaryDepartment", "secondaryDepartment", "weeklyAvailability", "status", "createdAt",
    ] as const;
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [
      columns.join(","),
      ...filtered.map((application) => columns.map((column) => escape(application[column])).join(",")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ubi-cohort-2-volunteers-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto w-full">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <UsersRound className="h-6 w-6 text-blue" />
            <h1 className="text-2xl font-bold text-foreground">Cohort 2 Volunteers</h1>
          </div>
          <p className="text-sm text-muted max-w-2xl">
            Review evidence, shortlist by department, record interview decisions, and export the current view.
          </p>
        </div>
        <button onClick={exportCsv} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-hover">
          <Download className="h-4 w-4" /> Export view
        </button>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {statuses.map((item) => (
          <button
            key={item}
            onClick={() => setStatus(status === item ? "ALL" : item)}
            className={`rounded-lg border p-3 text-left transition ${status === item ? "border-blue bg-blue/5" : "border-border bg-surface hover:bg-surface-hover"}`}
          >
            <span className="block text-xl font-bold text-foreground">{counts[item] ?? 0}</span>
            <span className="mt-0.5 block text-[11px] font-semibold text-muted">{item}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_240px] mb-6">
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, country, or role" className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-foreground outline-none focus:border-blue" />
        </label>
        <select value={department} onChange={(event) => setDepartment(event.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-blue">
          <option value="ALL">All departments</option>
          {volunteerDepartments.map((item) => <option key={item.id} value={item.id}>{item.shortName}</option>)}
        </select>
      </div>

      <div className="mb-3 flex items-center justify-between text-xs text-muted">
        <span>{filtered.length} of {applications.length} applications</span>
        {(status !== "ALL" || department !== "ALL" || query) && (
          <button onClick={() => { setStatus("ALL"); setDepartment("ALL"); setQuery(""); }} className="font-semibold text-blue">Clear filters</button>
        )}
      </div>

      {filtered.length ? (
        <div className="space-y-3">
          {filtered.map((application) => <VolunteerCard key={application.id} application={application} />)}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface p-10 text-center text-sm text-muted">No volunteer applications match this view.</div>
      )}
    </div>
  );
}

function VolunteerCard({ application }: { application: VolunteerApplication }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(application.reviewNotes ?? "");
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const primary = getVolunteerDepartment(application.primaryDepartment);
  const secondary = getVolunteerDepartment(application.secondaryDepartment);

  async function review(nextStatus: string) {
    setSaving(nextStatus);
    setError(null);
    try {
      const response = await fetch(`/api/admin/volunteers/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, reviewNotes: notes }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Review could not be saved.");
      router.refresh();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Review could not be saved.");
    } finally {
      setSaving(null);
    }
  }

  const badge = {
    PENDING: "bg-amber-light text-amber-dark border-amber/25",
    SHORTLISTED: "bg-blue-light text-blue-dark border-blue/25",
    INTERVIEWING: "bg-violet-light text-violet border-violet/25",
    ACCEPTED: "bg-emerald-light text-emerald-dark border-emerald/25",
    DECLINED: "bg-rose-light text-rose border-rose/25",
  }[application.status] ?? "bg-surface-hover text-muted border-border";

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-surface">
      <button onClick={() => setExpanded(!expanded)} className="flex w-full items-start justify-between gap-5 p-4 text-left hover:bg-surface-hover">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-foreground">{application.fullName}</h2>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${badge}`}>{application.status}</span>
          </div>
          <p className="mt-1 text-xs text-muted">{application.currentRole} · {application.country} · {application.weeklyAvailability.replaceAll("_", " ")}</p>
          <p className="mt-2 text-xs font-semibold text-blue">{primary?.name ?? application.primaryDepartment}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:block text-xs text-muted">{new Date(application.createdAt).toLocaleDateString()}</span>
          <ChevronDown className={`h-4 w-4 text-muted transition ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border p-4 md:p-6 space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <Detail label="Contact" value={`${application.email}\n${application.phone}`} />
            <Detail label="Location" value={`${application.city ? `${application.city}, ` : ""}${application.country}\n${application.timeZone}`} />
            <Detail label="UBI relationship" value={application.ubiRelationship.replaceAll("_", " ")} />
            <Detail label="Secondary team" value={secondary?.name ?? "None"} />
          </div>

          {(application.linkedinUrl || application.portfolioUrl) && (
            <div className="flex flex-wrap gap-2">
              {application.linkedinUrl && <ExternalLinkButton href={application.linkedinUrl}>LinkedIn</ExternalLinkButton>}
              {application.portfolioUrl && <ExternalLinkButton href={application.portfolioUrl}>Portfolio or work sample</ExternalLinkButton>}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <Detail label="Relevant experience" value={application.experienceSummary} />
            <Detail label="Why Cohort 2" value={application.motivation} />
            <Detail label="First four weeks" value={application.contributionPlan} />
            <Detail label="Evidence of reliable work" value={application.relevantExample} />
          </div>

          {(application.conflictDisclosure || application.referralSource) && (
            <div className="grid md:grid-cols-2 gap-6">
              {application.conflictDisclosure && <Detail label="Conflict or access needs" value={application.conflictDisclosure} />}
              {application.referralSource && <Detail label="Referral source" value={application.referralSource} />}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Internal review notes</label>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-blue" placeholder="Fit, concerns, interview notes, or placement conditions" />
          </div>

          {error && <p className="rounded-lg border border-danger/25 bg-danger/5 p-3 text-sm text-danger">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <ReviewButton label="Shortlist" icon={UserRoundCheck} value="SHORTLISTED" saving={saving} onClick={review} tone="blue" />
            <ReviewButton label="Interviewing" icon={Clock3} value="INTERVIEWING" saving={saving} onClick={review} tone="violet" />
            <ReviewButton label="Accept" icon={CheckCircle2} value="ACCEPTED" saving={saving} onClick={review} tone="emerald" />
            <ReviewButton label="Decline" icon={XCircle} value="DECLINED" saving={saving} onClick={review} tone="rose" />
          </div>

          {application.reviewedAt && (
            <p className="text-[11px] text-muted">Last reviewed {new Date(application.reviewedAt).toLocaleString()} by {application.reviewedBy ?? "an administrator"}.</p>
          )}
        </div>
      )}
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</h3>
      <p className="whitespace-pre-wrap text-sm leading-6 text-foreground-muted">{value}</p>
    </div>
  );
}

function ExternalLinkButton({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface-hover">{children}<ExternalLink className="h-3.5 w-3.5" /></a>;
}

function ReviewButton({ label, icon: Icon, value, saving, onClick, tone }: {
  label: string;
  icon: typeof CheckCircle2;
  value: string;
  saving: string | null;
  onClick: (status: string) => void;
  tone: "blue" | "violet" | "emerald" | "rose";
}) {
  const tones = {
    blue: "bg-blue text-white",
    violet: "bg-violet text-white",
    emerald: "bg-emerald text-white",
    rose: "bg-rose text-white",
  };
  return (
    <button onClick={() => onClick(value)} disabled={saving !== null} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50 ${tones[tone]}`}>
      {saving === value ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}{label}
    </button>
  );
}
