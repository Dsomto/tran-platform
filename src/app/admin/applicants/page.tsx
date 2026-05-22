"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Users,
  Clock,
  UserCheck,
  UserX,
  Hourglass,
  Sparkles,
  Download,
  Mail,
  Globe,
  Target,
  Briefcase,
  GraduationCap,
  Calendar,
  ArrowUpRight,
  Slash,
  Shield,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { canSendEmails } from "@/lib/email-permissions";

interface PublicApp {
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
  referralSource: string | null;
  whyPickYou: string | null;
  status: string;
  stage: number;
  stageStatus: string;
  createdAt: string;
  // Present only on rows from the Recommended tab.
  _score?: number;
  _reasons?: string[];
}

const trackLabels: Record<string, string> = {
  soc: "SOC Analysis",
  ethical_hacking: "Ethical Hacking",
  grc: "GRC",
  "SOC Analysis": "SOC Analysis",
  "Ethical Hacking": "Ethical Hacking",
  GRC: "GRC",
};

function getTrackLabel(track: string) {
  return trackLabels[track] || track;
}

export default function ApplicantsPage() {
  const [applications, setApplications] = useState<PublicApp[]>([]);
  // The open tab is driven by the URL (?tab=) so the sidebar's Recommended /
  // Waitlist links land directly on the right view. Initialise from the URL
  // to avoid a flash, then keep it in sync via the effect below.
  const TABS = ["recommended", "pending", "approved", "waitlisted", "rejected"];
  const [filter, setFilter] = useState(() => {
    if (typeof window === "undefined") return "pending";
    const t = new URLSearchParams(window.location.search).get("tab");
    return TABS.includes(t ?? "") ? (t as string) : "pending";
  });
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<PublicApp | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [counts, setCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    waitlisted: 0,
    recommended: 0,
  });
  // How many approved / rejected applicants still owe a decision email.
  const [pendingEmails, setPendingEmails] = useState({ welcomePending: 0, rejectionPending: 0 });
  const [sendingBatch, setSendingBatch] = useState(false);
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    avatarUrl: null as string | null,
  });
  // Sending is locked to one account regardless of role (see canSendEmails).
  const canSend = canSendEmails(user.email);

  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => d.user && setUser(d.user));
  }, []);

  // Keep the open tab in sync with the URL — covers sidebar navigation to
  // ?tab=recommended / ?tab=waitlisted while already on this page.
  useEffect(() => {
    const t = TABS.includes(urlTab ?? "") ? (urlTab as string) : "pending";
    setFilter(t);
    setPage(1);
    setSelectedIds(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlTab]);

  // Fetch counts for all statuses
  const fetchCounts = useCallback(async () => {
    const [p, a, r, w] = await Promise.all([
      fetch("/api/public-applications?status=pending&limit=1").then((r) => r.json()),
      fetch("/api/public-applications?status=approved&limit=1").then((r) => r.json()),
      fetch("/api/public-applications?status=rejected&limit=1").then((r) => r.json()),
      fetch("/api/public-applications?status=waitlisted&limit=1").then((r) => r.json()),
    ]);
    setCounts((c) => ({
      ...c,
      pending: p.pagination?.total || 0,
      approved: a.pagination?.total || 0,
      rejected: r.pagination?.total || 0,
      waitlisted: w.pagination?.total || 0,
    }));
    // Pull the decision-email backlog so the toolbar can show
    // "Send N pending welcome emails" with a live count.
    try {
      const pe = await fetch("/api/admin/applicants/send-pending").then((x) => x.json());
      setPendingEmails({
        welcomePending: pe.welcomePending || 0,
        rejectionPending: pe.rejectionPending || 0,
      });
    } catch {
      /* non-fatal — leave counts as-is */
    }
  }, []);

  async function sendPendingBatch(type: "welcome" | "rejection") {
    const count = type === "welcome" ? pendingEmails.welcomePending : pendingEmails.rejectionPending;
    if (count === 0) return;
    const label = type === "welcome" ? "welcome" : "decline";
    if (!confirm(`Queue ${count} pending ${label} email${count === 1 ? "" : "s"} for delivery? This covers every ${type === "welcome" ? "approved" : "rejected"} applicant who hasn't been emailed yet. They send in the background — no need to keep this tab open.`)) {
      return;
    }
    setSendingBatch(true);
    try {
      const res = await fetch("/api/admin/applicants/send-pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Couldn't queue emails: ${data.error || "unknown"}`);
      } else {
        const skippedNote =
          data.skipped > 0
            ? `\n\n${data.skipped} skipped — onboarding incomplete for those applicants, re-approve them.`
            : "";
        alert(
          `${data.queued} ${label} email${data.queued === 1 ? "" : "s"} queued for delivery.\n\n` +
            `They send in the background over the next while. Track delivery and retry any failures on the Email Queue page (/admin/emails).${skippedNote}`
        );
        fetchCounts();
      }
    } catch {
      alert("Network error while queueing emails.");
    } finally {
      setSendingBatch(false);
    }
  }

  const fetchApps = useCallback(async () => {
    setIsLoading(true);
    try {
      // The Recommended tab is scored server-side; everything else is a
      // plain status filter. Both return the same { applications, pagination }
      // shape so the rendering below is shared.
      const url =
        filter === "recommended"
          ? `/api/admin/applicants/recommended?page=${page}&limit=20`
          : `/api/public-applications?${new URLSearchParams({
              status: filter,
              page: String(page),
              limit: "20",
              ...(search ? { search } : {}),
            })}`;

      const res = await fetch(url);
      const data = await res.json();
      setApplications(data.applications || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
      if (filter === "recommended") {
        setCounts((c) => ({ ...c, recommended: data.pagination?.total || 0 }));
      }
    } finally {
      setIsLoading(false);
    }
  }, [filter, page, search]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  async function handleReview(id: string, action: "approved" | "rejected" | "waitlisted") {
    setIsReviewing(true);
    try {
      // Decision only — no email goes out here. The applicant lands in the
      // approved/rejected pool; emails are sent later in a batch.
      await fetch(`/api/public-applications/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setSelected(null);
      setSelectedIds(new Set());
      fetchApps();
      fetchCounts();
    } catch (err) {
      console.error(err);
    } finally {
      setIsReviewing(false);
    }
  }

  async function handleBulkReview(action: "approved" | "rejected" | "waitlisted") {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);

    // Process in batches of 20. Each /review is decision-only (no email),
    // so this is fast — a cohort of 500 records in well under a minute.
    const BATCH_SIZE = 20;
    setIsReviewing(true);
    setBulkProgress({ done: 0, total: ids.length });

    try {
      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = ids.slice(i, i + BATCH_SIZE);
        await Promise.allSettled(
          batch.map((id) =>
            fetch(`/api/public-applications/${id}/review`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action }),
            })
          )
        );
        setBulkProgress({ done: Math.min(i + BATCH_SIZE, ids.length), total: ids.length });
      }

      setSelectedIds(new Set());
      await Promise.all([fetchApps(), fetchCounts()]);

      // No emails went out — tell the admin where to trigger the batch send.
      const n = ids.length;
      const s = n === 1 ? "" : "s";
      if (action === "approved") {
        alert(
          `Approved ${n} applicant${s}.\n\nNo emails sent yet. Go to the Approved tab and click "Send welcome emails" when you're ready to notify them all at once.`
        );
      } else if (action === "waitlisted") {
        alert(
          `Moved ${n} applicant${s} to the waitlist.\n\nNo emails sent yet. Go to Decision Emails → Waitlist to notify them, or review them from the Waitlisted tab later to approve or reject.`
        );
      } else {
        alert(
          `Rejected ${n} applicant${s}.\n\nNo emails sent yet. Go to the Rejected tab and click "Send decline emails" when you're ready.`
        );
      }
    } finally {
      setIsReviewing(false);
      setBulkProgress(null);
    }
  }

  // Approve every applicant on the Recommended list in one action. Records
  // the decision only — no emails go out (they're sent later from Decision
  // Emails). Same batched, conditional-claim review as handleBulkReview.
  async function approveAllRecommended() {
    if (
      !confirm(
        `Approve all ${total} recommended applicant${total === 1 ? "" : "s"}?\n\n` +
          "This records the decision for every one of them. No emails go out " +
          "yet — you can still review them in Decision Emails before sending."
      )
    ) {
      return;
    }
    setIsReviewing(true);
    try {
      const idRes = await fetch("/api/admin/applicants/recommended?ids=1");
      const idData = await idRes.json();
      const ids: string[] = idData.ids || [];
      const BATCH_SIZE = 20;
      setBulkProgress({ done: 0, total: ids.length });
      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = ids.slice(i, i + BATCH_SIZE);
        await Promise.allSettled(
          batch.map((id) =>
            fetch(`/api/public-applications/${id}/review`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "approved" }),
            })
          )
        );
        setBulkProgress({ done: Math.min(i + BATCH_SIZE, ids.length), total: ids.length });
      }
      setSelectedIds(new Set());
      await Promise.all([fetchApps(), fetchCounts()]);
      alert(
        `Approved ${ids.length} recommended applicant${ids.length === 1 ? "" : "s"}.\n\n` +
          'No emails sent yet — go to Decision Emails and click "Send welcome emails" when ready.'
      );
    } finally {
      setIsReviewing(false);
      setBulkProgress(null);
    }
  }

  async function handleStageAction(id: string, action: "advance" | "eliminate") {
    setIsReviewing(true);
    try {
      await fetch(`/api/public-applications/${id}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setSelected(null);
      setSelectedIds(new Set());
      fetchApps();
      fetchCounts();
    } catch (err) {
      console.error(err);
    } finally {
      setIsReviewing(false);
    }
  }

  async function handleBulkStage(action: "advance" | "eliminate") {
    if (selectedIds.size === 0) return;
    setIsReviewing(true);
    try {
      await fetch("/api/public-applications/bulk-stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), action }),
      });
      setSelectedIds(new Set());
      fetchApps();
      fetchCounts();
    } finally {
      setIsReviewing(false);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === applications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(applications.map((a) => a.id)));
    }
  }

  async function handleExportCSV() {
    const allApps: PublicApp[] = [];
    let p = 1;
    let hasMore = true;
    while (hasMore) {
      const params = new URLSearchParams({ status: filter, page: String(p), limit: "50" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/public-applications?${params}`);
      const data = await res.json();
      allApps.push(...(data.applications || []));
      hasMore = p < (data.pagination?.totalPages || 1);
      p++;
    }

    const headers = ["Name", "Email", "Country", "Age Range", "Gender", "Status", "Track", "Dedication", "Experience", "Goals", "Why Pick Them", "Applied"];
    // Quote and escape EVERY cell — names, countries and free-text fields can
    // all contain commas, quotes or newlines that would otherwise corrupt the
    // CSV column layout.
    const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = allApps.map((a) => [
      esc(a.fullName), esc(a.email), esc(a.country), esc(a.ageRange),
      esc(a.gender || ""), esc(a.currentStatus), esc(getTrackLabel(a.trackInterest)),
      esc(a.dedication), esc(a.experience), esc(a.goals),
      esc(a.whyPickYou || ""), esc(formatDate(a.createdAt)),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ubi-applications-${filter}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const statusColors: Record<string, "warning" | "success" | "danger"> = {
    pending: "warning",
    approved: "success",
    rejected: "danger",
    waitlisted: "warning",
  };

  const filterTabs = [
    { key: "recommended", label: "Recommended", icon: Sparkles, count: counts.recommended },
    { key: "pending", label: "Pending", icon: Clock, count: counts.pending },
    { key: "approved", label: "Approved", icon: UserCheck, count: counts.approved },
    { key: "waitlisted", label: "Waitlisted", icon: Hourglass, count: counts.waitlisted },
    { key: "rejected", label: "Rejected", icon: UserX, count: counts.rejected },
  ];

  return (
    <>
      <Topbar
        title="Public Applications"
        subtitle={`${counts.pending + counts.approved + counts.rejected + counts.waitlisted} total applications`}
        firstName={user.firstName}
        lastName={user.lastName}
        avatarUrl={user.avatarUrl}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => router.replace(`/admin/applicants?tab=${tab.key}`, { scroll: false })}
              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                filter === tab.key
                  ? "border-blue/30 bg-blue/5 shadow-lg shadow-blue/10"
                  : "border-border bg-white hover:border-blue/10"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                filter === tab.key ? "bg-blue text-white" : "bg-border-light text-muted"
              }`}>
                <tab.icon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-foreground">{tab.count}</p>
                <p className="text-xs text-muted">{tab.label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Search + actions bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search by name, email, country, or referral code..."
              icon={<Search className="w-4 h-4" />}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {filter === "recommended" && applications.length > 0 && (
              <Button
                size="sm"
                onClick={approveAllRecommended}
                isLoading={isReviewing}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Approve all {total}
              </Button>
            )}
            {(filter === "pending" || filter === "recommended") &&
              selectedIds.size > 0 && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleBulkReview("approved")}
                  isLoading={isReviewing}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve ({selectedIds.size})
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleBulkReview("waitlisted")}
                  isLoading={isReviewing}
                >
                  <Hourglass className="w-4 h-4 mr-1" />
                  Waitlist ({selectedIds.size})
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleBulkReview("rejected")}
                  isLoading={isReviewing}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject ({selectedIds.size})
                </Button>
              </>
            )}
            {filter === "approved" && selectedIds.size > 0 && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleBulkStage("advance")}
                  isLoading={isReviewing}
                >
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  Advance ({selectedIds.size})
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleBulkStage("eliminate")}
                  isLoading={isReviewing}
                >
                  <Slash className="w-4 h-4 mr-1" />
                  Eliminate ({selectedIds.size})
                </Button>
              </>
            )}
            {/* Batch decision-email senders. Approving / rejecting only
                records the decision now — these buttons fan the emails out
                when the admin is ready. Shown on the relevant tab only. */}
            {filter === "approved" && pendingEmails.welcomePending > 0 && canSend && (
              <Button
                size="sm"
                onClick={() => sendPendingBatch("welcome")}
                isLoading={sendingBatch}
              >
                <Mail className="w-4 h-4 mr-1" />
                Send {pendingEmails.welcomePending} welcome email{pendingEmails.welcomePending === 1 ? "" : "s"}
              </Button>
            )}
            {filter === "rejected" && pendingEmails.rejectionPending > 0 && canSend && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => sendPendingBatch("rejection")}
                isLoading={sendingBatch}
              >
                <Mail className="w-4 h-4 mr-1" />
                Send {pendingEmails.rejectionPending} decline email{pendingEmails.rejectionPending === 1 ? "" : "s"}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-1" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Bulk-action progress bar — shown only while a bulk approve/reject
            is running so the admin sees "Approving N of M…" rather than a
            frozen page. */}
        {bulkProgress && (
          <div className="mb-4 p-4 bg-blue/5 border border-blue/30 rounded-xl">
            <div className="text-sm font-medium text-foreground mb-2">
              Processing {bulkProgress.done} of {bulkProgress.total}…
            </div>
            <div className="h-2 bg-border-light rounded-full overflow-hidden">
              <div
                className="h-full bg-blue transition-all"
                style={{
                  width: `${(bulkProgress.done / Math.max(1, bulkProgress.total)) * 100}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-muted mt-2">
              Recording decisions only — no emails are sent yet. Don&apos;t close this tab.
            </p>
          </div>
        )}

        {/* Application Detail Modal */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4">
            <Card
              variant="glass"
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <CardContent>
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                      {selected.fullName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="w-3.5 h-3.5 text-muted" />
                      <a href={`mailto:${selected.email}`} className="text-sm text-blue hover:underline">
                        {selected.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusColors[selected.status]} size="md">
                      {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                    </Badge>
                    <button
                      onClick={() => setSelected(null)}
                      className="p-2 rounded-xl hover:bg-surface-hover text-muted cursor-pointer"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-start gap-2">
                    <Globe className="w-4 h-4 text-muted mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted">Country</p>
                      <p className="text-sm font-medium text-foreground">{selected.country}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-muted mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted">Age Range</p>
                      <p className="text-sm font-medium text-foreground">{selected.ageRange}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-muted mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted">Gender</p>
                      <p className="text-sm font-medium text-foreground">{selected.gender || "Not specified"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Briefcase className="w-4 h-4 text-muted mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted">Current Status</p>
                      <p className="text-sm font-medium text-foreground">{selected.currentStatus}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-muted mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted">Track Interest</p>
                      <p className="text-sm font-medium text-foreground">{getTrackLabel(selected.trackInterest)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-muted mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted">Dedication</p>
                      <p className="text-sm font-medium text-foreground">{selected.dedication}</p>
                    </div>
                  </div>
                </div>

                {/* Experience */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="w-4 h-4 text-muted" />
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">Experience</p>
                  </div>
                  <div className="bg-surface-hover rounded-xl p-4">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selected.experience}</p>
                  </div>
                </div>

                {/* Goals */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-muted" />
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">Goals</p>
                  </div>
                  <div className="bg-surface-hover rounded-xl p-4">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selected.goals}</p>
                  </div>
                </div>

                {/* Why pick you — the differentiator answer */}
                {selected.whyPickYou && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-muted" />
                      <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                        Why we should pick them
                      </p>
                    </div>
                    <div className="bg-surface-hover rounded-xl p-4">
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {selected.whyPickYou}
                      </p>
                    </div>
                  </div>
                )}

                {selected.referralSource && (
                  <div className="flex flex-wrap gap-3 mb-6">
                    <div className="flex items-center gap-1.5 bg-border-light px-3 py-1.5 rounded-lg">
                      <span className="text-xs text-muted">Source: {selected.referralSource}</span>
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted mb-6">
                  Applied {formatDate(selected.createdAt)}
                </p>

                {/* Stage info for approved applicants */}
                {selected.status === "approved" && selected.stage >= 0 && (
                  <div className="border-t border-border pt-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue" />
                        <span className="text-sm font-semibold text-foreground">
                          {selected.stage === 10 ? "Finalist" : `Stage ${selected.stage}`}
                        </span>
                      </div>
                      <Badge
                        variant={selected.stageStatus === "active" ? "success" : selected.stageStatus === "eliminated" ? "danger" : "primary"}
                        size="sm"
                      >
                        {selected.stageStatus === "active" ? "Active" : selected.stageStatus === "eliminated" ? "Eliminated" : "Advanced"}
                      </Badge>
                    </div>
                    {/* Stage progress bar */}
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: 10 }, (_, i) => (
                        <div
                          key={i}
                          className={`h-2 flex-1 rounded-full ${
                            i < selected.stage ? "bg-blue" :
                            i === selected.stage && selected.stageStatus === "active" ? "bg-blue animate-pulse" :
                            "bg-border-light"
                          }`}
                        />
                      ))}
                    </div>
                    {/* Resend welcome email — for when the original landed in spam
                        or got lost. Reuses the existing stored credentials.
                        Sending is locked to the authorised account. */}
                    {canSend && (
                    <button
                      onClick={async () => {
                        if (!confirm(`Resend the welcome email (with login credentials) to ${selected.email}?`)) return;
                        try {
                          const res = await fetch(`/api/public-applications/${selected.id}/resend-welcome`, { method: "POST" });
                          const data = await res.json();
                          if (!res.ok || data.emailSent === false) {
                            alert(`Resend FAILED.\n\nReason: ${data.emailError || data.error || "unknown"}\n\nCheck Vercel logs for [email:send] lines.`);
                          } else {
                            alert(`Welcome email re-sent to ${data.sentTo}.\n\nIf they still don't see it, ask them to check spam/junk and the Resend dashboard at https://resend.com/emails for delivery status.`);
                          }
                        } catch {
                          alert("Network error trying to resend.");
                        }
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted/50"
                    >
                      Resend welcome email
                    </button>
                    )}
                  </div>
                )}

                {/* Why the recommender scored this applicant */}
                {selected._reasons && selected._reasons.length > 0 && (
                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue" />
                      Why this scored {selected._score}
                    </p>
                    <ul className="space-y-1.5">
                      {selected._reasons.map((r, i) => (
                        <li key={i} className="text-sm text-foreground/80 flex gap-2">
                          <span className="text-blue shrink-0">&bull;</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Review actions — shown for fresh applications and for
                    waitlisted ones (so a waitlisted applicant can later be
                    approved or rejected). */}
                {(selected.status === "pending" || selected.status === "waitlisted") && (
                  <div className="border-t border-border pt-4 flex gap-3">
                    <Button
                      onClick={() => handleReview(selected.id, "approved")}
                      isLoading={isReviewing}
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    {selected.status === "pending" && (
                      <Button
                        variant="secondary"
                        onClick={() => handleReview(selected.id, "waitlisted")}
                        isLoading={isReviewing}
                        className="flex-1"
                      >
                        <Hourglass className="w-4 h-4 mr-2" />
                        Waitlist
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      onClick={() => handleReview(selected.id, "rejected")}
                      isLoading={isReviewing}
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}

                {/* Stage actions for active approved applicants */}
                {selected.status === "approved" && selected.stageStatus === "active" && (
                  <div className="border-t border-border pt-4 flex gap-3">
                    <Button
                      onClick={() => handleStageAction(selected.id, "advance")}
                      isLoading={isReviewing}
                      className="flex-1"
                    >
                      <ArrowUpRight className="w-4 h-4 mr-2" />
                      Advance to Stage {selected.stage + 1}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleStageAction(selected.id, "eliminate")}
                      isLoading={isReviewing}
                      className="flex-1"
                    >
                      <Slash className="w-4 h-4 mr-2" />
                      Eliminate
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Applications table */}
        <Card variant="glass">
          <CardContent>
            {/* Select all header */}
            {(filter === "pending" ||
              filter === "approved" ||
              filter === "recommended") &&
              applications.length > 0 && (
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-border">
                <input
                  type="checkbox"
                  checked={selectedIds.size === applications.length && applications.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-border text-blue focus:ring-blue/20 cursor-pointer accent-blue"
                />
                <span className="text-xs text-muted">
                  {selectedIds.size > 0
                    ? `${selectedIds.size} selected on this page`
                    : `Select all on this page`}
                </span>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-20">
                <div className="w-8 h-8 border-2 border-blue/20 border-t-blue rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted">Loading applications...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-20">
                <Users className="w-10 h-10 text-muted/30 mx-auto mb-3" />
                <p className="text-sm text-muted">
                  {search
                    ? `No ${filter} applications matching "${search}"`
                    : `No ${filter} applications found.`}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-colors hover:bg-surface-hover ${
                      selectedIds.has(app.id) ? "bg-blue/5" : ""
                    }`}
                  >
                    {(filter === "pending" ||
                      filter === "approved" ||
                      filter === "recommended") && (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(app.id)}
                        onChange={() => toggleSelect(app.id)}
                        className="w-4 h-4 rounded border-border text-blue focus:ring-blue/20 cursor-pointer accent-blue shrink-0"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {app.fullName}
                        </p>
                      </div>
                      <p className="text-xs text-muted truncate">{app.email}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="primary" size="sm">
                          {getTrackLabel(app.trackInterest)}
                        </Badge>
                        <span className="text-xs text-muted">
                          {app.country}
                        </span>
                        <span className="text-xs text-muted">
                          &bull; {formatDate(app.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {app._score != null && (
                        <Badge
                          variant={
                            app._score >= 60
                              ? "success"
                              : app._score >= 42
                              ? "warning"
                              : "danger"
                          }
                          size="sm"
                        >
                          Score {app._score}
                        </Badge>
                      )}
                      {app.status === "approved" && app.stage >= 0 && (
                        <Badge variant={app.stageStatus === "eliminated" ? "danger" : "primary"} size="sm">
                          {app.stageStatus === "eliminated" ? "Eliminated" : app.stage === 10 ? "Finalist" : `Stage ${app.stage}`}
                        </Badge>
                      )}
                      {app.status !== "approved" && (
                        <Badge variant={statusColors[app.status]} size="sm">
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelected(app)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-xs text-muted">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(1)}
                title="First page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="flex items-center text-sm text-muted px-3">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(totalPages)}
                title="Last page"
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
