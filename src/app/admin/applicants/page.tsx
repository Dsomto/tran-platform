"use client";

import { useState, useEffect, useCallback } from "react";
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
  Search,
  Users,
  Clock,
  UserCheck,
  UserX,
  Download,
  Link2,
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
  referralCode: string;
  referredBy: string | null;
  referralCount: number;
  status: string;
  stage: number;
  stageStatus: string;
  createdAt: string;
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
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<PublicApp | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    avatarUrl: null as string | null,
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => d.user && setUser(d.user));
  }, []);

  // Fetch counts for all statuses
  const fetchCounts = useCallback(async () => {
    const [p, a, r] = await Promise.all([
      fetch("/api/public-applications?status=pending&limit=1").then((r) => r.json()),
      fetch("/api/public-applications?status=approved&limit=1").then((r) => r.json()),
      fetch("/api/public-applications?status=rejected&limit=1").then((r) => r.json()),
    ]);
    setCounts({
      pending: p.pagination?.total || 0,
      approved: a.pagination?.total || 0,
      rejected: r.pagination?.total || 0,
    });
  }, []);

  const fetchApps = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: filter,
        page: String(page),
        limit: "20",
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/public-applications?${params}`);
      const data = await res.json();
      setApplications(data.applications || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
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

  async function handleReview(id: string, action: "approved" | "rejected") {
    setIsReviewing(true);
    try {
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

  async function handleBulkReview(action: "approved" | "rejected") {
    if (selectedIds.size === 0) return;
    setIsReviewing(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/public-applications/${id}/review`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
          })
        )
      );
      setSelectedIds(new Set());
      fetchApps();
      fetchCounts();
    } finally {
      setIsReviewing(false);
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

    const headers = ["Name", "Email", "Country", "Age Range", "Gender", "Status", "Track", "Dedication", "Experience", "Goals", "Referral Code", "Referred By", "Referrals", "Applied"];
    const rows = allApps.map((a) => [
      a.fullName, a.email, a.country, a.ageRange, a.gender || "", a.currentStatus,
      getTrackLabel(a.trackInterest), a.dedication, `"${a.experience.replace(/"/g, '""')}"`,
      `"${a.goals.replace(/"/g, '""')}"`, a.referralCode, a.referredBy || "", a.referralCount,
      formatDate(a.createdAt),
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
  };

  const filterTabs = [
    { key: "pending", label: "Pending", icon: Clock, count: counts.pending },
    { key: "approved", label: "Approved", icon: UserCheck, count: counts.approved },
    { key: "rejected", label: "Rejected", icon: UserX, count: counts.rejected },
  ];

  return (
    <>
      <Topbar
        title="Public Applications"
        subtitle={`${counts.pending + counts.approved + counts.rejected} total applications`}
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
              onClick={() => { setFilter(tab.key); setPage(1); setSelectedIds(new Set()); }}
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
            {filter === "pending" && selectedIds.size > 0 && (
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
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-1" />
              Export CSV
            </Button>
          </div>
        </div>

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

                {/* Referral info */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="flex items-center gap-1.5 bg-blue/5 px-3 py-1.5 rounded-lg">
                    <Link2 className="w-3.5 h-3.5 text-blue" />
                    <span className="text-xs font-medium text-blue">Code: {selected.referralCode}</span>
                  </div>
                  {selected.referredBy && (
                    <div className="flex items-center gap-1.5 bg-primary/5 px-3 py-1.5 rounded-lg">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-medium text-primary">Referred by: {selected.referredBy}</span>
                    </div>
                  )}
                  {selected.referralCount > 0 && (
                    <div className="flex items-center gap-1.5 bg-accent/5 px-3 py-1.5 rounded-lg">
                      <UserCheck className="w-3.5 h-3.5 text-accent" />
                      <span className="text-xs font-medium text-accent">{selected.referralCount} referral{selected.referralCount !== 1 ? "s" : ""}</span>
                    </div>
                  )}
                  {selected.referralSource && (
                    <div className="flex items-center gap-1.5 bg-border-light px-3 py-1.5 rounded-lg">
                      <span className="text-xs text-muted">Source: {selected.referralSource}</span>
                    </div>
                  )}
                </div>

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
                  </div>
                )}

                {/* Review actions */}
                {selected.status === "pending" && (
                  <div className="border-t border-border pt-4 flex gap-3">
                    <Button
                      onClick={() => handleReview(selected.id, "approved")}
                      isLoading={isReviewing}
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
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
            {(filter === "pending" || filter === "approved") && applications.length > 0 && (
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-border">
                <input
                  type="checkbox"
                  checked={selectedIds.size === applications.length && applications.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-border text-blue focus:ring-blue/20 cursor-pointer accent-blue"
                />
                <span className="text-xs text-muted">
                  {selectedIds.size > 0
                    ? `${selectedIds.size} of ${total} selected`
                    : `Select all`}
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
                    {(filter === "pending" || filter === "approved") && (
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
                        {app.referralCount > 0 && (
                          <span className="text-[10px] font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">
                            {app.referralCount} referral{app.referralCount !== 1 ? "s" : ""}
                          </span>
                        )}
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
            </div>
          </div>
        )}
      </div>
    </>
  );
}
